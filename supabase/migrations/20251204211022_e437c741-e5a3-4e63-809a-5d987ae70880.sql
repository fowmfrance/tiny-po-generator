-- Create transactions table for storing Qonto transactions with Sapajoo enrichments
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bank_connection_id UUID REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  
  -- Qonto source fields (prefixed for clarity)
  qonto_transaction_id TEXT NOT NULL,
  qonto_amount DECIMAL(15, 2) NOT NULL,
  qonto_currency TEXT DEFAULT 'EUR',
  qonto_local_amount DECIMAL(15, 2),
  qonto_local_currency TEXT,
  qonto_side TEXT, -- 'debit' or 'credit'
  qonto_operation_type TEXT,
  qonto_label TEXT,
  qonto_settled_at TIMESTAMPTZ,
  qonto_emitted_at TIMESTAMPTZ,
  qonto_status TEXT,
  qonto_note TEXT,
  qonto_reference TEXT,
  qonto_vat_amount DECIMAL(15, 2),
  qonto_vat_rate DECIMAL(5, 2),
  qonto_initiator_id TEXT,
  qonto_card_last_digits TEXT,
  qonto_category TEXT,
  qonto_attachment_ids JSONB DEFAULT '[]'::jsonb,
  qonto_raw_data JSONB, -- Store full raw response for future use
  
  -- Sapajoo enrichment fields
  sapajoo_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  project_code TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint for UPSERT
  UNIQUE(user_id, qonto_transaction_id)
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON public.transactions FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_settled_at ON public.transactions(qonto_settled_at);
CREATE INDEX idx_transactions_bank_connection ON public.transactions(bank_connection_id);