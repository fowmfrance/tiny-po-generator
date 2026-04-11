
-- Fix overly permissive policy on kyc_document_types
DROP POLICY IF EXISTS "Authenticated users can manage document types" ON public.kyc_document_types;

CREATE POLICY "Authenticated users can insert document types"
  ON public.kyc_document_types FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update document types"
  ON public.kyc_document_types FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete document types"
  ON public.kyc_document_types FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix search_path on email queue functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
