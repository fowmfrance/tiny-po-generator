CREATE POLICY "supplier_agreements_select_org" ON public.supplier_agreements FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_agreements_insert_org" ON public.supplier_agreements FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_agreements_update_org" ON public.supplier_agreements FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_agreements_delete_org" ON public.supplier_agreements FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "supplier_contacts_select_org" ON public.supplier_contacts FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_contacts_insert_org" ON public.supplier_contacts FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_contacts_update_org" ON public.supplier_contacts FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_contacts_delete_org" ON public.supplier_contacts FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "supplier_ratings_select_org" ON public.supplier_ratings FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_ratings_insert_org" ON public.supplier_ratings FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_ratings_update_org" ON public.supplier_ratings FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_ratings_delete_org" ON public.supplier_ratings FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "supplier_bank_accounts_select_org" ON public.supplier_bank_accounts FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_bank_accounts_insert_org" ON public.supplier_bank_accounts FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_bank_accounts_update_org" ON public.supplier_bank_accounts FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_bank_accounts_delete_org" ON public.supplier_bank_accounts FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "supplier_kyc_documents_select_org" ON public.supplier_kyc_documents FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_kyc_documents_insert_org" ON public.supplier_kyc_documents FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_kyc_documents_update_org" ON public.supplier_kyc_documents FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "supplier_kyc_documents_delete_org" ON public.supplier_kyc_documents FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "invoice_purchase_orders_select_org" ON public.invoice_purchase_orders FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "invoice_purchase_orders_insert_org" ON public.invoice_purchase_orders FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "invoice_purchase_orders_delete_org" ON public.invoice_purchase_orders FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "supplier_access_tokens_manage_org" ON public.supplier_access_tokens
  FOR ALL TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'))
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_types TO authenticated;
GRANT ALL ON public.article_types TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_connections TO authenticated;
GRANT ALL ON public.bank_connections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_label_mappings TO authenticated;
GRANT ALL ON public.bank_label_mappings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_milestones TO authenticated;
GRANT ALL ON public.budget_milestones TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_types TO authenticated;
GRANT ALL ON public.budget_types TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_categories TO authenticated;
GRANT ALL ON public.expense_categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_purchase_orders TO authenticated;
GRANT ALL ON public.invoice_purchase_orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_levels TO authenticated;
GRANT ALL ON public.kyc_levels TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_level_requirements TO authenticated;
GRANT ALL ON public.kyc_level_requirements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestone_confirmations TO authenticated;
GRANT ALL ON public.milestone_confirmations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_batch_invoices TO authenticated;
GRANT ALL ON public.payment_batch_invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_batches TO authenticated;
GRANT ALL ON public.payment_batches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_access_tokens TO authenticated;
GRANT ALL ON public.supplier_access_tokens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_agreements TO authenticated;
GRANT ALL ON public.supplier_agreements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_bank_accounts TO authenticated;
GRANT ALL ON public.supplier_bank_accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_contacts TO authenticated;
GRANT ALL ON public.supplier_contacts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_invoices TO authenticated;
GRANT ALL ON public.supplier_invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_kyc_documents TO authenticated;
GRANT ALL ON public.supplier_kyc_documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_ratings TO authenticated;
GRANT ALL ON public.supplier_ratings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_types TO authenticated;
GRANT ALL ON public.supplier_types TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;