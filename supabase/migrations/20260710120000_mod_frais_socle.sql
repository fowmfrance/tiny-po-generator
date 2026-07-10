-- =====================================================================
-- Module Frais & Attribution — Socle Sprint 1 (option A : pivot mince)
-- Réf : docs/spec-module-frais-attribution.md
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
--   Connexions OAuth/API par org et par user. Tokens en Vault (refs).
--   Sprint 1 : google_calendar seulement. Qonto reste sur bank_connections.
-- =====================================================================
CREATE TABLE public.integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN
    ('google_calendar','bridge','powens','spendesk','pleo','qonto','hubspot','pipedrive')),
  external_account_id text,             -- email du calendar, id compte bancaire…
  access_token_ref text NOT NULL,       -- référence Vault, jamais le token en clair
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
-- 3.3  calendar_events
--   Miroir local des événements (fenêtre −90j / +7j). Donnée PERSO :
--   RLS strictement user — le DAF n'y accède JAMAIS au niveau table
--   (l'accès admin au détail d'un RDV passe par un match confirmé, géré
--   plus tard via vue dédiée, pas ici). cf. §6.2 du doc.
-- =====================================================================
CREATE TABLE public.calendar_events (
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

CREATE INDEX idx_calevt_user_start ON public.calendar_events(user_id, starts_at);

CREATE TRIGGER trg_calevt_org BEFORE INSERT ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();
CREATE TRIGGER trg_calevt_touch BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own calendar - select" ON public.calendar_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own calendar - insert" ON public.calendar_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own calendar - update" ON public.calendar_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own calendar - delete" ON public.calendar_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =====================================================================
-- 3.4  receipts
--   Justificatifs (canal perso). Conservation 6 ans (valeur probante).
--   Stockage bucket privé 'receipts'.
-- =====================================================================
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,           -- 'receipts/<user_id>/<file>'
  ocr_status text NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending','done','failed')),
  ocr_merchant text,
  ocr_amount numeric(12,2),
  ocr_vat numeric(12,2),
  ocr_date date,
  ocr_raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_receipts_user ON public.receipts(user_id);

CREATE TRIGGER trg_receipts_org BEFORE INSERT ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own receipts - select" ON public.receipts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own receipts - insert" ON public.receipts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own receipts - update" ON public.receipts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own receipts - delete" ON public.receipts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =====================================================================
-- 3.2  expense_events — pivot MINCE (option A)
--   Une transaction Qonto reste dans public.transactions ; on ne crée un
--   expense_event que pour l'attribution. source='card_platform' ⇒
--   transaction_id renseigné, montant/date/marchand dérivés de transactions.
--   source='receipt_only'/'manual' ⇒ dépense autonome.
-- =====================================================================
CREATE TABLE public.expense_events (
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
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  gl_account text,                      -- compte PCG proposé (625100, 625700…)
  status text NOT NULL DEFAULT 'new' CHECK (status IN
    ('new','suggested','confirmed','rejected','no_context','exported')),
  reimbursable boolean NOT NULL DEFAULT false,  -- true si receipt_only (perso)
  reimbursement_status text CHECK (reimbursement_status IN ('pending','approved','paid')),
  receipt_id uuid REFERENCES public.receipts(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- anti-doublon sources externes non-Qonto (Qonto dédoublonné via transactions)
  UNIQUE (organization_id, source, external_txn_id)
);

CREATE INDEX idx_expevt_user_occurred ON public.expense_events(user_id, occurred_at DESC);
CREATE INDEX idx_expevt_status ON public.expense_events(organization_id, status);
CREATE INDEX idx_expevt_txn ON public.expense_events(transaction_id) WHERE transaction_id IS NOT NULL;

CREATE TRIGGER trg_expevt_org BEFORE INSERT ON public.expense_events
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();
CREATE TRIGGER trg_expevt_touch BEFORE UPDATE ON public.expense_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.expense_events ENABLE ROW LEVEL SECURITY;

-- Perso : le porteur gère ses dépenses
CREATE POLICY "own expenses - select" ON public.expense_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own expenses - insert" ON public.expense_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own expenses - update" ON public.expense_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own expenses - delete" ON public.expense_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Vue org/DAF : lecture des dépenses de l'organisation (pas du calendrier)
CREATE POLICY "org expenses - select" ON public.expense_events
  FOR SELECT TO authenticated USING (
    organization_id = public.current_user_organization_id()
    OR public.has_role(auth.uid(), 'admin-sapajoo')
  );

-- =====================================================================
-- 3.6  expense_matches — la jointure dépense ↔ contexte
--   user_id / organization_id dénormalisés depuis l'expense parent (trigger)
--   pour des policies RLS plates. Un match actif par dépense.
-- =====================================================================
CREATE TABLE public.expense_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  expense_id uuid NOT NULL REFERENCES public.expense_events(id) ON DELETE CASCADE,
  calendar_event_id uuid REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  crm_account_id uuid,                  -- FK ajoutée au Sprint 3 (crm_accounts)
  crm_deal_id uuid,                     -- FK ajoutée au Sprint 3 (crm_deals)
  confidence numeric(5,2) NOT NULL,     -- 0–100
  signals jsonb NOT NULL,               -- détail du score, cf. §5
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN
    ('suggested','confirmed','rejected','auto_confirmed')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (expense_id)
);

CREATE INDEX idx_expmatch_user ON public.expense_matches(user_id);
CREATE INDEX idx_expmatch_calevt ON public.expense_matches(calendar_event_id);

-- Dénormalise user_id + organization_id depuis l'expense parent
CREATE OR REPLACE FUNCTION public.set_match_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.organization_id IS NULL THEN
    SELECT user_id, organization_id INTO NEW.user_id, NEW.organization_id
    FROM public.expense_events WHERE id = NEW.expense_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_expmatch_owner BEFORE INSERT ON public.expense_matches
  FOR EACH ROW EXECUTE FUNCTION public.set_match_owner();

ALTER TABLE public.expense_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own matches - select" ON public.expense_matches
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own matches - insert" ON public.expense_matches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own matches - update" ON public.expense_matches
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own matches - delete" ON public.expense_matches
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Vue org/DAF : lecture des matches (coût commercial), sans détail calendrier
CREATE POLICY "org matches - select" ON public.expense_matches
  FOR SELECT TO authenticated USING (
    organization_id = public.current_user_organization_id()
    OR public.has_role(auth.uid(), 'admin-sapajoo')
  );

-- =====================================================================
-- Storage : bucket privé 'receipts', scopé par dossier user_id
--   (chemin attendu : 'receipts/<auth.uid>/…') — pattern plus strict que
--   invoice-attachments car donnée perso.
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "receipts - read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "receipts - upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "receipts - delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
