-- Normalisation backfill : amount HT -> TTC (convention app = montant TTC)
-- Idempotent (ne s'applique que si amount vaut encore le HT). vat_amount déjà renseigné.
BEGIN;
UPDATE public.supplier_invoices SET amount=62.14, updated_at=now() WHERE invoice_number='FA043945' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-51.78)<0.005;
UPDATE public.supplier_invoices SET amount=1344.75, updated_at=now() WHERE invoice_number='421' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-1222.50)<0.005;
UPDATE public.supplier_invoices SET amount=600.00, updated_at=now() WHERE invoice_number='2025-059' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-500.00)<0.005;
UPDATE public.supplier_invoices SET amount=600.00, updated_at=now() WHERE invoice_number='2026-002' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-500.00)<0.005;
UPDATE public.supplier_invoices SET amount=600.00, updated_at=now() WHERE invoice_number='2026-007' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-500.00)<0.005;
UPDATE public.supplier_invoices SET amount=1200.00, updated_at=now() WHERE invoice_number='2026-012' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-1000.00)<0.005;
UPDATE public.supplier_invoices SET amount=780.00, updated_at=now() WHERE invoice_number='2026-019' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-650.00)<0.005;
UPDATE public.supplier_invoices SET amount=660.00, updated_at=now() WHERE invoice_number='2026-025' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-550.00)<0.005;
UPDATE public.supplier_invoices SET amount=360.00, updated_at=now() WHERE invoice_number='2026-031' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-300.00)<0.005;
UPDATE public.supplier_invoices SET amount=1800.00, updated_at=now() WHERE invoice_number='2026-002996' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-1500.00)<0.005;
UPDATE public.supplier_invoices SET amount=3125.00, updated_at=now() WHERE invoice_number='21540-26' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-2696.97)<0.005;
UPDATE public.supplier_invoices SET amount=660.00, updated_at=now() WHERE invoice_number='F202512-64' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-550.00)<0.005;
UPDATE public.supplier_invoices SET amount=142.57, updated_at=now() WHERE invoice_number='F-260306-15748' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-133.08)<0.005;
UPDATE public.supplier_invoices SET amount=57.68, updated_at=now() WHERE invoice_number='GCFRD0011390185' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-48.07)<0.005;
UPDATE public.supplier_invoices SET amount=20.99, updated_at=now() WHERE invoice_number='9322130297' AND attachment_url LIKE '%factures-fournisseurs%' AND abs(amount-17.49)<0.005;
COMMIT;
