-- Drop and recreate encryption functions to use pgcrypto properly
DROP FUNCTION IF EXISTS public.encrypt_credential(text, text, text);
DROP FUNCTION IF EXISTS public.decrypt_credential(text, text);

-- Recreate encrypt_credential function
CREATE OR REPLACE FUNCTION public.encrypt_credential(plain_text text, encryption_key text, iv text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN encode(
    extensions.pgp_sym_encrypt(plain_text, encryption_key, 'cipher-algo=aes256'),
    'base64'
  );
END;
$function$;

-- Recreate decrypt_credential function
CREATE OR REPLACE FUNCTION public.decrypt_credential(encrypted_text text, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN extensions.pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;