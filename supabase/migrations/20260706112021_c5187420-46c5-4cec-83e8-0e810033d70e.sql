-- 8. Supprimer toutes les anciennes politiques user-scoped
DROP POLICY IF EXISTS "suppliers_select_own" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert_own" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update_own" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_select_admin" ON public.suppliers;
DROP POLICY IF EXISTS "bank_accounts_select_own" ON public.supplier_bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_insert_own" ON public.supplier_bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_update_own" ON public.supplier_bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_delete_own" ON public.supplier_bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_select_admin" ON public.supplier_bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_update_admin" ON public.supplier_bank_accounts;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.supplier_invoices;
DROP POLICY IF EXISTS "Users can create their own invoices" ON public.supplier_invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.supplier_invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.supplier_invoices;
DROP POLICY IF EXISTS "Users can view their own payment batches" ON public.payment_batches;
DROP POLICY IF EXISTS "Users can create their own payment batches" ON public.payment_batches;
DROP POLICY IF EXISTS "Users can update their own payment batches" ON public.payment_batches;
DROP POLICY IF EXISTS "Users can view their batch invoices" ON public.payment_batch_invoices;
DROP POLICY IF EXISTS "Users can create their batch invoices" ON public.payment_batch_invoices;
DROP POLICY IF EXISTS "Users can view their own POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can create their own POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can update their own POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can delete their own POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can view items of their POs" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users can create items for their POs" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users can update items of their POs" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users can delete items of their POs" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users can view their own categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view their own mappings" ON public.bank_label_mappings;
DROP POLICY IF EXISTS "Users can create their own mappings" ON public.bank_label_mappings;
DROP POLICY IF EXISTS "Users can update their own mappings" ON public.bank_label_mappings;
DROP POLICY IF EXISTS "Users can delete their own mappings" ON public.bank_label_mappings;
DROP POLICY IF EXISTS "Users can view their own article types" ON public.article_types;
DROP POLICY IF EXISTS "Users can create their own article types" ON public.article_types;
DROP POLICY IF EXISTS "Users can update their own article types" ON public.article_types;
DROP POLICY IF EXISTS "Users can delete their own article types" ON public.article_types;
DROP POLICY IF EXISTS "Users can view their own supplier types" ON public.supplier_types;
DROP POLICY IF EXISTS "Users can create their own supplier types" ON public.supplier_types;
DROP POLICY IF EXISTS "Users can update their own supplier types" ON public.supplier_types;
DROP POLICY IF EXISTS "Users can delete their own supplier types" ON public.supplier_types;
DROP POLICY IF EXISTS "Users can view ratings of their suppliers" ON public.supplier_ratings;
DROP POLICY IF EXISTS "Users can create ratings" ON public.supplier_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.supplier_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.supplier_ratings;
DROP POLICY IF EXISTS "Users can view their supplier contacts" ON public.supplier_contacts;
DROP POLICY IF EXISTS "Users can create their supplier contacts" ON public.supplier_contacts;
DROP POLICY IF EXISTS "Users can update their supplier contacts" ON public.supplier_contacts;
DROP POLICY IF EXISTS "Users can delete their supplier contacts" ON public.supplier_contacts;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Owner can manage tokens" ON public.supplier_access_tokens;
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view milestones of their budgets" ON public.budget_milestones;
DROP POLICY IF EXISTS "Users can create milestones for their budgets" ON public.budget_milestones;
DROP POLICY IF EXISTS "Users can update milestones of their budgets" ON public.budget_milestones;
DROP POLICY IF EXISTS "Users can delete milestones of their budgets" ON public.budget_milestones;
DROP POLICY IF EXISTS "Users can view confirmations of their milestones" ON public.milestone_confirmations;
DROP POLICY IF EXISTS "Users can create confirmations for their milestones" ON public.milestone_confirmations;
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view their own budget types" ON public.budget_types;
DROP POLICY IF EXISTS "Users can create their own budget types" ON public.budget_types;
DROP POLICY IF EXISTS "Users can update their own budget types" ON public.budget_types;
DROP POLICY IF EXISTS "Users can delete their own budget types" ON public.budget_types;
DROP POLICY IF EXISTS "Users can view their own bank connections" ON public.bank_connections;
DROP POLICY IF EXISTS "Users can create their own bank connections" ON public.bank_connections;
DROP POLICY IF EXISTS "Users can update their own bank connections" ON public.bank_connections;
DROP POLICY IF EXISTS "Users can delete their own bank connections" ON public.bank_connections;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create their own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can update their own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can delete their own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view their own agreements" ON public.supplier_agreements;
DROP POLICY IF EXISTS "Users can create their own agreements" ON public.supplier_agreements;
DROP POLICY IF EXISTS "Users can update their own agreements" ON public.supplier_agreements;
DROP POLICY IF EXISTS "Users can delete their own agreements" ON public.supplier_agreements;
DROP POLICY IF EXISTS "Users can view their own KYC levels" ON public.kyc_levels;
DROP POLICY IF EXISTS "Users can manage their own KYC levels" ON public.kyc_levels;
DROP POLICY IF EXISTS "Users can view requirements of their levels" ON public.kyc_level_requirements;
DROP POLICY IF EXISTS "Users can manage requirements of their levels" ON public.kyc_level_requirements;
DROP POLICY IF EXISTS "Users can view their invoice-PO links" ON public.invoice_purchase_orders;
DROP POLICY IF EXISTS "Users can create their invoice-PO links" ON public.invoice_purchase_orders;
DROP POLICY IF EXISTS "Users can delete their invoice-PO links" ON public.invoice_purchase_orders;
DROP POLICY IF EXISTS "Users can view KYC docs of their suppliers" ON public.supplier_kyc_documents;
DROP POLICY IF EXISTS "Users can manage KYC docs of their suppliers" ON public.supplier_kyc_documents;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_all_for_admins" ON public.user_roles;

-- 9. Créer les nouvelles politiques organization-scoped
-- profiles : les utilisateurs d'une même org se voient, + soi-même + admin-sapajoo
CREATE POLICY "profiles_select_org" ON public.profiles FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR id = auth.uid() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "profiles_update_org" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin-sapajoo'));

-- organizations : chacun voit sa propre org, admin-sapajoo voit tout
CREATE POLICY "organizations_select_own" ON public.organizations FOR SELECT TO authenticated
  USING (id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

-- suppliers
CREATE POLICY "suppliers_select_org" ON public.suppliers FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "suppliers_insert_org" ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "suppliers_update_org" ON public.suppliers FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "suppliers_delete_org" ON public.suppliers FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

-- supplier_invoices
CREATE POLICY "supplier_invoices_select_org" ON public.supplier_invoices FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_invoices_insert_org" ON public.supplier_invoices FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_invoices_update_org" ON public.supplier_invoices FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_invoices_delete_org" ON public.supplier_invoices FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

-- payment_batches
CREATE POLICY "payment_batches_select_org" ON public.payment_batches FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "payment_batches_insert_org" ON public.payment_batches FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "payment_batches_update_org" ON public.payment_batches FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "payment_batches_delete_org" ON public.payment_batches FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

-- payment_batch_invoices
CREATE POLICY "payment_batch_invoices_select_org" ON public.payment_batch_invoices FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "payment_batch_invoices_insert_org" ON public.payment_batch_invoices FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "payment_batch_invoices_delete_org" ON public.payment_batch_invoices FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

-- purchase_orders
CREATE POLICY "purchase_orders_select_org" ON public.purchase_orders FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "purchase_orders_insert_org" ON public.purchase_orders FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "purchase_orders_update_org" ON public.purchase_orders FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "purchase_orders_delete_org" ON public.purchase_orders FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

-- purchase_order_items
CREATE POLICY "purchase_order_items_select_org" ON public.purchase_order_items FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "purchase_order_items_insert_org" ON public.purchase_order_items FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "purchase_order_items_update_org" ON public.purchase_order_items FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "purchase_order_items_delete_org" ON public.purchase_order_items FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
