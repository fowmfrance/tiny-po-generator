-- =====================================================================
-- Module Notes de frais — jobs pg_cron (Sprint 1)
-- Réf : docs/spec-module-frais-attribution.md §4.1 / §7 RGPD
--
-- ⚠️ PRÉREQUIS avant de jouer ce fichier (à la main dans Lovable) :
--   1. La migration socle 20260710120000_mod_frais_socle.sql est appliquée.
--   2. Les edge functions du module sont déployées (dont calendar-watch-renew).
--   3. Le secret cron existe dans Vault, avec LA MÊME valeur que le secret
--      CRON_SECRET des edge functions :
--        SELECT vault.create_secret('<valeur>', 'te_frais_cron_secret');
--
-- Jobs (heures UTC) :
--   te-frais-purge-calendar : purge RGPD des événements agenda > 15 mois.
--     (les te_expense_matches confirmés gardent leur snapshot matched_event_*)
--   te-frais-watch-renew    : renouvelle les channels push Google (expirent
--     ~7 j) + resynchronise chaque connexion active (filet de sécurité si un
--     push s'est perdu).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Purge RGPD agenda (tous les jours, 03:10 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'te-frais-purge-calendar') THEN
    PERFORM cron.unschedule('te-frais-purge-calendar');
  END IF;
END $$;

SELECT cron.schedule(
  'te-frais-purge-calendar',
  '10 3 * * *',
  $$DELETE FROM public.te_calendar_events WHERE starts_at < now() - interval '15 months'$$
);

-- Renouvellement channels + sync filet de sécurité (tous les jours, 05:40 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'te-frais-watch-renew') THEN
    PERFORM cron.unschedule('te-frais-watch-renew');
  END IF;
END $$;

SELECT cron.schedule(
  'te-frais-watch-renew',
  '40 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://krmtbyqqcwybdscvzcyx.supabase.co/functions/v1/calendar-watch-renew',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'te_frais_cron_secret')
    ),
    body := '{}'::jsonb
  )
  $$
);
