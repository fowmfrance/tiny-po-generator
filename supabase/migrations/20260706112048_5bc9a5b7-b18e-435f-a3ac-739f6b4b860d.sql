CREATE POLICY "budgets_select_org" ON public.budgets FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "budgets_insert_org" ON public.budgets FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "budgets_update_org" ON public.budgets FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "budgets_delete_org" ON public.budgets FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "budget_milestones_select_org" ON public.budget_milestones FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "budget_milestones_insert_org" ON public.budget_milestones FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "budget_milestones_update_org" ON public.budget_milestones FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "budget_milestones_delete_org" ON public.budget_milestones FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "milestone_confirmations_select_org" ON public.milestone_confirmations FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "milestone_confirmations_insert_org" ON public.milestone_confirmations FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "milestone_confirmations_update_org" ON public.milestone_confirmations FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "milestone_confirmations_delete_org" ON public.milestone_confirmations FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "clients_select_org" ON public.clients FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "clients_insert_org" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "clients_update_org" ON public.clients FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "clients_delete_org" ON public.clients FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "expense_categories_select_org" ON public.expense_categories FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "expense_categories_insert_org" ON public.expense_categories FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "expense_categories_update_org" ON public.expense_categories FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "expense_categories_delete_org" ON public.expense_categories FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "supplier_types_select_org" ON public.supplier_types FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_types_insert_org" ON public.supplier_types FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_types_update_org" ON public.supplier_types FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_types_delete_org" ON public.supplier_types FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "article_types_select_org" ON public.article_types FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "article_types_insert_org" ON public.article_types FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "article_types_update_org" ON public.article_types FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "article_types_delete_org" ON public.article_types FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "bank_connections_select_org" ON public.bank_connections FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "bank_connections_insert_org" ON public.bank_connections FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "bank_connections_update_org" ON public.bank_connections FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "bank_connections_delete_org" ON public.bank_connections FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "bank_label_mappings_select_org" ON public.bank_label_mappings FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "bank_label_mappings_insert_org" ON public.bank_label_mappings FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "bank_label_mappings_update_org" ON public.bank_label_mappings FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "bank_label_mappings_delete_org" ON public.bank_label_mappings FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
