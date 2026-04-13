
-- Add dedicated columns to suppliers
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS siren text;

-- Migrate existing tax_id data into vat_number
UPDATE suppliers SET vat_number = tax_id WHERE tax_id IS NOT NULL AND tax_id != '';

-- Create contacts table
CREATE TABLE supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  first_name text,
  last_name text NOT NULL,
  role text,
  email text,
  phone text,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their supplier contacts"
  ON supplier_contacts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their supplier contacts"
  ON supplier_contacts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their supplier contacts"
  ON supplier_contacts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their supplier contacts"
  ON supplier_contacts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_supplier_contacts_updated_at
  BEFORE UPDATE ON supplier_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
