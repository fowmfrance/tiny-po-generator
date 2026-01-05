-- Table des libellés bancaires (labels par banque)
CREATE TABLE public.bank_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  label_code TEXT NOT NULL,
  label_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bank_name, label_code)
);

-- Table des mappings utilisateur (label bancaire -> catégorie personnalisée)
CREATE TABLE public.bank_label_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_label_id UUID NOT NULL REFERENCES public.bank_labels(id) ON DELETE CASCADE,
  expense_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, bank_label_id)
);

-- Enable RLS
ALTER TABLE public.bank_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_label_mappings ENABLE ROW LEVEL SECURITY;

-- Policies for bank_labels (read-only for all authenticated users)
CREATE POLICY "Anyone can view bank labels" ON public.bank_labels
  FOR SELECT USING (true);

-- Policies for bank_label_mappings (user-specific)
CREATE POLICY "Users can view their own mappings" ON public.bank_label_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mappings" ON public.bank_label_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mappings" ON public.bank_label_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mappings" ON public.bank_label_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_bank_label_mappings_updated_at
  BEFORE UPDATE ON public.bank_label_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Qonto labels (from Qonto API documentation)
INSERT INTO public.bank_labels (bank_name, label_code, label_name, description) VALUES
  ('Qonto', 'food_and_grocery', 'Alimentation & épicerie', 'Restaurants, supermarchés, livraison repas'),
  ('Qonto', 'hotel_and_lodging', 'Hôtels & hébergement', 'Hôtels, Airbnb, locations'),
  ('Qonto', 'transport', 'Transport', 'Taxis, VTC, transports en commun'),
  ('Qonto', 'gas_station', 'Carburant', 'Stations-service, recharge électrique'),
  ('Qonto', 'software', 'Logiciels', 'Abonnements SaaS, licences'),
  ('Qonto', 'office_supply', 'Fournitures de bureau', 'Papeterie, consommables'),
  ('Qonto', 'hardware', 'Matériel informatique', 'Ordinateurs, périphériques'),
  ('Qonto', 'marketing', 'Marketing & publicité', 'Campagnes pub, SEO, réseaux sociaux'),
  ('Qonto', 'legal', 'Frais juridiques', 'Avocats, notaires, conseils juridiques'),
  ('Qonto', 'accounting', 'Comptabilité', 'Expert-comptable, audit'),
  ('Qonto', 'consulting', 'Conseil', 'Consultants, prestations intellectuelles'),
  ('Qonto', 'insurance', 'Assurances', 'Assurances pro, RC, mutuelle'),
  ('Qonto', 'telecom', 'Télécommunications', 'Téléphone, internet, mobile'),
  ('Qonto', 'utility', 'Services publics', 'Électricité, eau, gaz'),
  ('Qonto', 'rent', 'Loyer', 'Location bureaux, entrepôts'),
  ('Qonto', 'salary', 'Salaires', 'Paie, charges sociales'),
  ('Qonto', 'tax', 'Impôts & taxes', 'TVA, IS, CFE, CVAE'),
  ('Qonto', 'bank_fee', 'Frais bancaires', 'Commissions, intérêts'),
  ('Qonto', 'travel', 'Voyages d''affaires', 'Billets avion/train, frais de mission'),
  ('Qonto', 'subscription', 'Abonnements', 'Presse, services récurrents'),
  ('Qonto', 'online_service', 'Services en ligne', 'Cloud, hébergement, API'),
  ('Qonto', 'restaurant', 'Restaurants', 'Repas d''affaires, notes de frais'),
  ('Qonto', 'other', 'Autres', 'Dépenses non catégorisées');