-- Table des factures fournisseurs
CREATE TABLE public.supplier_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  
  -- Références
  invoice_number TEXT NOT NULL,
  po_number TEXT,
  project_code TEXT,
  
  -- Montants
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  vat_amount NUMERIC DEFAULT 0,
  vat_rate NUMERIC DEFAULT 0,
  
  -- Dates
  invoice_date DATE NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  
  -- Métadonnées
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own invoices" 
ON public.supplier_invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.supplier_invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.supplier_invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.supplier_invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_supplier_invoices_updated_at
BEFORE UPDATE ON public.supplier_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Table des navettes de paiement
CREATE TABLE public.payment_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Infos batch
  batch_reference TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  total_amount NUMERIC NOT NULL,
  invoice_count INTEGER NOT NULL,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'submitted', 'processed', 'failed')),
  
  -- Fichier SEPA
  sepa_xml TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour payment_batches
CREATE POLICY "Users can view their own payment batches" 
ON public.payment_batches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment batches" 
ON public.payment_batches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment batches" 
ON public.payment_batches 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_payment_batches_updated_at
BEFORE UPDATE ON public.payment_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Table de liaison factures <-> batches
CREATE TABLE public.payment_batch_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.payment_batches(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(batch_id, invoice_id)
);

-- Enable RLS
ALTER TABLE public.payment_batch_invoices ENABLE ROW LEVEL SECURITY;

-- RLS via batch ownership
CREATE POLICY "Users can view their batch invoices" 
ON public.payment_batch_invoices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.payment_batches 
  WHERE id = payment_batch_invoices.batch_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can create their batch invoices" 
ON public.payment_batch_invoices 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.payment_batches 
  WHERE id = payment_batch_invoices.batch_id 
  AND user_id = auth.uid()
));

-- Index pour performances
CREATE INDEX idx_supplier_invoices_user_id ON public.supplier_invoices(user_id);
CREATE INDEX idx_supplier_invoices_supplier_id ON public.supplier_invoices(supplier_id);
CREATE INDEX idx_supplier_invoices_status ON public.supplier_invoices(status);
CREATE INDEX idx_supplier_invoices_due_date ON public.supplier_invoices(due_date);
CREATE INDEX idx_payment_batches_user_id ON public.payment_batches(user_id);