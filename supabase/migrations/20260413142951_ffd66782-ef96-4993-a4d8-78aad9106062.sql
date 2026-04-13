
-- Add supplier_name text columns for history preservation
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE public.supplier_invoices ADD COLUMN IF NOT EXISTS supplier_name text;

-- Backfill existing data
UPDATE public.purchase_orders po
SET supplier_name = s.name
FROM public.suppliers s
WHERE po.supplier_id = s.id AND po.supplier_name IS NULL;

UPDATE public.supplier_invoices si
SET supplier_name = s.name
FROM public.suppliers s
WHERE si.supplier_id = s.id AND si.supplier_name IS NULL;

-- Drop existing FK constraints and recreate with ON DELETE SET NULL
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_supplier_id_fkey;
ALTER TABLE public.purchase_orders ALTER COLUMN supplier_id DROP NOT NULL;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

ALTER TABLE public.supplier_invoices DROP CONSTRAINT IF EXISTS supplier_invoices_supplier_id_fkey;
ALTER TABLE public.supplier_invoices ALTER COLUMN supplier_id DROP NOT NULL;
ALTER TABLE public.supplier_invoices ADD CONSTRAINT supplier_invoices_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- supplier_contacts: ON DELETE SET NULL so we can reassign
ALTER TABLE public.supplier_contacts DROP CONSTRAINT IF EXISTS supplier_contacts_supplier_id_fkey;
ALTER TABLE public.supplier_contacts ALTER COLUMN supplier_id DROP NOT NULL;
ALTER TABLE public.supplier_contacts ADD CONSTRAINT supplier_contacts_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- supplier_access_tokens: cascade delete when supplier is removed
ALTER TABLE public.supplier_access_tokens DROP CONSTRAINT IF EXISTS supplier_access_tokens_supplier_id_fkey;
ALTER TABLE public.supplier_access_tokens ADD CONSTRAINT supplier_access_tokens_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- supplier_bank_accounts: cascade delete
ALTER TABLE public.supplier_bank_accounts DROP CONSTRAINT IF EXISTS supplier_bank_accounts_supplier_id_fkey;
ALTER TABLE public.supplier_bank_accounts ADD CONSTRAINT supplier_bank_accounts_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- supplier_agreements: cascade delete
ALTER TABLE public.supplier_agreements DROP CONSTRAINT IF EXISTS supplier_agreements_supplier_id_fkey;
ALTER TABLE public.supplier_agreements ADD CONSTRAINT supplier_agreements_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- supplier_ratings: cascade delete
ALTER TABLE public.supplier_ratings DROP CONSTRAINT IF EXISTS supplier_ratings_supplier_id_fkey;
ALTER TABLE public.supplier_ratings ADD CONSTRAINT supplier_ratings_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- supplier_kyc_documents: cascade delete
ALTER TABLE public.supplier_kyc_documents DROP CONSTRAINT IF EXISTS supplier_kyc_documents_supplier_id_fkey;
ALTER TABLE public.supplier_kyc_documents ADD CONSTRAINT supplier_kyc_documents_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- budget_milestones supplier_id: SET NULL
ALTER TABLE public.budget_milestones DROP CONSTRAINT IF EXISTS budget_milestones_supplier_id_fkey;
ALTER TABLE public.budget_milestones ADD CONSTRAINT budget_milestones_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Allow admins to delete suppliers
CREATE POLICY "Admins can delete suppliers"
ON public.suppliers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));
