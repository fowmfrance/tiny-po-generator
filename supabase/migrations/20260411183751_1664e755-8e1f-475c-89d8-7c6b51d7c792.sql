
-- 1. Table kyc_document_types (catalogue global des types de documents)
CREATE TABLE public.kyc_document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view document types"
  ON public.kyc_document_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can view document types"
  ON public.kyc_document_types FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can manage document types"
  ON public.kyc_document_types FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Table kyc_levels (niveaux KYC par utilisateur)
CREATE TABLE public.kyc_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own KYC levels"
  ON public.kyc_levels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own KYC levels"
  ON public.kyc_levels FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anon needs to read kyc_levels to know what docs are required
CREATE POLICY "Anon can read KYC levels"
  ON public.kyc_levels FOR SELECT
  TO anon
  USING (true);

-- 3. Table kyc_level_requirements (liaison niveau <-> documents)
CREATE TABLE public.kyc_level_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kyc_level_id UUID NOT NULL REFERENCES public.kyc_levels(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.kyc_document_types(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kyc_level_id, document_type_id)
);

ALTER TABLE public.kyc_level_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requirements of their levels"
  ON public.kyc_level_requirements FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.kyc_levels kl
    WHERE kl.id = kyc_level_requirements.kyc_level_id AND kl.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage requirements of their levels"
  ON public.kyc_level_requirements FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.kyc_levels kl
    WHERE kl.id = kyc_level_requirements.kyc_level_id AND kl.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.kyc_levels kl
    WHERE kl.id = kyc_level_requirements.kyc_level_id AND kl.user_id = auth.uid()
  ));

CREATE POLICY "Anon can read requirements"
  ON public.kyc_level_requirements FOR SELECT
  TO anon
  USING (true);

-- 4. Table supplier_kyc_documents (documents uploadés)
CREATE TABLE public.supplier_kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.kyc_document_types(id),
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_kyc_documents ENABLE ROW LEVEL SECURITY;

-- Owner of the supplier can view and manage
CREATE POLICY "Users can view KYC docs of their suppliers"
  ON public.supplier_kyc_documents FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = supplier_kyc_documents.supplier_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage KYC docs of their suppliers"
  ON public.supplier_kyc_documents FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = supplier_kyc_documents.supplier_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = supplier_kyc_documents.supplier_id AND s.user_id = auth.uid()
  ));

-- Anon (supplier via token) can view their own docs and insert new ones
CREATE POLICY "Anon can view supplier KYC docs"
  ON public.supplier_kyc_documents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can upload KYC docs"
  ON public.supplier_kyc_documents FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. Modify suppliers table
ALTER TABLE public.suppliers
  ADD COLUMN kyc_level_id UUID REFERENCES public.kyc_levels(id),
  ADD COLUMN kyc_status TEXT NOT NULL DEFAULT 'none';

-- 6. Modify profiles table
ALTER TABLE public.profiles
  ADD COLUMN receive_email_copies BOOLEAN NOT NULL DEFAULT true;

-- 7. Seed default document types
INSERT INTO public.kyc_document_types (name, description, is_default, display_order) VALUES
  ('Pièce d''identité', 'Carte d''identité, passeport ou titre de séjour du représentant légal', true, 1),
  ('RIB', 'Relevé d''identité bancaire pour les paiements', true, 2),
  ('Kbis', 'Extrait Kbis de moins de 3 mois', false, 3),
  ('Attestation URSSAF', 'Attestation de vigilance URSSAF en cours de validité', false, 4);

-- 8. Storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload KYC files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents');

CREATE POLICY "Authenticated users can view KYC files of their suppliers"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'kyc-documents');

CREATE POLICY "Anon can upload KYC files"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'kyc-documents');

CREATE POLICY "Anon can view KYC files"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'kyc-documents');

-- Triggers for updated_at
CREATE TRIGGER update_kyc_document_types_updated_at
  BEFORE UPDATE ON public.kyc_document_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kyc_levels_updated_at
  BEFORE UPDATE ON public.kyc_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_kyc_documents_updated_at
  BEFORE UPDATE ON public.supplier_kyc_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
