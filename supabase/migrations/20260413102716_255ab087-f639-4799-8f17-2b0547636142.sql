ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS code_auxiliaire text;