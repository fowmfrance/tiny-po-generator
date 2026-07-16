-- ============================================================
-- Paiements partiels des factures fournisseurs
-- Étend payment_batch_invoices : 1 ligne = 1 paiement partiel.
--  * cycle de vie : prepared -> ordered (ordre SEPA émis) -> paid (réglé)
--  * date de règlement en banque + rapprochement à une opération (transactions)
--  * max 5 paiements / facture ; statut facture recalculé (partial/paid) + paid_date
-- Réutilise les lots (payment_batches) : un lot = un événement de paiement
-- (manuel single, ou SEPA multi-factures avec sepa_xml).
-- ============================================================
BEGIN;

-- 1) Colonnes par paiement partiel
ALTER TABLE public.payment_batch_invoices
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'prepared',
  ADD COLUMN IF NOT EXISTS bank_payment_date date,
  ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS value_date date,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.payment_batch_invoices DROP CONSTRAINT IF EXISTS payment_batch_invoices_status_check;
ALTER TABLE public.payment_batch_invoices
  ADD CONSTRAINT payment_batch_invoices_status_check
  CHECK (status IN ('prepared','ordered','paid','cancelled'));

CREATE INDEX IF NOT EXISTS idx_pbi_invoice_status ON public.payment_batch_invoices(invoice_id, status);

DROP TRIGGER IF EXISTS trg_pbi_touch ON public.payment_batch_invoices;
CREATE TRIGGER trg_pbi_touch BEFORE UPDATE ON public.payment_batch_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Statut facture : ajoute 'partial'
ALTER TABLE public.supplier_invoices DROP CONSTRAINT IF EXISTS supplier_invoices_status_check;
ALTER TABLE public.supplier_invoices
  ADD CONSTRAINT supplier_invoices_status_check
  CHECK (status IN ('pending','approved','partial','paid','cancelled'));

-- 3) Plafond : 5 paiements partiels non annulés par facture
CREATE OR REPLACE FUNCTION public.enforce_max_partial_payments()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cnt int;
BEGIN
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  SELECT count(*) INTO cnt
    FROM public.payment_batch_invoices
    WHERE invoice_id = NEW.invoice_id
      AND status <> 'cancelled'
      AND id <> NEW.id;
  IF cnt >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 paiements partiels par facture (facture %)', NEW.invoice_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_max_partial_payments ON public.payment_batch_invoices;
CREATE TRIGGER trg_max_partial_payments BEFORE INSERT OR UPDATE ON public.payment_batch_invoices
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_partial_payments();

-- 4) Recalcul du statut + paid_date de la facture selon les paiements réglés
--    TTC de référence = supplier_invoices.amount (convention app : montant TTC)
CREATE OR REPLACE FUNCTION public.recompute_invoice_payment_status()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  inv_id uuid := COALESCE(NEW.invoice_id, OLD.invoice_id);
  ttc numeric;
  cur_status text;
  paid numeric;
  maxd date;
BEGIN
  SELECT amount, status INTO ttc, cur_status FROM public.supplier_invoices WHERE id = inv_id;
  IF NOT FOUND OR cur_status = 'cancelled' THEN RETURN NULL; END IF;

  SELECT COALESCE(sum(amount_paid), 0), max(bank_payment_date)
    INTO paid, maxd
    FROM public.payment_batch_invoices
    WHERE invoice_id = inv_id AND status = 'paid';

  IF COALESCE(ttc, 0) > 0 AND paid >= ttc - 0.005 THEN
    UPDATE public.supplier_invoices
      SET status = 'paid', paid_date = COALESCE(maxd, paid_date), updated_at = now()
      WHERE id = inv_id;
  ELSIF paid > 0 THEN
    UPDATE public.supplier_invoices
      SET status = 'partial', paid_date = NULL, updated_at = now()
      WHERE id = inv_id;
  ELSE
    UPDATE public.supplier_invoices
      SET status = CASE WHEN cur_status IN ('paid','partial') THEN 'pending' ELSE cur_status END,
          paid_date = NULL, updated_at = now()
      WHERE id = inv_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_recompute_invoice_payment ON public.payment_batch_invoices;
CREATE TRIGGER trg_recompute_invoice_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_batch_invoices
  FOR EACH ROW EXECUTE FUNCTION public.recompute_invoice_payment_status();

-- 5) Policy UPDATE manquante (rapprochement : passer un paiement à 'paid' + date banque)
DROP POLICY IF EXISTS "payment_batch_invoices_update_org" ON public.payment_batch_invoices;
CREATE POLICY "payment_batch_invoices_update_org" ON public.payment_batch_invoices
  FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'))
  WITH CHECK (organization_id = public.current_user_organization_id() OR public.has_role(auth.uid(), 'admin-sapajoo'));

COMMIT;
