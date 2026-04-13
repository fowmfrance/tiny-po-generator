
CREATE POLICY "Authenticated users can read invoice attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoice-attachments');
