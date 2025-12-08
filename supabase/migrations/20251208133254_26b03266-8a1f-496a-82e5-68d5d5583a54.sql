-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns to bank_connections
ALTER TABLE public.bank_connections 
ADD COLUMN IF NOT EXISTS encrypted_login text,
ADD COLUMN IF NOT EXISTS encrypted_secret_key text,
ADD COLUMN IF NOT EXISTS encryption_iv text;

-- Create function to encrypt credentials using AES-256
-- This function will be called from edge functions with the encryption key
CREATE OR REPLACE FUNCTION public.encrypt_credential(
  plain_text text,
  encryption_key text,
  iv text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(plain_text, encryption_key, 'cipher-algo=aes256'),
    'base64'
  );
END;
$$;

-- Create function to decrypt credentials
CREATE OR REPLACE FUNCTION public.decrypt_credential(
  encrypted_text text,
  encryption_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Create secure function to insert encrypted bank connection
CREATE OR REPLACE FUNCTION public.create_encrypted_bank_connection(
  p_bank_name text,
  p_encrypted_login text,
  p_encrypted_secret_key text,
  p_organization_name text,
  p_bank_accounts jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.bank_connections (
    user_id,
    bank_name,
    login,
    secret_key,
    encrypted_login,
    encrypted_secret_key,
    organization_name,
    bank_accounts,
    is_active
  ) VALUES (
    auth.uid(),
    p_bank_name,
    '***ENCRYPTED***',
    '***ENCRYPTED***',
    p_encrypted_login,
    p_encrypted_secret_key,
    p_organization_name,
    p_bank_accounts,
    true
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Create function to get decrypted credentials (for edge function use with service role)
CREATE OR REPLACE FUNCTION public.get_decrypted_credentials(
  p_connection_id uuid,
  p_encryption_key text
)
RETURNS TABLE(decrypted_login text, decrypted_secret_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    public.decrypt_credential(encrypted_login, p_encryption_key) as decrypted_login,
    public.decrypt_credential(encrypted_secret_key, p_encryption_key) as decrypted_secret_key
  FROM public.bank_connections
  WHERE id = p_connection_id;
END;
$$;