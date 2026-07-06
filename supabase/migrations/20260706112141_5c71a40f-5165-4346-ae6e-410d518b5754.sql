CREATE POLICY "transactions_select_org" ON public.transactions FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "transactions_insert_org" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "transactions_update_org" ON public.transactions FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "transactions_delete_org" ON public.transactions FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "teams_select_org" ON public.teams FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "teams_insert_org" ON public.teams FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "teams_update_org" ON public.teams FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "teams_delete_org" ON public.teams FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "budget_types_select_org" ON public.budget_types FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "budget_types_insert_org" ON public.budget_types FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "budget_types_update_org" ON public.budget_types FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "budget_types_delete_org" ON public.budget_types FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "kyc_levels_select_org" ON public.kyc_levels FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "kyc_levels_insert_org" ON public.kyc_levels FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "kyc_levels_update_org" ON public.kyc_levels FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "kyc_levels_delete_org" ON public.kyc_levels FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

CREATE POLICY "kyc_level_requirements_select_org" ON public.kyc_level_requirements FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "kyc_level_requirements_insert_org" ON public.kyc_level_requirements FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "kyc_level_requirements_update_org" ON public.kyc_level_requirements FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));
CREATE POLICY "kyc_level_requirements_delete_org" ON public.kyc_level_requirements FOR DELETE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));