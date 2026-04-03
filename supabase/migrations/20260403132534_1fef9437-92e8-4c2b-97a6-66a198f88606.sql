
-- Junction table: invoices <-> purchase orders (many-to-many)
CREATE TABLE public.invoice_purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  amount_allocated numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(invoice_id, purchase_order_id)
);

ALTER TABLE public.invoice_purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invoice-PO links"
  ON public.invoice_purchase_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.supplier_invoices si
    WHERE si.id = invoice_purchase_orders.invoice_id AND si.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their invoice-PO links"
  ON public.invoice_purchase_orders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.supplier_invoices si
    WHERE si.id = invoice_purchase_orders.invoice_id AND si.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their invoice-PO links"
  ON public.invoice_purchase_orders FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.supplier_invoices si
    WHERE si.id = invoice_purchase_orders.invoice_id AND si.user_id = auth.uid()
  ));

-- Supplier agreements (annual contracts)
CREATE TABLE public.supplier_agreements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  total_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  terms text,
  attachment_url text,
  signed_at timestamp with time zone,
  signed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agreements"
  ON public.supplier_agreements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agreements"
  ON public.supplier_agreements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agreements"
  ON public.supplier_agreements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agreements"
  ON public.supplier_agreements FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_supplier_agreements_updated_at
  BEFORE UPDATE ON public.supplier_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
