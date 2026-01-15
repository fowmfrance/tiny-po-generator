
-- Table des types de fournisseurs (catégories/spécialités)
CREATE TABLE public.supplier_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#6B7280',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des types d'articles liés aux types de fournisseurs
CREATE TABLE public.article_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  supplier_type_id uuid NOT NULL REFERENCES public.supplier_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit text DEFAULT 'unité',
  default_unit_price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des notations fournisseurs (par user après prestation)
CREATE TABLE public.supplier_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  po_id uuid, -- référence au bon de commande concerné
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  service_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ajout des nouvelles colonnes à la table suppliers
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS supplier_type_id uuid REFERENCES public.supplier_types(id),
ADD COLUMN IF NOT EXISTS has_negotiated_rates boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS business_volume numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS specialty text;

-- Index pour les performances
CREATE INDEX idx_supplier_ratings_supplier ON public.supplier_ratings(supplier_id);
CREATE INDEX idx_supplier_ratings_user ON public.supplier_ratings(user_id);
CREATE INDEX idx_article_types_supplier_type ON public.article_types(supplier_type_id);
CREATE INDEX idx_suppliers_type ON public.suppliers(supplier_type_id);

-- RLS pour supplier_types
ALTER TABLE public.supplier_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own supplier types" ON public.supplier_types
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own supplier types" ON public.supplier_types
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplier types" ON public.supplier_types
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplier types" ON public.supplier_types
FOR DELETE USING (auth.uid() = user_id);

-- RLS pour article_types
ALTER TABLE public.article_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own article types" ON public.article_types
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own article types" ON public.article_types
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own article types" ON public.article_types
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own article types" ON public.article_types
FOR DELETE USING (auth.uid() = user_id);

-- RLS pour supplier_ratings
ALTER TABLE public.supplier_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings of their suppliers" ON public.supplier_ratings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE suppliers.id = supplier_ratings.supplier_id 
    AND suppliers.user_id = auth.uid()
  )
  OR auth.uid() = user_id
);

CREATE POLICY "Users can create ratings" ON public.supplier_ratings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON public.supplier_ratings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON public.supplier_ratings
FOR DELETE USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_supplier_types_updated_at
BEFORE UPDATE ON public.supplier_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_article_types_updated_at
BEFORE UPDATE ON public.article_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
