
-- Create storage bucket for invoice attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-attachments', 'invoice-attachments', false);

-- Allow authenticated users to upload files to invoice-attachments bucket
CREATE POLICY "Authenticated users can upload invoice attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoice-attachments');

-- Allow authenticated users to read their own invoice attachments
CREATE POLICY "Users can read invoice attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoice-attachments');

-- Allow authenticated users to delete their own invoice attachments
CREATE POLICY "Users can delete invoice attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoice-attachments');
