-- Rapprochement direct opération bancaire → facture fournisseur (« phase 2 »).
--
-- Pourquoi : le code projet d'une opération bancaire doit remonter tout seul le
-- long de la chaîne fournisseur → BdC → facture → paiement. Il manquait le
-- dernier maillon : transactions ne référençait pas la facture payée.
-- (payment_batch_invoices.transaction_id existe mais n'est renseigné que par le
-- circuit « lots de paiement », jamais depuis l'écran banque : 0 ligne à date.)
--
-- Une fois la facture liée, le front dérive le code projet :
--   facture → purchase_order_id → budgets.code (ou supplier_invoices.project_code
--   pour les factures hors BdC) — et fige le résultat dans transactions.project_code
--   pour que les écrans existants (reporting) continuent de lire ce champ.
--
-- Pas d'index sur supplier_invoice_id : ~750 transactions, aucune requête ne
-- filtre dessus côté app (lookup en mémoire). À revoir si le volume décolle.
--
-- ✅ EXÉCUTÉE en prod le 2026-07-22 via le connecteur Lovable.

alter table public.transactions
  add column if not exists supplier_invoice_id uuid
  references public.supplier_invoices(id) on delete set null;

comment on column public.transactions.supplier_invoice_id is
  'Facture fournisseur rapprochée de cette opération bancaire. Le code projet se dérive de la facture (BdC → budget) ; transactions.project_code en garde une copie figée pour le reporting.';
