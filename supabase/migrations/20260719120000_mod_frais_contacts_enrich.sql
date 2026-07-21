-- =====================================================================
-- Module Notes de frais — enrichissement des contacts (lookup 2 étages)
-- 1) carnet de contacts du compte email (Google People API ; Outlook/Graph à venir)
-- 2) CRM tiers (connecteur générique, Sellsy en premier)
-- À jouer À LA MAIN dans Lovable. Purement additif.
-- =====================================================================
ALTER TABLE public.te_contacts
  ADD COLUMN IF NOT EXISTS company_name text,      -- société (carnet ou CRM)
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS crm_provider text,      -- 'sellsy' … (crm_ref existe déjà)
  ADD COLUMN IF NOT EXISTS enrich_source text
    CHECK (enrich_source IN ('google_contacts','other_contacts','crm','none')),
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz;

COMMENT ON COLUMN public.te_contacts.enrich_source IS
  'Provenance de l''enrichissement : google_contacts (carnet), other_contacts (contacts d''interaction Google), crm (Sellsy…), none (aucun résultat — retentable).';
