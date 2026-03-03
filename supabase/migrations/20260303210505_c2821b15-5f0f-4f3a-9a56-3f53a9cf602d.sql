
-- Sanitize any existing plaintext credentials
UPDATE public.bank_connections 
SET login = '***REDACTED***', secret_key = '***REDACTED***'
WHERE login != '***ENCRYPTED***' OR login != '***REDACTED***';

-- Create trigger to prevent storing real credentials in plaintext columns
CREATE OR REPLACE FUNCTION public.enforce_no_plaintext_bank_credentials()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Always mask the plaintext columns
  NEW.login := '***REDACTED***';
  NEW.secret_key := '***REDACTED***';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mask_bank_credentials
  BEFORE INSERT OR UPDATE ON public.bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_no_plaintext_bank_credentials();
