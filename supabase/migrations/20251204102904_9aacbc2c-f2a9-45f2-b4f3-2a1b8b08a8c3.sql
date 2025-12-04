-- Create expense_categories table
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own categories"
ON public.expense_categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
ON public.expense_categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.expense_categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.expense_categories FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize default categories for a user
CREATE OR REPLACE FUNCTION public.initialize_default_categories(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.expense_categories (user_id, name, description, color, is_default)
  VALUES
    (_user_id, 'Outils SaaS', 'Abonnements logiciels et services cloud', '#3B82F6', true),
    (_user_id, 'Déjeuners/dîners client', 'Frais de représentation et repas d''affaires', '#F59E0B', true),
    (_user_id, 'Déplacements', 'Transport, hébergement, frais de mission', '#10B981', true),
    (_user_id, 'Honoraires de conseils', 'Prestations de conseil, avocats, comptables', '#8B5CF6', true),
    (_user_id, 'Publicité', 'Marketing, communication, campagnes publicitaires', '#EC4899', true)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;