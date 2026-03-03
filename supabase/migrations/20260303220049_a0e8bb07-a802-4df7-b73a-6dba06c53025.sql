
-- Remove connections with no encrypted credentials (unusable legacy data)
DELETE FROM public.bank_connections WHERE encrypted_login IS NULL OR encrypted_secret_key IS NULL;

-- Make encrypted columns NOT NULL
ALTER TABLE public.bank_connections ALTER COLUMN encrypted_login SET NOT NULL;
ALTER TABLE public.bank_connections ALTER COLUMN encrypted_secret_key SET NOT NULL;
