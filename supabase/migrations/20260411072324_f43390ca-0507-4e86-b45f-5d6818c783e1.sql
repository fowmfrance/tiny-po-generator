
-- 1. Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  siret TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  max_users INTEGER NOT NULL DEFAULT 5,
  contact_email TEXT,
  contact_name TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Only admin-sapajoo can manage organizations
CREATE POLICY "admin_sapajoo_select_organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_insert_organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_update_organizations"
ON public.organizations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_delete_organizations"
ON public.organizations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add organization_id to profiles
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 3. Cross-tenant READ policies for admin-sapajoo on key tables
CREATE POLICY "admin_sapajoo_select_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_update_profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_select_purchase_orders"
ON public.purchase_orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_select_budgets"
ON public.budgets FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_select_suppliers"
ON public.suppliers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_select_invoices"
ON public.supplier_invoices FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_select_user_roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_insert_user_roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_update_user_roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "admin_sapajoo_delete_user_roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin-sapajoo'));
