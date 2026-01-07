-- Add INSERT policy for bank_labels to allow users to add Qonto categories
CREATE POLICY "Users can insert bank labels"
ON public.bank_labels
FOR INSERT
WITH CHECK (true);

-- Add UPDATE policy for completeness
CREATE POLICY "Users can update bank labels"
ON public.bank_labels
FOR UPDATE
USING (true);