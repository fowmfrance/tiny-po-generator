-- Remplissage des dates de paiement des factures backfill (24 paiements réglés)
-- 1 lot « exécuté » qui porte les 24 lignes ; le trigger passe chaque facture en payé
-- (Hotel Hoy 21540-26 = acompte 1562,50 -> reste partiel). Sosh 9322130297 exclu.
-- Idempotent : s'arrête si des paiements réglés existent déjà.
BEGIN;
DO $$
DECLARE bid uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.payment_batch_invoices pbi
              JOIN public.supplier_invoices si ON si.id=pbi.invoice_id
             WHERE si.attachment_url LIKE '%factures-fournisseurs%' AND pbi.status='paid') THEN
    RAISE EXCEPTION 'Paiements déjà remplis — script déjà exécuté ?';
  END IF;

  INSERT INTO public.payment_batches
    (organization_id, user_id, batch_reference, currency, total_amount, invoice_count, status)
  VALUES ('c636ddb8-725d-45d2-b43b-5d41704dcf62', '9d9f9f6c-ab05-4bc3-acdc-60d335523731', 'PAY-BACKFILL-20260716', 'EUR', 22704.64, 24, 'executed')
  RETURNING id INTO bid;

  INSERT INTO public.payment_batch_invoices
    (batch_id, invoice_id, organization_id, amount_paid, status, bank_payment_date, payment_method)
  SELECT bid, si.id, 'c636ddb8-725d-45d2-b43b-5d41704dcf62', v.amt, 'paid', v.d, 'sepa_transfer'
  FROM (VALUES
    ('2025-059', 600.00, DATE '2025-12-01'),
    ('F202512-64', 660.00, DATE '2026-02-03'),
    ('2026-002', 600.00, DATE '2025-12-29'),
    ('GCFRD0011390185', 57.68, DATE '2026-01-02'),
    ('6774745F-0017', 25.00, DATE '2026-01-06'),
    ('2026-002996', 1800.00, DATE '2026-01-13'),
    ('FA043945', 62.14, DATE '2026-01-20'),
    ('20260117', 1750.00, DATE '2026-01-26'),
    ('2026-007', 600.00, DATE '2026-01-26'),
    ('421', 1344.75, DATE '2026-01-29'),
    ('20260219', 2000.00, DATE '2026-03-03'),
    ('F-260306-15748', 142.57, DATE '2026-03-07'),
    ('2026-012', 1200.00, DATE '2026-03-06'),
    ('202603-100', 400.00, DATE '2026-04-20'),
    ('20260321', 1750.00, DATE '2026-03-31'),
    ('21540-26', 1562.50, DATE '2026-06-01'),
    ('20260323', 500.00, DATE '2026-04-08'),
    ('20260424', 1750.00, DATE '2026-05-04'),
    ('2026-019', 780.00, DATE '2026-05-04'),
    ('20260527', 1750.00, DATE '2026-05-29'),
    ('2026-025', 660.00, DATE '2026-05-31'),
    ('20260629', 1750.00, DATE '2026-07-02'),
    ('2026-023', 600.00, DATE '2026-07-06'),
    ('2026-031', 360.00, DATE '2026-07-10')
  ) AS v(num, amt, d)
  JOIN public.supplier_invoices si
    ON si.invoice_number = v.num AND si.attachment_url LIKE '%factures-fournisseurs%';
END $$;

-- Sosh : aucune trace bancaire -> repasse en « à payer » (paid_date effacé)
UPDATE public.supplier_invoices
   SET status = 'pending', paid_date = NULL, updated_at = now()
 WHERE invoice_number = '9322130297' AND attachment_url LIKE '%factures-fournisseurs%';

COMMIT;

-- Vérif :
SELECT status, count(*) FROM public.supplier_invoices
 WHERE attachment_url LIKE '%factures-fournisseurs%' GROUP BY status ORDER BY status;
