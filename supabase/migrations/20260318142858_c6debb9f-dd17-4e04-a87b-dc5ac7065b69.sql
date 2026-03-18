
CREATE TABLE public.supplier_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  email_verified boolean NOT NULL DEFAULT false,
  verified_at timestamp with time zone,
  verification_code text,
  verification_code_expires_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_supplier_access_tokens_token ON public.supplier_access_tokens(token);

ALTER TABLE public.supplier_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage tokens" ON public.supplier_access_tokens
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Anyone can read by token" ON public.supplier_access_tokens
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can update verification" ON public.supplier_access_tokens
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
