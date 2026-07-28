-- Libellés Qonto : qonto_label devient LE libellé affiché dans l'interface
-- Qonto (clean_counterparty_name, ex. « Galeries Lafayette »), le libellé
-- bancaire brut (« GOURMET HAUSSMA ») est préservé dans qonto_raw_label.
-- Le logo affiché par Qonto est capturé au passage (pas encore rendu en UI).
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS qonto_raw_label text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS qonto_logo_url text;

-- Backfill depuis qonto_raw_data (le JSON complet de chaque transaction est
-- déjà stocké à la synchro : pas besoin de re-synchroniser).
UPDATE public.transactions SET
  qonto_raw_label = COALESCE(qonto_raw_label, qonto_label),
  qonto_logo_url  = COALESCE(qonto_logo_url, qonto_raw_data->'logo'->>'small'),
  qonto_label     = COALESCE(NULLIF(qonto_raw_data->>'clean_counterparty_name', ''), qonto_label)
WHERE qonto_raw_data IS NOT NULL;
