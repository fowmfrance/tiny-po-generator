
-- 1. Enable RLS on backup tables (admin-sapajoo only)
ALTER TABLE public.bkp_suppliers_backfill_20260715 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bkp_purchase_orders_backfill_20260715 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bkp_po_items_backfill_20260715 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bkp_po_items_v1_20260716 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bkp_po_v1_20260716 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin-sapajoo only" ON public.bkp_suppliers_backfill_20260715 FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin-sapajoo')) WITH CHECK (public.has_role(auth.uid(),'admin-sapajoo'));
CREATE POLICY "admin-sapajoo only" ON public.bkp_purchase_orders_backfill_20260715 FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin-sapajoo')) WITH CHECK (public.has_role(auth.uid(),'admin-sapajoo'));
CREATE POLICY "admin-sapajoo only" ON public.bkp_po_items_backfill_20260715 FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin-sapajoo')) WITH CHECK (public.has_role(auth.uid(),'admin-sapajoo'));
CREATE POLICY "admin-sapajoo only" ON public.bkp_po_items_v1_20260716 FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin-sapajoo')) WITH CHECK (public.has_role(auth.uid(),'admin-sapajoo'));
CREATE POLICY "admin-sapajoo only" ON public.bkp_po_v1_20260716 FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin-sapajoo')) WITH CHECK (public.has_role(auth.uid(),'admin-sapajoo'));

CREATE POLICY "admin-sapajoo only" ON public.supplier_name_backup FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin-sapajoo')) WITH CHECK (public.has_role(auth.uid(),'admin-sapajoo'));

-- 2. Fix mutable search_path on trigger functions
ALTER FUNCTION public.enforce_max_partial_payments() SET search_path = public;
ALTER FUNCTION public.recompute_invoice_payment_status() SET search_path = public;
ALTER FUNCTION public.tg_touch_updated_at() SET search_path = public;

-- 3. Restrict kyc_document_types writes to admin-sapajoo
DROP POLICY IF EXISTS "Authenticated users can insert document types" ON public.kyc_document_types;
DROP POLICY IF EXISTS "Authenticated users can update document types" ON public.kyc_document_types;
DROP POLICY IF EXISTS "Authenticated users can delete document types" ON public.kyc_document_types;

CREATE POLICY "Only admin-sapajoo can insert document types" ON public.kyc_document_types FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin-sapajoo'));
CREATE POLICY "Only admin-sapajoo can update document types" ON public.kyc_document_types FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin-sapajoo')) WITH CHECK (public.has_role(auth.uid(),'admin-sapajoo'));
CREATE POLICY "Only admin-sapajoo can delete document types" ON public.kyc_document_types FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin-sapajoo'));

-- 4. KYC storage policies: scope by organization via supplier_kyc_documents
DROP POLICY IF EXISTS "Authenticated users can upload KYC files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view KYC files of their suppliers" ON storage.objects;

CREATE POLICY "Org members can view KYC files" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.organization_id = public.current_user_organization_id()
  )
);

CREATE POLICY "Org members can upload KYC files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.organization_id = public.current_user_organization_id()
  )
);

CREATE POLICY "Org members can update KYC files" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.organization_id = public.current_user_organization_id()
  )
);

CREATE POLICY "Org members can delete KYC files" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.organization_id = public.current_user_organization_id()
  )
);

-- 5. Revoke EXECUTE on internal SECURITY DEFINER trigger/helper functions from anon & authenticated
-- Trigger functions never called via API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_bank_connection_org() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_org_from_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.te_set_match_owner() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.te_snapshot_matched_event() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.po_apply_service_type_defaults() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_recognition_method_lock() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.budget_recognition_started(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_default_categories(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_default_expense_families(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_default_service_types(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.propagate_service_type_templates() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_suppliers() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_rename_supplier(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_restore_supplier_names() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_organization_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon, PUBLIC;

-- 6. OAuth nonce table for CSRF protection (google-oauth-start/callback)
CREATE TABLE IF NOT EXISTS public.oauth_nonces (
  nonce text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.oauth_nonces TO service_role;
ALTER TABLE public.oauth_nonces ENABLE ROW LEVEL SECURITY;
-- No policies: only accessible via service role in edge functions.
