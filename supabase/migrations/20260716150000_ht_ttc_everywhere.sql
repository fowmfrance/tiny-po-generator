-- ============================================================
-- Fondation HT/TTC : stocker les DEUX montants partout (cohérence permanente)
--   Trésorerie & paiements = TTC ; CA & charges (P&L) = HT.
--   purchase_orders : total_amount = HT (commande) -> amount_ht/amount_ttc/vat_amount
--   supplier_invoices : amount = TTC (convention app) -> amount_ht/amount_ttc
-- PRÉREQUIS : lancer d'abord 2026-07-16_fix_invoice_amount_ttc.sql
--            (normalise les factures backfill dont amount valait le HT).
-- ============================================================
BEGIN;

-- 1) Colonnes
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS amount_ht numeric,
  ADD COLUMN IF NOT EXISTS amount_ttc numeric,
  ADD COLUMN IF NOT EXISTS vat_amount numeric;

ALTER TABLE public.supplier_invoices
  ADD COLUMN IF NOT EXISTS amount_ht numeric,
  ADD COLUMN IF NOT EXISTS amount_ttc numeric;

-- 2) Backfill factures : amount = TTC ; HT = TTC - TVA
UPDATE public.supplier_invoices
   SET amount_ttc = amount,
       amount_ht  = round(amount - COALESCE(vat_amount, 0), 2)
 WHERE amount_ttc IS NULL;

-- 3) Backfill BdC : total_amount = HT ; TTC depuis les factures liées si dispo
UPDATE public.purchase_orders po
   SET amount_ht = po.total_amount
 WHERE amount_ht IS NULL;

UPDATE public.purchase_orders po
   SET amount_ttc = COALESCE(
         (SELECT round(sum(si.amount_ttc), 2) FROM public.supplier_invoices si
           WHERE si.purchase_order_id = po.id AND si.status <> 'cancelled'),
         po.amount_ht),
       vat_amount = COALESCE(
         (SELECT round(sum(si.amount_ttc), 2) FROM public.supplier_invoices si
           WHERE si.purchase_order_id = po.id AND si.status <> 'cancelled'),
         po.amount_ht) - po.amount_ht
 WHERE amount_ttc IS NULL;

COMMIT;
