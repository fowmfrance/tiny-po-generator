-- =====================================================================
-- Lecture du client + lookup dans l'import des ventes (factures Qonto).
--
-- 1. `clients` enrichi : identité légale (SIREN pivot, charte CRM passif),
--    identifiant CRM externe (crm_id + crm_source — l'ID client Qonto sert
--    de clé d'apprentissage du lookup, Kiosco suivra), et régime de TVA
--    par défaut du compte.
-- 2. `client_invoices.client_id` : rattachement au compte client, PRÉSERVÉ
--    à la resynchro (même mécanique que budget_id) ; vat_regime_override
--    pour les cas particuliers facture par facture.
--
-- Règle d'or : `amount_ht` importé de Qonto reste LA vérité comptable.
-- Le régime TVA du client sert de CONTRÔLE (alerte si le HT facturé ne
-- colle pas au régime) — jamais de recalcul silencieux.
--
-- Calibré sur les 216 factures en base : FR 20 % partout, BE/DK intracom,
-- CH export ; raw->client porte id/vat_number/tax_identification_number
-- sur 100 % des lignes.
-- ✅ À exécuter via le connecteur Lovable (query_database). Additif.
-- =====================================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS legal_name text,          -- raison sociale (SIRENE/Qonto)
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS siren text,               -- 9 chiffres — pivot entreprise
  ADD COLUMN IF NOT EXISTS vat_number text,          -- TVA intracommunautaire (FRxx…)
  ADD COLUMN IF NOT EXISTS crm_id text,              -- ID externe (client Qonto, compte Kiosco…)
  ADD COLUMN IF NOT EXISTS crm_source text NOT NULL DEFAULT 'manual'
    CHECK (crm_source IN ('manual', 'qonto', 'kiosco')),
  ADD COLUMN IF NOT EXISTS vat_regime text NOT NULL DEFAULT 'standard_fr_20'
    CHECK (vat_regime IN ('standard_fr_20', 'reduced_fr_10', 'reduced_fr_55',
                          'exempt', 'intracom', 'export'));

COMMENT ON COLUMN public.clients.crm_id IS
  'Identifiant du compte dans le système source (crm_source) : id client Qonto aujourd''hui, compte Kiosco demain. Clé d''apprentissage du lookup des ventes.';
COMMENT ON COLUMN public.clients.vat_regime IS
  'Régime de TVA par défaut du compte. Sert de CONTRÔLE du HT facturé (alerte si écart), jamais de recalcul silencieux — amount_ht Qonto reste la vérité.';

ALTER TABLE public.client_invoices
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vat_regime_override text
    CHECK (vat_regime_override IN ('standard_fr_20', 'reduced_fr_10', 'reduced_fr_55',
                                   'exempt', 'intracom', 'export'));

COMMENT ON COLUMN public.client_invoices.client_id IS
  'Compte client rattaché (lookup auto à la synchro : id Qonto > SIREN/TVA > nom exact ; sinon manuel). Préservé à la resynchro comme budget_id.';

CREATE INDEX IF NOT EXISTS idx_client_invoices_client_id
  ON public.client_invoices(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_crm_id ON public.clients(crm_id)
  WHERE crm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_siren ON public.clients(siren)
  WHERE siren IS NOT NULL;
