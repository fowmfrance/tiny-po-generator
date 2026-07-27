-- Politiques maison des notes de frais, configurées par l'admin de l'instance
-- (Paramètres → Notes de frais). Évaluation côté client, purement indicative :
-- badge « Non conforme » + filtre reporting — on ne bloque jamais la saisie.
CREATE TABLE IF NOT EXISTS public.te_expense_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  policy_key text NOT NULL CHECK (policy_key IN (
    'receipt_max_age_days',        -- reçu soumis plus de X jours après la dépense
    'no_receipt_max_amount',       -- frais sans justificatif toléré jusqu'à X € (0 = jamais)
    'restaurant_max_per_person',   -- plafond TTC/convive au restaurant
    'gift_max_amount',             -- plafond par cadeau (type de frais « cadeau »)
    'alcohol_forbidden'            -- tout frais marqué « alcool » est signalé
  )),
  enabled boolean NOT NULL DEFAULT true,
  threshold numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, policy_key)
);

ALTER TABLE public.te_expense_policies ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les membres de l'org (le badge concerne tout le monde).
CREATE POLICY "te_policies_select_org" ON public.te_expense_policies
  FOR SELECT USING (organization_id = current_user_organization_id());
-- Écriture : admins de l'org uniquement.
CREATE POLICY "te_policies_insert_admin" ON public.te_expense_policies
  FOR INSERT WITH CHECK (organization_id = current_user_organization_id() AND has_role(auth.uid(), 'admin'));
CREATE POLICY "te_policies_update_admin" ON public.te_expense_policies
  FOR UPDATE USING (organization_id = current_user_organization_id() AND has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = current_user_organization_id() AND has_role(auth.uid(), 'admin'));
CREATE POLICY "te_policies_delete_admin" ON public.te_expense_policies
  FOR DELETE USING (organization_id = current_user_organization_id() AND has_role(auth.uid(), 'admin'));

-- Marqueur « alcool » sur le frais (politique alcohol_forbidden).
ALTER TABLE public.te_expenses ADD COLUMN IF NOT EXISTS has_alcohol boolean NOT NULL DEFAULT false;

-- Nouveau type de frais « cadeau » (politique gift_max_amount).
ALTER TABLE public.te_expenses DROP CONSTRAINT IF EXISTS te_expenses_te_category_check;
ALTER TABLE public.te_expenses ADD CONSTRAINT te_expenses_te_category_check
  CHECK (te_category = ANY (ARRAY['restaurant'::text, 'transport'::text, 'hebergement'::text, 'autre'::text, 'cadeau'::text]));
