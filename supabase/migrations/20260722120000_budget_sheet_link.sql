-- =====================================================================
-- Budgets ↔ Google Sheets : liaison de contrôle (pas de synchronisation).
-- Sapajoo reste la source de vérité ; le Sheet lié est CONTRÔLÉ chaque jour
-- (plage nommée SAPAJOO_TOTAL vs budgets.initial_amount) et l'écart est
-- alerté, jamais réconcilié en silence.
--
-- Modes : service_account (v1 — le client partage le fichier en lecture avec
-- l'email du compte de service) ; oauth (à venir — « Se connecter avec
-- Google » + sélecteur de fichier, scope drive.file, pour les clients SaaS).
--
-- ⚠️ PRÉREQUIS avant d'activer le cron : edge function sync-budget-sheets
-- déployée + secrets GOOGLE_SA_EMAIL / GOOGLE_SA_KEY posés + vault
-- te_frais_cron_secret existant (déjà créé par mod_frais_cron).
-- À jouer À LA MAIN dans Lovable. Additif.
-- =====================================================================

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS sheet_spreadsheet_id text,
  ADD COLUMN IF NOT EXISTS sheet_mode text NOT NULL DEFAULT 'service_account'
    CHECK (sheet_mode IN ('service_account', 'oauth')),
  ADD COLUMN IF NOT EXISTS sheet_status text
    CHECK (sheet_status IN ('pending', 'ok', 'mismatch', 'code_mismatch', 'error')),
  ADD COLUMN IF NOT EXISTS sheet_last_total numeric(14,2),
  ADD COLUMN IF NOT EXISTS sheet_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS sheet_error text;

COMMENT ON COLUMN public.budgets.sheet_spreadsheet_id IS
  'Google Sheet lié (contrôle de cohérence quotidien via sync-budget-sheets). Convention : plages nommées SAPAJOO_TOTAL (obligatoire) et SAPAJOO_CODE (garde-fou bon fichier).';
COMMENT ON COLUMN public.budgets.sheet_status IS
  'Résultat du dernier contrôle : ok / mismatch (totaux différents) / code_mismatch (mauvais fichier) / error (inaccessible, plage absente…) / pending (jamais contrôlé).';

-- Contrôle quotidien (06:20 UTC), même mécanique que les crons du module frais.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'budget-sheets-check') THEN
    PERFORM cron.unschedule('budget-sheets-check');
  END IF;
END $$;

SELECT cron.schedule(
  'budget-sheets-check',
  '20 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://krmtbyqqcwybdscvzcyx.supabase.co/functions/v1/sync-budget-sheets',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'te_frais_cron_secret')
    ),
    body := '{}'::jsonb
  )
  $$
);
