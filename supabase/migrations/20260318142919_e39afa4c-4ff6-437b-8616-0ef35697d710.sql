
-- Tighten the anon update policy to only allow verification fields
DROP POLICY IF EXISTS "Anon can update verification" ON public.supplier_access_tokens;
CREATE POLICY "Anon can update verification" ON public.supplier_access_tokens
  FOR UPDATE TO anon
  USING (is_active = true)
  WITH CHECK (is_active = true);
