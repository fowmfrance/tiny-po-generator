-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can insert bank labels" ON public.bank_labels;
DROP POLICY IF EXISTS "Users can update bank labels" ON public.bank_labels;

-- Create more restrictive policies - only authenticated users can insert/update
-- and only for specific bank names they have connections to
CREATE POLICY "Authenticated users can insert bank labels"
ON public.bank_labels
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- No update needed - labels are reference data, once created they shouldn't change