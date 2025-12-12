-- Create suppliers table first
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  city text,
  country text,
  tax_id text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Suppliers can view and manage their own profile
CREATE POLICY "suppliers_select_own" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "suppliers_insert_own" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "suppliers_update_own" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all suppliers
CREATE POLICY "suppliers_select_admin" ON public.suppliers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create supplier bank accounts table with encryption
CREATE TABLE public.supplier_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  encrypted_iban text NOT NULL,
  encrypted_bic text NOT NULL,
  bank_name text,
  is_primary boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  archived_at timestamp with time zone,
  archived_reason text,
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own bank accounts
CREATE POLICY "bank_accounts_select_own" ON public.supplier_bank_accounts 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.suppliers WHERE id = supplier_id AND user_id = auth.uid())
);

CREATE POLICY "bank_accounts_insert_own" ON public.supplier_bank_accounts 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.suppliers WHERE id = supplier_id AND user_id = auth.uid())
);

CREATE POLICY "bank_accounts_update_own" ON public.supplier_bank_accounts 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.suppliers WHERE id = supplier_id AND user_id = auth.uid())
);

-- Admins can view all bank accounts (for verification)
CREATE POLICY "bank_accounts_select_admin" ON public.supplier_bank_accounts 
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "bank_accounts_update_admin" ON public.supplier_bank_accounts 
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Function to encrypt supplier bank credentials
CREATE OR REPLACE FUNCTION public.encrypt_supplier_bank_account(
  p_supplier_id uuid,
  p_label text,
  p_currency text,
  p_iban text,
  p_bic text,
  p_bank_name text,
  p_is_primary boolean,
  p_encryption_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  new_id uuid;
  encrypted_iban_val text;
  encrypted_bic_val text;
BEGIN
  -- Encrypt IBAN and BIC
  encrypted_iban_val := encode(extensions.pgp_sym_encrypt(p_iban, p_encryption_key, 'cipher-algo=aes256'), 'base64');
  encrypted_bic_val := encode(extensions.pgp_sym_encrypt(p_bic, p_encryption_key, 'cipher-algo=aes256'), 'base64');
  
  -- If setting as primary, unset other primary accounts for this supplier
  IF p_is_primary THEN
    UPDATE public.supplier_bank_accounts 
    SET is_primary = false 
    WHERE supplier_id = p_supplier_id AND is_archived = false;
  END IF;
  
  INSERT INTO public.supplier_bank_accounts (
    supplier_id, label, currency, encrypted_iban, encrypted_bic, bank_name, is_primary
  ) VALUES (
    p_supplier_id, p_label, p_currency, encrypted_iban_val, encrypted_bic_val, p_bank_name, p_is_primary
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function to decrypt supplier bank credentials
CREATE OR REPLACE FUNCTION public.get_decrypted_supplier_bank(p_bank_account_id uuid, p_encryption_key text)
RETURNS TABLE(decrypted_iban text, decrypted_bic text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    extensions.pgp_sym_decrypt(decode(encrypted_iban, 'base64'), p_encryption_key) as decrypted_iban,
    extensions.pgp_sym_decrypt(decode(encrypted_bic, 'base64'), p_encryption_key) as decrypted_bic
  FROM public.supplier_bank_accounts
  WHERE id = p_bank_account_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN;
END;
$$;

-- Function to archive a bank account
CREATE OR REPLACE FUNCTION public.archive_supplier_bank_account(p_bank_account_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.supplier_bank_accounts
  SET 
    is_archived = true,
    archived_at = now(),
    archived_reason = p_reason,
    is_primary = false
  WHERE id = p_bank_account_id;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_bank_accounts_updated_at
BEFORE UPDATE ON public.supplier_bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();