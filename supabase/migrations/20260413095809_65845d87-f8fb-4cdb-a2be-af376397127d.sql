
-- Payment methods table (global, managed by admin-sapajoo)
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view payment methods"
  ON public.payment_methods FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin sapajoo can manage payment methods"
  ON public.payment_methods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin-sapajoo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin-sapajoo'));

-- Payment modalities table
CREATE TABLE public.payment_modalities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (payment_method_id, code)
);

ALTER TABLE public.payment_modalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view payment modalities"
  ON public.payment_modalities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin sapajoo can manage payment modalities"
  ON public.payment_modalities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin-sapajoo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin-sapajoo'));

-- Add columns to suppliers
ALTER TABLE public.suppliers
  ADD COLUMN is_po_exempt boolean NOT NULL DEFAULT false,
  ADD COLUMN default_payment_method_id uuid REFERENCES public.payment_methods(id),
  ADD COLUMN default_payment_modality_id uuid REFERENCES public.payment_modalities(id);

-- Triggers for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_modalities_updated_at
  BEFORE UPDATE ON public.payment_modalities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.payment_methods (name, code, display_order) VALUES
  ('Virement', 'virement', 1),
  ('Prélèvement', 'prelevement', 2),
  ('Payment Gateway', 'payment_gateway', 3),
  ('Transaction CB', 'transaction_cb', 4),
  ('Affacturage', 'affacturage', 5);

-- Modalities for Virement
INSERT INTO public.payment_modalities (payment_method_id, name, code, display_order)
SELECT id, 'SEPA', 'sepa', 1 FROM public.payment_methods WHERE code = 'virement'
UNION ALL
SELECT id, 'ACH', 'ach', 2 FROM public.payment_methods WHERE code = 'virement';

-- Modalities for Prélèvement
INSERT INTO public.payment_modalities (payment_method_id, name, code, display_order)
SELECT id, 'SEPA', 'sepa', 1 FROM public.payment_methods WHERE code = 'prelevement'
UNION ALL
SELECT id, 'CB', 'cb', 2 FROM public.payment_methods WHERE code = 'prelevement'
UNION ALL
SELECT id, 'Payment Gateway', 'payment_gateway', 3 FROM public.payment_methods WHERE code = 'prelevement';
