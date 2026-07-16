-- ============================================================
-- Historique des montants d'un budget (CA initial / provision de charges)
--  * rôle 'finance' ajouté
--  * table timeline budget_amount_changes (journal des changements)
--  * RPC change_budget_amount : journalise + verrouille la HAUSSE de provision
--    de charges au rôle finance (ou admin). Motif obligatoire.
-- ============================================================
BEGIN;

-- 1) Rôle finance
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin','manager','user','finance'));

-- 2) Journal des montants
CREATE TABLE IF NOT EXISTS public.budget_amount_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  field text NOT NULL CHECK (field IN ('initial_amount','resale_price')),
  old_value numeric,
  new_value numeric,
  delta numeric,
  reason text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_amount_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bac_select_org" ON public.budget_amount_changes;
CREATE POLICY "bac_select_org" ON public.budget_amount_changes FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(),'admin-sapajoo'));

CREATE INDEX IF NOT EXISTS idx_bac_budget ON public.budget_amount_changes(budget_id, created_at);

-- 3) RPC de changement contrôlé + journalisé
CREATE OR REPLACE FUNCTION public.change_budget_amount(
  _budget_id uuid, _field text, _new_value numeric, _reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  org uuid; cur numeric; is_finance boolean; is_admin boolean;
BEGIN
  IF _field NOT IN ('initial_amount','resale_price') THEN
    RAISE EXCEPTION 'Champ non autorisé: %', _field;
  END IF;
  IF _reason IS NULL OR btrim(_reason) = '' THEN
    RAISE EXCEPTION 'Un motif est requis';
  END IF;

  SELECT organization_id,
         CASE WHEN _field='initial_amount' THEN initial_amount ELSE resale_price END
    INTO org, cur
    FROM public.budgets WHERE id = _budget_id;
  IF org IS NULL THEN RAISE EXCEPTION 'Budget introuvable'; END IF;
  IF org <> public.current_user_organization_id() AND NOT public.has_role(auth.uid(),'admin-sapajoo') THEN
    RAISE EXCEPTION 'Accès refusé (organisation)';
  END IF;

  is_finance := public.has_role(auth.uid(),'finance');
  is_admin := public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'admin-sapajoo');

  -- Verrou : augmenter la provision de charges nécessite le rôle finance (ou admin)
  IF _field = 'initial_amount' AND _new_value > COALESCE(cur,0) AND NOT (is_finance OR is_admin) THEN
    RAISE EXCEPTION 'Seul un utilisateur « finance » peut augmenter la provision de charges';
  END IF;

  IF _field = 'initial_amount' THEN
    UPDATE public.budgets SET initial_amount = _new_value, updated_at = now() WHERE id = _budget_id;
  ELSE
    UPDATE public.budgets SET resale_price = _new_value, updated_at = now() WHERE id = _budget_id;
  END IF;

  INSERT INTO public.budget_amount_changes
    (organization_id, budget_id, field, old_value, new_value, delta, reason, changed_by)
  VALUES (org, _budget_id, _field, cur, _new_value, _new_value - COALESCE(cur,0), _reason, auth.uid());
END $$;

GRANT EXECUTE ON FUNCTION public.change_budget_amount(uuid, text, numeric, text) TO authenticated;

COMMIT;
