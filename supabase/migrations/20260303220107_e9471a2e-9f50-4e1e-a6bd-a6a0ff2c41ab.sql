
-- Update create_encrypted_bank_connection to remove plaintext columns
CREATE OR REPLACE FUNCTION public.create_encrypted_bank_connection(p_bank_name text, p_encrypted_login text, p_encrypted_secret_key text, p_organization_name text, p_bank_accounts jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.bank_connections (
    user_id,
    bank_name,
    encrypted_login,
    encrypted_secret_key,
    organization_name,
    bank_accounts,
    is_active
  ) VALUES (
    auth.uid(),
    p_bank_name,
    p_encrypted_login,
    p_encrypted_secret_key,
    p_organization_name,
    p_bank_accounts,
    true
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$function$;
