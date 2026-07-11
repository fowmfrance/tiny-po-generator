
-- Drop overly permissive anon RLS policies
DROP POLICY IF EXISTS "Anyone can read by token" ON public.supplier_access_tokens;
DROP POLICY IF EXISTS "Anon can update verification" ON public.supplier_access_tokens;
DROP POLICY IF EXISTS "Anon can upload KYC docs" ON public.supplier_kyc_documents;
DROP POLICY IF EXISTS "Anon can view supplier KYC docs" ON public.supplier_kyc_documents;
DROP POLICY IF EXISTS "Anon can read KYC levels" ON public.kyc_levels;
DROP POLICY IF EXISTS "Anon can read requirements" ON public.kyc_level_requirements;
DROP POLICY IF EXISTS "Anon can view document types" ON public.kyc_document_types;

-- Storage: kyc-documents - drop anon policies (edge function uses service role)
DROP POLICY IF EXISTS "Anon can upload KYC files" ON storage.objects;
DROP POLICY IF EXISTS "Anon can view KYC files" ON storage.objects;

-- Storage: invoice-attachments - replace loose policies with org-scoped ones
DROP POLICY IF EXISTS "Authenticated users can upload invoice attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read invoice attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can read invoice attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete invoice attachments" ON storage.objects;

CREATE POLICY "invoice_attachments_insert_org"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invoice-attachments'
  AND (
    ((storage.foldername(name))[1])::uuid IN (
      SELECT id FROM public.profiles WHERE organization_id = public.current_user_organization_id()
    )
    OR public.has_role(auth.uid(), 'admin-sapajoo')
  )
);

CREATE POLICY "invoice_attachments_select_org"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoice-attachments'
  AND (
    ((storage.foldername(name))[1])::uuid IN (
      SELECT id FROM public.profiles WHERE organization_id = public.current_user_organization_id()
    )
    OR public.has_role(auth.uid(), 'admin-sapajoo')
  )
);

CREATE POLICY "invoice_attachments_delete_org"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'invoice-attachments'
  AND (
    ((storage.foldername(name))[1])::uuid IN (
      SELECT id FROM public.profiles WHERE organization_id = public.current_user_organization_id()
    )
    OR public.has_role(auth.uid(), 'admin-sapajoo')
  )
);

-- Revoke EXECUTE on SECURITY DEFINER functions from anon / PUBLIC.
-- Keep authenticated EXECUTE only for functions legitimately called from client code
-- or referenced by RLS policies (has_role, current_user_organization_id).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_organization_id() FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.archive_supplier_bank_account(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_encrypted_bank_connection(text, text, text, text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_credential(text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_credential(text, text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_supplier_bank_account(uuid, text, text, text, text, text, boolean, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_decrypted_credentials(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_decrypted_supplier_bank(uuid, text) FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.initialize_default_budget_types(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_default_supplier_types(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_default_supplier_types(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_default_teams(uuid) FROM anon, authenticated, PUBLIC;
-- initialize_default_categories is called from the client (ExpenseCategoriesTab); keep authenticated.
REVOKE EXECUTE ON FUNCTION public.initialize_default_categories(uuid) FROM anon, PUBLIC;
