-- Migration : bascule du multi-tenant de user_id à organization_id

-- 1. Helper function : retourne l'organization_id du profil connecté
CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Créer des organisations personnelles pour les profils sans org
DO $$
DECLARE
  r RECORD;
  new_org_id uuid;
  base_name text;
  final_name text;
  counter integer;
BEGIN
  FOR r IN
    SELECT id, email, COALESCE(NULLIF(company, ''), NULLIF(full_name, ''), email) as org_name
    FROM public.profiles
    WHERE organization_id IS NULL
  LOOP
    base_name := r.org_name;
    final_name := base_name;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE name = final_name) LOOP
      counter := counter + 1;
      final_name := base_name || ' (' || counter || ')';
    END LOOP;

    INSERT INTO public.organizations (name, contact_email)
    VALUES (final_name, r.email)
    RETURNING id INTO new_org_id;

    UPDATE public.profiles SET organization_id = new_org_id WHERE id = r.id;
  END LOOP;
END;
$$;

-- 3. Ajouter organization_id à toutes les tables opérationnelles
ALTER TABLE public.article_types ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.bank_connections ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.bank_label_mappings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.budget_milestones ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.budget_types ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.invoice_purchase_orders ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.kyc_level_requirements ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.kyc_levels ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.milestone_confirmations ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.payment_batch_invoices ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.payment_batches ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.supplier_access_tokens ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.supplier_agreements ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.supplier_bank_accounts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.supplier_contacts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.supplier_invoices ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.supplier_kyc_documents ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.supplier_ratings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.supplier_types ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 4. Rétro-remplir organization_id depuis le profil du créateur
UPDATE public.article_types t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.bank_connections t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.bank_label_mappings t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.budget_types t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.budgets t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.clients t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.expense_categories t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.kyc_levels t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.payment_batches t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.purchase_orders t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.supplier_agreements t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.supplier_contacts t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.supplier_invoices t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.supplier_ratings t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.supplier_types t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.suppliers t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.teams t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;
UPDATE public.transactions t SET organization_id = p.organization_id FROM public.profiles p WHERE t.user_id = p.id AND t.organization_id IS NULL;

-- 5. Rétro-remplir les tables filles depuis leur parent
UPDATE public.budget_milestones m SET organization_id = b.organization_id FROM public.budgets b WHERE m.budget_id = b.id AND m.organization_id IS NULL;
UPDATE public.invoice_purchase_orders ipo SET organization_id = si.organization_id FROM public.supplier_invoices si WHERE ipo.invoice_id = si.id AND ipo.organization_id IS NULL;
UPDATE public.kyc_level_requirements kr SET organization_id = kl.organization_id FROM public.kyc_levels kl WHERE kr.kyc_level_id = kl.id AND kr.organization_id IS NULL;
UPDATE public.milestone_confirmations mc SET organization_id = bm.organization_id FROM public.budget_milestones bm WHERE mc.milestone_id = bm.id AND mc.organization_id IS NULL;
UPDATE public.payment_batch_invoices pbi SET organization_id = pb.organization_id FROM public.payment_batches pb WHERE pbi.batch_id = pb.id AND pbi.organization_id IS NULL;
UPDATE public.purchase_order_items poi SET organization_id = po.organization_id FROM public.purchase_orders po WHERE poi.purchase_order_id = po.id AND poi.organization_id IS NULL;
UPDATE public.supplier_access_tokens sat SET organization_id = s.organization_id FROM public.suppliers s WHERE sat.supplier_id = s.id AND sat.organization_id IS NULL;
UPDATE public.supplier_bank_accounts sba SET organization_id = s.organization_id FROM public.suppliers s WHERE sba.supplier_id = s.id AND sba.organization_id IS NULL;
UPDATE public.supplier_kyc_documents skd SET organization_id = s.organization_id FROM public.suppliers s WHERE skd.supplier_id = s.id AND skd.organization_id IS NULL;

-- 6. Rendre organization_id NOT NULL partout
ALTER TABLE public.article_types ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.bank_connections ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.bank_label_mappings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.budget_milestones ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.budget_types ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.expense_categories ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.invoice_purchase_orders ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.kyc_levels ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.kyc_level_requirements ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.milestone_confirmations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.payment_batch_invoices ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.payment_batches ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.purchase_order_items ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.supplier_access_tokens ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.supplier_agreements ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.supplier_bank_accounts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.supplier_contacts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.supplier_invoices ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.supplier_kyc_documents ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.supplier_ratings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.supplier_types ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.teams ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN organization_id SET NOT NULL;

-- 7. Index pour performance
CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON public.suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization_id ON public.purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_organization_id ON public.supplier_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_budgets_organization_id ON public.budgets(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_organization_id ON public.bank_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON public.transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_organization_id ON public.expense_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_types_organization_id ON public.supplier_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_article_types_organization_id ON public.article_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_access_tokens_organization_id ON public.supplier_access_tokens(organization_id);