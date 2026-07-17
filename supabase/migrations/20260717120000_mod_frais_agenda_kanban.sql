-- =====================================================================
-- Module Notes de frais — kanban agenda persistant + sous-objets
-- À jouer À LA MAIN dans Lovable (SQL editor), après le socle.
--
-- 1. Classement kanban PERSISTANT sur les RDV (survit aux resynchros :
--    la sync n'écrit jamais kanban_bucket) + identifiant de série récurrente.
-- 2. te_agenda_rules : règle de classement par SÉRIE récurrente (un épisode
--    déplacé → option « toute la série », les épisodes futurs héritent).
-- 3. te_contacts / te_event_attendees : les participants deviennent des
--    SOUS-OBJETS contacts (prénom, nom, email) — brique du pipeline CRM
--    (résolution par email dans Sellsy → entreprise → démarche → CAC).
-- 4. te_places : les lieux deviennent des sous-objets réutilisables.
-- Donnée perso : RLS strictement user sur tout (comme te_calendar_events).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 4 d'abord (te_calendar_events.place_id y fait référence)
-- ---------------------------------------------------------------------
CREATE TABLE public.te_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,                  -- champ location brut (géocodage plus tard)
  lat double precision,
  lng double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, label)
);
COMMENT ON TABLE public.te_places IS
  'Module Notes de frais — lieux des RDV agenda (sous-objets réutilisables, futur géocodage).';

CREATE TRIGGER trg_teplaces_org BEFORE INSERT ON public.te_places
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();
ALTER TABLE public.te_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own places - select" ON public.te_places FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own places - insert" ON public.te_places FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own places - update" ON public.te_places FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own places - delete" ON public.te_places FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 1. Colonnes kanban / série / lieu sur les RDV
-- ---------------------------------------------------------------------
ALTER TABLE public.te_calendar_events
  ADD COLUMN IF NOT EXISTS kanban_bucket text
    CHECK (kanban_bucket IN ('cafes','dejeuners','diners','perso')),
  ADD COLUMN IF NOT EXISTS recurring_event_id text,
  ADD COLUMN IF NOT EXISTS place_id uuid REFERENCES public.te_places(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.te_calendar_events.kanban_bucket IS
  'Classement kanban POSÉ PAR L''UTILISATEUR (drag & drop). NULL = classement auto (libellé/créneau). Jamais écrit par la sync.';

CREATE INDEX IF NOT EXISTS idx_tecalevt_recurring
  ON public.te_calendar_events(recurring_event_id) WHERE recurring_event_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2. Règles de classement par série récurrente
-- ---------------------------------------------------------------------
CREATE TABLE public.te_agenda_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recurring_event_id text NOT NULL,
  kanban_bucket text NOT NULL CHECK (kanban_bucket IN ('cafes','dejeuners','diners','perso')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recurring_event_id)
);
COMMENT ON TABLE public.te_agenda_rules IS
  'Module Notes de frais — classement kanban d''une SÉRIE récurrente entière (les épisodes futurs héritent à la volée côté client).';

CREATE TRIGGER trg_terules_org BEFORE INSERT ON public.te_agenda_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();
ALTER TABLE public.te_agenda_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rules - select" ON public.te_agenda_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own rules - insert" ON public.te_agenda_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rules - update" ON public.te_agenda_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own rules - delete" ON public.te_agenda_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. Contacts (sous-objets) + lien RDV ↔ contact
-- ---------------------------------------------------------------------
CREATE TABLE public.te_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,                  -- clé de résolution CRM (Sellsy)
  first_name text,
  last_name text,
  display_name text,
  source text NOT NULL DEFAULT 'calendar' CHECK (source IN ('calendar','manual','crm')),
  crm_ref text,                         -- id Sellsy une fois résolu (Sprint 3)
  company_domain text,                  -- domaine email ≠ tenant (pré-résolution entreprise)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);
COMMENT ON TABLE public.te_contacts IS
  'Module Notes de frais — contacts extraits des participants de RDV. Résolution par email dans le CRM (Sellsy) au Sprint 3 → entreprise → démarche → CAC.';

CREATE TRIGGER trg_tecontacts_org BEFORE INSERT ON public.te_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();
CREATE TRIGGER trg_tecontacts_touch BEFORE UPDATE ON public.te_contacts
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
ALTER TABLE public.te_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts - select" ON public.te_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own contacts - insert" ON public.te_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own contacts - update" ON public.te_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own contacts - delete" ON public.te_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.te_event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.te_calendar_events(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.te_contacts(id) ON DELETE CASCADE,
  response_status text,                 -- accepted / declined / needsAction…
  is_external boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, contact_id)
);
COMMENT ON TABLE public.te_event_attendees IS
  'Module Notes de frais — lien RDV ↔ contact (participants).';

CREATE TRIGGER trg_teattendees_org BEFORE INSERT ON public.te_event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.set_org_from_user();
ALTER TABLE public.te_event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attendees - select" ON public.te_event_attendees FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own attendees - insert" ON public.te_event_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own attendees - update" ON public.te_event_attendees FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own attendees - delete" ON public.te_event_attendees FOR DELETE TO authenticated USING (auth.uid() = user_id);
