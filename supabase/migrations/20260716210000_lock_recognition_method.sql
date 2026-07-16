-- ============================================================
-- Verrouillage de la méthode de reconnaissance (garde-fou wizard)
-- ⚠️ Lovable Cloud : migration à exécuter MANUELLEMENT dans le SQL editor.
--
-- Règle : budgets.recognition_method_id devient non modifiable dès
-- qu'une première écriture (CA ou charge) a été reconnue sur le budget.
-- Seul un admin (has_role(uid, 'admin')) peut alors en changer — l'UI
-- affiche un avertissement : les montants déjà reconnus seront recalculés.
--
-- La reconnaissance est calculée à la volée (pas d'écritures persistées
-- avant le moteur de cut-off, phase 2) : le « démarrage » est donc dérivé
-- du déclencheur de la méthode courante, en miroir du calcul frontend
-- (calculateRecognizedAmount) :
--   * poc_milestone       → premier jalon complété ou entamé (% > 0)
--   * over_time_linear    → premier jour de la période écoulé
--   * completed_contract  → budget achevé (statut ou date de fin passée)
--   * collection          → première sortie de trésorerie effective
--   * autres (point_in_time, poc_cost_to_cost, poc_efforts, proportional)
--                         → première facture fournisseur non annulée
--                           rattachée au budget (charge constatée)
-- Le frontend reste tolérant tant que la migration n'est pas exécutée :
-- la RPC absente est interprétée comme « pas de verrou ».
-- ============================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.budget_recognition_started(_budget_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b record;
BEGIN
  SELECT bu.start_date, bu.end_date, bu.status, rm.code AS method_code
    INTO b
    FROM public.budgets bu
    JOIN public.recognition_methods rm ON rm.id = bu.recognition_method_id
   WHERE bu.id = _budget_id;

  -- Budget introuvable ou sans méthode : rien n'a pu être reconnu
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  CASE b.method_code
    WHEN 'poc_milestone' THEN
      RETURN EXISTS (
        SELECT 1
          FROM public.budget_milestones m
         WHERE m.budget_id = _budget_id
           AND (m.is_completed OR m.completion_percentage > 0));

    WHEN 'over_time_linear' THEN
      RETURN b.start_date IS NOT NULL AND b.start_date <= CURRENT_DATE;

    WHEN 'completed_contract' THEN
      RETURN b.status = 'completed'
          OR (b.end_date IS NOT NULL AND b.end_date < CURRENT_DATE);

    WHEN 'collection' THEN
      -- Facture rattachée au budget avec un règlement effectif
      -- (lien direct supplier_invoices.purchase_order_id OU jonction N-N)
      RETURN EXISTS (
        SELECT 1
          FROM public.purchase_orders po
          JOIN public.supplier_invoices si ON si.purchase_order_id = po.id
         WHERE po.budget_id = _budget_id
           AND (si.status IN ('partial', 'paid') OR si.paid_date IS NOT NULL))
      OR EXISTS (
        SELECT 1
          FROM public.purchase_orders po
          JOIN public.invoice_purchase_orders ipo ON ipo.purchase_order_id = po.id
          JOIN public.supplier_invoices si ON si.id = ipo.invoice_id
         WHERE po.budget_id = _budget_id
           AND (si.status IN ('partial', 'paid') OR si.paid_date IS NOT NULL));

    ELSE
      -- Facture fournisseur non annulée rattachée au budget
      RETURN EXISTS (
        SELECT 1
          FROM public.purchase_orders po
          JOIN public.supplier_invoices si ON si.purchase_order_id = po.id
         WHERE po.budget_id = _budget_id
           AND si.status <> 'cancelled')
      OR EXISTS (
        SELECT 1
          FROM public.purchase_orders po
          JOIN public.invoice_purchase_orders ipo ON ipo.purchase_order_id = po.id
          JOIN public.supplier_invoices si ON si.id = ipo.invoice_id
         WHERE po.budget_id = _budget_id
           AND si.status <> 'cancelled');
  END CASE;
END $$;

REVOKE ALL ON FUNCTION public.budget_recognition_started(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.budget_recognition_started(uuid) TO authenticated, service_role;

-- Garde-fou serveur : bloque le changement de méthode pour les non-admins
-- dès que la reconnaissance a démarré (le verrou UI seul serait contournable
-- via l'API PostgREST). auth.uid() NULL = SQL editor / service role : bypass.
CREATE OR REPLACE FUNCTION public.enforce_recognition_method_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.recognition_method_id IS DISTINCT FROM OLD.recognition_method_id
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin')
     AND public.budget_recognition_started(OLD.id) THEN
    RAISE EXCEPTION 'RECOGNITION_METHOD_LOCKED: des montants ont déjà été reconnus sur ce budget. Seul un administrateur peut changer la méthode de reconnaissance.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_lock_recognition_method ON public.budgets;
CREATE TRIGGER trg_lock_recognition_method
  BEFORE UPDATE OF recognition_method_id ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_recognition_method_lock();

COMMIT;
