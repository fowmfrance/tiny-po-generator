-- =====================================================================
-- Module Frais & Attribution — Socle Sprint 1 (option A : pivot mince)
-- Réf : docs/spec-module-frais-attribution.md
--
-- ⚠️ GLOSSAIRE ANTI-CONFUSION — le module « Notes de frais » (T&E) est
-- DISTINCT du flux budgétaire Sapajoo. Toutes ses tables portent le
-- préfixe te_ (Travel & Expenses) :
--   te_expenses          = frais terrain (resto, taxi, hôtel) — PAS une
--                          facture fournisseur, PAS une ligne budgétaire.
--   te_receipts          = reçus/tickets de caisse — PAS les pièces
--                          jointes de factures (invoice-attachments).
--   te_calendar_events   = miroir agenda Google (matching frais↔RDV).
--   te_expense_matches   = rattachement frais ↔ RDV (↔ compte CRM en v3).
--   expense_categories   = table CŒUR (catégorisation budgétaire des
--                          transactions) — le module la référence pour
--                          l'export compta, il ne la remplace pas.
-- Une transaction Qonto reste dans public.transactions (cœur) ; le module
-- ne fait que la RÉFÉRENCER (te_expenses.transaction_id), jamais la copier.
--
-- Convention Sapajoo : organization_id rempli par trigger depuis profiles
-- (jamais par le client), RLS à deux étages (perso user + vue org/DAF).
-- À jouer À LA MAIN dans Lovable (pas d'auto-déploiement). Tables neuves,
-- donc index simples sans risque (pas de CREATE INDEX à chaud sur données).
-- =====================================================================

-- Extension trigram pour la réconciliation marchand (§5 matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------
-- Helpers de trigger génériques (réutilisables par toutes les tables)
-- ---------------------------------------------------------------------

-- Renseigne organization_id depuis profiles via user_id si absent.
-- (même logique que set_bank_connection_org, généralisée)
CREATE OR REPLACE FUNCTION public.set_org_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.profiles WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Touch updated_at à chaque UPDATE.
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- 3.1  integration_connections
--   Connexions OAuth/API par org et par user. Tokens CHIFFRÉS via
--   encrypt_credential (pattern bank_connections), pas Vault.
--   Sprint 1 : google_calendar seulement. Qonto reste sur bank_connections.
--   PAS de préfixe te_ : infra partagée (servira aussi au CRM, Sprint 3).
-- =====================================================================
CREATE TABLE public.integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN
    ('google_calendar','bridge','powens','spendesk','pleo','qonto','hubspot','pipedrive')),
  external_account_id text,             -- email du calendar, id compte bancaire…
  access_token_ref text NOT NULL,       -- token CHIFFRÉ (encrypt_credential)
  refresh_token_ref text,
  token_expires_at timestamptz,
  sync_token text,                      -- syncToken Google / cursor API
  watch_channel_id text,                -- id du channel push Google
  watch_resource_id text,
  watch_expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','error','revoked')),
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, provider, external_account_id)
);
COMMENT ON TABLE public.integration_connections IS
  'Connexions OAuth/API externes (agenda, CRM…). Infra partagée, utilisée par le module Notes de frais (te_*). Qonto reste sur bank_connections.';

CREATE INDEX idx_intconn_user ON public.integration_connections(user_id);
CREATE INDEX idx_intconn_watch_exp ON public.integration_connections(watch_expires_at)
  WHERE watch_expires_at IS NOT NULL;

CREATE TRIGGER trg_intconn_org BEFORE INSERT ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();
CREATE TRIGGER trg_intconn_touch BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own connections - select" ON public.integration_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own connections - insert" ON public.integration_connections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own connections - update" ON public.integration_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own connections - delete" ON public.integration_connections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =====================================================================
-- 3.3  te_calendar_events
--   Miroir local des événements agenda (fenêtre −90j / +7j), pour le
--   matching des frais. Donnée PERSO : RLS strictement user — le DAF n'y
--   accède JAMAIS au niveau table (le détail d'un RDV ne remonte côté org
--   que via le snapshot posé sur un match CONFIRMÉ, cf. te_expense_matches).
-- =====================================================================
CREATE TABLE public.te_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  external_event_id text NOT NULL,      -- event.id Google
  ical_uid text,
  title text,
  description text,
  location_raw text,
  location_lat double precision,
  location_lng double precision,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  attendees jsonb NOT NULL DEFAULT '[]',  -- [{email, displayName, responseStatus, self}]
  -- is_external : booléen simple posé PAR LA SYNC (≥1 participant hors domaine
  -- du tenant). Pas une colonne générée : la vraie règle (domaine externe) ne
  -- peut pas se calculer en generated column. cf. §3.3 du doc.
  is_external boolean NOT NULL DEFAULT false,
  organizer_email text,
  google_status text,                   -- confirmed / cancelled
  raw jsonb,                            -- payload complet, debug/évolutions
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_event_id)
);
COMMENT ON TABLE public.te_calendar_events IS
  'Module Notes de frais — miroir agenda Google du collaborateur (donnée perso, RLS user only, purge 15 mois). Sert uniquement au matching frais↔RDV.';

CREATE INDEX idx_tecalevt_user_start ON public.te_calendar_events(user_id, starts_at);

CREATE TRIGGER trg_tecalevt_org BEFORE INSERT ON public.te_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();
CREATE TRIGGER trg_tecalevt_touch BEFORE UPDATE ON public.te_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.te_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own calendar - select" ON public.te_calendar_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own calendar - insert" ON public.te_calendar_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own calendar - update" ON public.te_calendar_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own calendar - delete" ON public.te_calendar_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =====================================================================
-- 3.4  te_receipts
--   Reçus / tickets de caisse (canal perso du module Notes de frais).
--   ≠ pièces jointes de factures fournisseurs (bucket invoice-attachments).
--   Conservation 6 ans (valeur probante). Bucket privé 'te-receipts'.
-- =====================================================================
CREATE TABLE public.te_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,           -- '<user_id>/<file>' dans le bucket te-receipts
  ocr_status text NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending','done','failed')),
  ocr_merchant text,
  ocr_amount numeric(12,2),
  ocr_vat numeric(12,2),
  ocr_date date,
  ocr_raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.te_receipts IS
  'Module Notes de frais — reçus/tickets de caisse photographiés. Rien à voir avec les factures fournisseurs (supplier_invoices / invoice-attachments).';

CREATE INDEX idx_tereceipts_user ON public.te_receipts(user_id);

CREATE TRIGGER trg_tereceipts_org BEFORE INSERT ON public.te_receipts
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();

ALTER TABLE public.te_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own receipts - select" ON public.te_receipts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own receipts - insert" ON public.te_receipts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own receipts - update" ON public.te_receipts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own receipts - delete" ON public.te_receipts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =====================================================================
-- 3.2  te_expenses — pivot MINCE (option A)
--   Un FRAIS terrain (T&E). Une transaction Qonto reste dans
--   public.transactions ; on ne crée un te_expense que pour l'attribution.
--   source='card_platform' ⇒ transaction_id renseigné, montant/date/marchand
--   dérivés de transactions. source='receipt_only'/'manual' ⇒ frais autonome.
--
--   Deux notions de catégorie, à NE PAS confondre :
--   - te_category           = TYPE DE FRAIS (restaurant/transport/hebergement/
--                             autre), vocabulaire fermé → moteur de matching + UI.
--   - expense_category_id   = FK vers expense_categories (catégorisation
--                             budgétaire CŒUR, partagée avec transactions)
--                             → export compta uniquement.
-- =====================================================================
CREATE TABLE public.te_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('bank_feed','card_platform','receipt_only','manual')),
  source_connection_id uuid REFERENCES public.integration_connections(id) ON DELETE SET NULL,
  -- Option A : lien vers la transaction Qonto existante (au lieu de recopier)
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  external_txn_id text,                 -- id transaction externe (dédoublonnage hors Qonto)
  merchant_raw text,
  merchant_clean text,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,  -- si marchand = fournisseur connu
  merchant_lat double precision,
  merchant_lng double precision,
  amount numeric(12,2) NOT NULL,        -- TTC, signe positif = débit
  currency char(3) NOT NULL DEFAULT 'EUR',
  vat_amount numeric(12,2),
  vat_rate numeric(5,2),
  occurred_at timestamptz NOT NULL,     -- date/heure réelle (pas la date de valeur)
  booked_at timestamptz,                -- date comptable (débit différé)
  te_category text CHECK (te_category IN ('restaurant','transport','hebergement','autre')),
  expense_category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  gl_account text,                      -- compte PCG proposé (625100, 625700…)
  status text NOT NULL DEFAULT 'new' CHECK (status IN
    ('new','suggested','confirmed','rejected','no_context','exported')),
  reimbursable boolean NOT NULL DEFAULT false,  -- true si receipt_only (perso)
  reimbursement_status text CHECK (reimbursement_status IN ('pending','approved','paid')),
  receipt_id uuid REFERENCES public.te_receipts(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- anti-doublon sources externes non-Qonto (Qonto dédoublonné via transactions)
  UNIQUE (organization_id, source, external_txn_id)
);
COMMENT ON TABLE public.te_expenses IS
  'Module Notes de frais — frais terrain (T&E) à rattacher à un RDV/compte. PAS une facture fournisseur, PAS une ligne budgétaire ; une transaction Qonto est seulement référencée via transaction_id.';
COMMENT ON COLUMN public.te_expenses.te_category IS
  'Type de frais (vocabulaire fermé) pour le matching et l''UI. Ne pas confondre avec expense_category_id (catégorisation budgétaire).';
COMMENT ON COLUMN public.te_expenses.expense_category_id IS
  'FK vers expense_categories (catégories budgétaires du cœur Sapajoo) — export compta uniquement.';

CREATE INDEX idx_teexp_user_occurred ON public.te_expenses(user_id, occurred_at DESC);
CREATE INDEX idx_teexp_status ON public.te_expenses(organization_id, status);
CREATE INDEX idx_teexp_txn ON public.te_expenses(transaction_id) WHERE transaction_id IS NOT NULL;

CREATE TRIGGER trg_teexp_org BEFORE INSERT ON public.te_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();
CREATE TRIGGER trg_teexp_touch BEFORE UPDATE ON public.te_expenses
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.te_expenses ENABLE ROW LEVEL SECURITY;

-- Perso : le porteur gère ses frais
CREATE POLICY "own expenses - select" ON public.te_expenses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own expenses - insert" ON public.te_expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own expenses - update" ON public.te_expenses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own expenses - delete" ON public.te_expenses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Vue org/DAF : lecture des frais de l'organisation (pas du calendrier)
CREATE POLICY "org expenses - select" ON public.te_expenses
  FOR SELECT TO authenticated USING (
    organization_id = public.current_user_organization_id()
    OR public.has_role(auth.uid(), 'admin-sapajoo')
  );

-- =====================================================================
-- 3.6  te_expense_matches — la jointure frais ↔ contexte
--   user_id / organization_id dénormalisés depuis le frais parent (trigger)
--   pour des policies RLS plates. Un match actif par frais.
--
--   Minimisation vie privée : le DAF (policy org) lit les matches mais PAS
--   te_calendar_events. Le détail du RDV (titre/date) n'est visible côté org
--   que via le SNAPSHOT matched_event_*, posé par trigger UNIQUEMENT quand
--   le match passe confirmed/auto_confirmed. Bonus : le snapshot survit à la
--   purge 15 mois du calendrier.
-- =====================================================================
CREATE TABLE public.te_expense_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  expense_id uuid NOT NULL REFERENCES public.te_expenses(id) ON DELETE CASCADE,
  calendar_event_id uuid REFERENCES public.te_calendar_events(id) ON DELETE SET NULL,
  crm_account_id uuid,                  -- FK ajoutée au Sprint 3 (crm_accounts)
  crm_deal_id uuid,                     -- FK ajoutée au Sprint 3 (crm_deals)
  confidence numeric(5,2) NOT NULL,     -- 0–100
  signals jsonb NOT NULL,               -- détail du score, cf. §5
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN
    ('suggested','confirmed','rejected','auto_confirmed')),
  -- Snapshot du RDV, posé au passage confirmed/auto_confirmed (cf. bloc ci-dessus)
  matched_event_title text,
  matched_event_starts_at timestamptz,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (expense_id)
);
COMMENT ON TABLE public.te_expense_matches IS
  'Module Notes de frais — rattachement frais↔RDV (et compte CRM en Sprint 3). signals = explicabilité du score + jeu d''apprentissage.';

CREATE INDEX idx_tematch_user ON public.te_expense_matches(user_id);
CREATE INDEX idx_tematch_calevt ON public.te_expense_matches(calendar_event_id);

-- Dénormalise user_id + organization_id depuis le frais parent
CREATE OR REPLACE FUNCTION public.te_set_match_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.organization_id IS NULL THEN
    SELECT user_id, organization_id INTO NEW.user_id, NEW.organization_id
    FROM public.te_expenses WHERE id = NEW.expense_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Snapshot du RDV quand le match devient confirmed/auto_confirmed.
-- SECURITY DEFINER : lit te_calendar_events au-delà de la RLS user (le trigger
-- tourne aussi quand match-expense écrit en service role — même chemin).
CREATE OR REPLACE FUNCTION public.te_snapshot_matched_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('confirmed','auto_confirmed')
     AND NEW.calendar_event_id IS NOT NULL
     AND NEW.matched_event_title IS NULL THEN
    SELECT title, starts_at
      INTO NEW.matched_event_title, NEW.matched_event_starts_at
    FROM public.te_calendar_events WHERE id = NEW.calendar_event_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tematch_owner BEFORE INSERT ON public.te_expense_matches
  FOR EACH ROW EXECUTE FUNCTION public.te_set_match_owner();
CREATE TRIGGER trg_tematch_snapshot BEFORE INSERT OR UPDATE ON public.te_expense_matches
  FOR EACH ROW EXECUTE FUNCTION public.te_snapshot_matched_event();

ALTER TABLE public.te_expense_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own matches - select" ON public.te_expense_matches
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own matches - insert" ON public.te_expense_matches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own matches - update" ON public.te_expense_matches
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own matches - delete" ON public.te_expense_matches
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Vue org/DAF : lecture des matches (coût commercial). Le détail RDV passe
-- par le snapshot matched_event_* (posé uniquement si confirmé), jamais par
-- te_calendar_events.
CREATE POLICY "org matches - select" ON public.te_expense_matches
  FOR SELECT TO authenticated USING (
    organization_id = public.current_user_organization_id()
    OR public.has_role(auth.uid(), 'admin-sapajoo')
  );

-- =====================================================================
-- Storage : bucket privé 'te-receipts', scopé par dossier user_id
--   (chemin attendu : '<auth.uid>/…') — pattern plus strict que
--   invoice-attachments car donnée perso. Bucket DISTINCT des pièces
--   de factures fournisseurs (invoice-attachments).
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('te-receipts', 'te-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "te-receipts - read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'te-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "te-receipts - upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'te-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "te-receipts - delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'te-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
