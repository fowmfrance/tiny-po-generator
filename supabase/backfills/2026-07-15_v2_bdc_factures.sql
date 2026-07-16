-- ============================================================
-- SAPAJOO v2 — reprise BdC + factures liées (org FLEURON)
-- 1. Supprime les 74 BdC du premier passage (conservés en bkp)
-- 2. Flague is_po_exempt les fournisseurs à facturation semi-auto
-- 3. Crée 30 BdC (factures >= 2025-12-01, hors semi-auto), statut matched
-- 4. Crée 30 factures fournisseurs liées, PDF dans invoice-attachments
-- Dry-run : remplacer le COMMIT final par ROLLBACK.
-- ============================================================
BEGIN;

CREATE TEMP TABLE _ctx ON COMMIT DROP AS
SELECT '9d9f9f6c-ab05-4bc3-acdc-60d335523731'::uuid AS user_id, 'c636ddb8-725d-45d2-b43b-5d41704dcf62'::uuid AS org_id;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations o, _ctx c WHERE o.id = c.org_id AND o.name = 'FLEURON') THEN
    RAISE EXCEPTION 'Org FLEURON introuvable';
  END IF;
END $$;

-- 0) Backup de l'état v1 avant suppression
CREATE TABLE IF NOT EXISTS public.bkp_po_v1_20260715 AS
  SELECT * FROM public.purchase_orders WHERE notes LIKE 'Backfill facture %';
CREATE TABLE IF NOT EXISTS public.bkp_po_items_v1_20260715 AS
  SELECT i.* FROM public.purchase_order_items i
  JOIN public.purchase_orders po ON po.id = i.purchase_order_id
  WHERE po.notes LIKE 'Backfill facture %';

-- 1) Suppression des BdC v1
DELETE FROM public.purchase_order_items i
USING public.purchase_orders po
WHERE po.id = i.purchase_order_id AND po.notes LIKE 'Backfill facture %';
DELETE FROM public.purchase_orders WHERE notes LIKE 'Backfill facture %';

-- 2) Fournisseurs à facturation semi-automatique : pas de BdC
UPDATE public.suppliers s SET is_po_exempt = true
FROM _ctx c
WHERE s.organization_id = c.org_id
  AND (s.name ILIKE 'SNCF%' OR s.name ILIKE 'COPY-TOP%' OR s.name ILIKE '%Wojo%'
    OR s.name ILIKE '%WeWork%' OR s.name ILIKE 'Sosh%' OR s.name ILIKE 'Google Cloud%'
    OR s.name ILIKE 'Devoteam%' OR s.name ILIKE 'Anthropic%' OR s.name ILIKE 'Lovable%');

-- 3) Les 30 BdC + factures
CREATE TEMP TABLE _po (
  supplier_match text, invoice_number text, invoice_date date, sent_date date,
  amount_ht numeric, vat_amount numeric, vat_rate numeric, objet text, pdf_file text
) ON COMMIT DROP;
INSERT INTO _po VALUES
  ('%Touchard', '2025-059', DATE '2025-12-01', DATE '2025-11-30', 500.00, 100.00, 20.0, 'Enregistrement et production podcast Fleuron (1 session)', 'Facture_2025-059_Fowm_011225.pdf'),
  ('Unknown merchant (FACTURE FC/1992 - chocolatier/epicerie fine)', 'FC/1992', DATE '2025-12-16', DATE '2025-12-15', 67.58, 11.92, 17.6, 'Tablettes chocolat (Rosita, Eclair de Genie) + Champagne Ruinart - vendor name absent from OCR', 'Facture-FC_1992__1_.pdf'),
  ('Pauline Lagarde', 'F202512-64', DATE '2025-12-17', DATE '2025-12-16', 550.00, 110.00, 20.0, 'Forfait jour accompagnement marketing et communication', 'Facture-F202512-64.pdf'),
  ('Marie-Alix de Charry', '20251215', DATE '2025-12-18', DATE '2025-12-17', 2500.00, 0.00, 0, 'Retention Martin Pouret + Belsia (decembre 2025)', 'Facture_D_cembre_2025_FOWM.pdf'),
  ('%Touchard', '2026-002', DATE '2025-12-19', DATE '2025-12-18', 500.00, 100.00, 20.0, 'Enregistrement et production podcast Fleuron (1 session)', 'Facture_2026-002_Fowm_191225.pdf'),
  ('The Ludic Company', 'FA-2025-001', DATE '2025-12-30', DATE '2025-12-29', 18520.00, 0.00, 0, 'Refacturation mission CFO (client Nina Noten)', '2512-FA-2025-001-The-Ludic-Company.pdf'),
  ('The Ludic Company', 'FA-2025-002', DATE '2025-12-30', DATE '2025-12-29', 7500.00, 0.00, 0, 'Plateforme Coda retention + connecteurs (Odoo/Pennylane/Sellsy/Ankorstore) + add-on prospection 2025', '2512-FA-2025-002-The-Ludic-Company.pdf'),
  ('The Ludic Company', 'FA-2025-003', DATE '2025-12-30', DATE '2025-12-29', 2750.00, 0.00, 0, 'Site FOWM + Site Fleuron - evolution/maintenance 2025', '2512-FA-2025-003-The-Ludic-Company.pdf'),
  ('The Ludic Company', 'FA-2025-005', DATE '2025-12-30', DATE '2025-12-29', 5000.00, 0.00, 0, 'CFO part time (4 jours - cloture/revue/budget)', '2512-FA-2025-005-The-Ludic-Company.pdf'),
  ('Goinfres', '2026-002996', DATE '2026-01-08', DATE '2026-01-07', 1500.00, 300.00, 20.0, 'Location seche restaurant + materiel 27 Janvier 2026 (SIREN 911315687)', 'Facture_002996_GOINFRES_FOWM_Cyrielle_DOMERG__4_.pdf'),
  ('%Emballage', 'FA043945', DATE '2026-01-19', DATE '2026-01-18', 51.78, 10.36, 20.0, 'Sacs extra large kraft (emballage) + livraison', '_FA043945.pdf'),
  ('Marie-Alix de Charry', '20260117', DATE '2026-01-21', DATE '2026-01-20', 1750.00, 0.00, 0, 'Retention Martin Pouret (janvier 2026)', 'Facture_Janvier_2026_FOWM.pdf'),
  ('%Touchard', '2026-007', DATE '2026-01-26', DATE '2026-01-25', 500.00, 100.00, 20.0, 'Enregistrement et production podcast Fleuron (1 session)', 'Facture_2026-007_Fowm_260126.pdf'),
  ('Camille Barba', '421', DATE '2026-01-28', DATE '2026-01-27', 1222.50, 122.25, 10.0, 'Dejeuner Fleuron 27 Janvier (solde apres acompte n420); restant du TTC 1344.75', 'Facture_000421_Camille_BARBA_FOWM.pdf'),
  ('La Frenchie Communication', 'F2602-245', DATE '2026-02-05', DATE '2026-02-04', 85.00, 17.00, 20.0, 'Montage video court', 'Facture-F2602-245.pdf'),
  ('Marie-Alix de Charry', '20260219', DATE '2026-02-26', DATE '2026-02-25', 2000.00, 0.00, 0, 'Retention Martin Pouret + Introduction Maison Verteux (fevrier 2026)', 'Facture_Fe_vrier_2026_FOWM.pdf'),
  ('SAS INOUI (Symples)', 'F-260306-15748', DATE '2026-03-06', DATE '2026-03-05', 133.08, 9.49, 7.1, 'Commande boissons Symples (infusions petillantes bio) + port', 'F-260306-15748.pdf'),
  ('%Touchard', '2026-012', DATE '2026-03-06', DATE '2026-03-05', 1000.00, 200.00, 20.0, 'Enregistrement et production podcast Fleuron (2 sessions)', 'Facture_2026-012_Fowm_060326.pdf'),
  ('La Frenchie Communication', 'F2603-264', DATE '2026-03-10', DATE '2026-03-09', 120.00, 24.00, 20.0, 'Coaching 1h feuille de route montages video', 'Facture-F2603-264.pdf'),
  ('Chloé Marcel EI', '202603-100', DATE '2026-03-30', DATE '2026-03-29', 400.00, 0.00, 0, 'Package accompagnement editorial LinkedIn (mars 2026)', 'Facture_Cyrielle_Domerg_FOWM_Mission_accompagnement_strate_gique_e_ditorial_LinkedIn_mars_2026_-_Chloe_Marcel_EI_-202603-100.pdf'),
  ('Marie-Alix de Charry', '20260321', DATE '2026-03-31', DATE '2026-03-30', 1750.00, 0.00, 0, 'Retention Martin Pouret (mars 2026)', 'Facture_Mars_2026_FOWM.pdf'),
  ('Hotel Hoy', '21540-26', DATE '2026-04-07', DATE '2026-04-06', 2696.97, 428.03, 15.9, 'Evenement mardi 2 juin (25 pax): dejeuner + privatisation Floreria/restaurant. Total TTC 3125 (acompte 50% 1562,50)', 'Facture_V3_Curielle_Fleuron_.pdf'),
  ('Marie-Alix de Charry', '20260323', DATE '2026-04-07', DATE '2026-04-06', 500.00, 0.00, 0, 'Facture complementaire - Retention Martin Pouret (mars 2026)', 'Facture_comple_mentaire_Mars_2026_FOWM.pdf'),
  ('Marie-Alix de Charry', '20260424', DATE '2026-04-29', DATE '2026-04-28', 1750.00, 0.00, 0, 'Retention Martin Pouret (avril 2026)', 'Facture_Avril_2026_FOWM.pdf'),
  ('%Touchard', '2026-019', DATE '2026-05-02', DATE '2026-05-01', 650.00, 130.00, 20.0, 'Podcast Fleuron (1 session) + production video verticale (Ep McDonalds)', 'Facture_2026-019_Fowm_020526.pdf'),
  ('Marie-Alix de Charry', '20260527', DATE '2026-05-28', DATE '2026-05-27', 1750.00, 0.00, 0, 'Retention Martin Pouret (mai 2026)', 'Facture_Mai_FOWM.pdf'),
  ('%Touchard', '2026-025', DATE '2026-05-29', DATE '2026-05-28', 550.00, 110.00, 20.0, 'Podcast Fleuron (Ep Compass) + productions video verticale (Rungis, face cam)', 'Facture_2026-025_Fowm_290526.pdf'),
  ('Marie-Alix de Charry', '20260629', DATE '2026-06-29', DATE '2026-06-28', 1750.00, 0.00, 0, 'Retention Martin Pouret (juin 2026)', 'Facture_juin_FOWM.pdf'),
  ('Helder Ferreira Film', '2026-023', DATE '2026-06-30', DATE '2026-06-29', 600.00, 0.00, 0, 'Forfait essentiel (prestation video) - exonere TVA art 293B', 'Facture_He_lderFerreira.film_-_FOWM_2.pdf'),
  ('%Touchard', '2026-031', DATE '2026-07-07', DATE '2026-07-06', 300.00, 60.00, 20.0, 'Production video verticale < 1'' (4x)', 'Facture_2026-031_Fowm_070726.pdf');

CREATE TEMP TABLE _po_resolved ON COMMIT DROP AS
SELECT p.*,
  (SELECT s.id FROM public.suppliers s, _ctx c
    WHERE s.organization_id = c.org_id AND s.name ILIKE p.supplier_match || '%' LIMIT 1) AS supplier_id,
  row_number() OVER (ORDER BY p.sent_date, p.pdf_file) AS seq
FROM _po p;

DO $$
DECLARE missing int;
BEGIN
  SELECT count(*) INTO missing FROM _po_resolved WHERE supplier_id IS NULL;
  IF missing > 0 THEN
    RAISE EXCEPTION 'Fournisseur non résolu pour % BdC : %', missing,
      (SELECT string_agg(DISTINCT supplier_match, ' | ') FROM _po_resolved WHERE supplier_id IS NULL);
  END IF;
  IF EXISTS (SELECT 1 FROM public.supplier_invoices WHERE invoice_number IN (SELECT invoice_number FROM _po)) THEN
    RAISE EXCEPTION 'Des factures de cette liste existent déjà — script déjà exécuté ?';
  END IF;
END $$;

CREATE TEMP TABLE _base ON COMMIT DROP AS
SELECT count(*)::int AS n FROM public.purchase_orders po, _ctx c
WHERE po.user_id = c.user_id AND po.po_number NOT LIKE 'DR-%';

INSERT INTO public.purchase_orders
  (organization_id, user_id, supplier_id, supplier_name, po_number, currency,
   total_amount, status, sent_at, created_at, updated_at)
SELECT c.org_id, c.user_id, r.supplier_id, s.name,
  'PO-' || lpad((b.n + r.seq)::text, 4, '0'),
  'EUR', r.amount_ht, 'matched',
  (r.sent_date::timestamptz + interval '10 hours'),
  (r.sent_date::timestamptz + interval '10 hours'),
  (r.sent_date::timestamptz + interval '10 hours')
FROM _po_resolved r
JOIN public.suppliers s ON s.id = r.supplier_id
CROSS JOIN _ctx c CROSS JOIN _base b;

INSERT INTO public.purchase_order_items
  (purchase_order_id, organization_id, description, quantity, unit_price)
SELECT po.id, po.organization_id, r.objet, 1, r.amount_ht
FROM _po_resolved r
CROSS JOIN _base b
JOIN public.purchase_orders po ON po.po_number = 'PO-' || lpad((b.n + r.seq)::text, 4, '0');

-- 4) Factures fournisseurs liées (PDF uploadés dans invoice-attachments)
INSERT INTO public.supplier_invoices
  (organization_id, user_id, supplier_id, supplier_name, purchase_order_id, po_number,
   invoice_number, amount, vat_amount, vat_rate, currency,
   invoice_date, received_date, due_date, status, attachment_url, created_at, updated_at)
SELECT c.org_id, c.user_id, r.supplier_id, s.name, po.id, po.po_number,
  r.invoice_number, r.amount_ht, NULLIF(r.vat_amount, 0), NULLIF(r.vat_rate, 0), 'EUR',
  r.invoice_date, r.invoice_date, r.invoice_date + 30, 'paid',
  '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/' || r.pdf_file,
  (r.invoice_date::timestamptz + interval '11 hours'),
  (r.invoice_date::timestamptz + interval '11 hours')
FROM _po_resolved r
CROSS JOIN _base b
JOIN public.purchase_orders po ON po.po_number = 'PO-' || lpad((b.n + r.seq)::text, 4, '0')
JOIN public.suppliers s ON s.id = r.supplier_id
CROSS JOIN _ctx c;

-- 5) Vérifications
SELECT 'BdC v1 restants (attendu 0)' AS check_label, count(*)::text AS valeur
  FROM public.purchase_orders WHERE notes LIKE 'Backfill facture %'
UNION ALL
SELECT 'fournisseurs is_po_exempt', count(*)::text FROM public.suppliers s, _ctx c
  WHERE s.organization_id = c.org_id AND s.is_po_exempt
UNION ALL
SELECT 'BdC v2 (attendu 30)', count(*)::text FROM public.purchase_orders po
  WHERE po.id IN (SELECT purchase_order_id FROM public.supplier_invoices WHERE invoice_number IN (SELECT invoice_number FROM _po))
UNION ALL
SELECT 'factures liées (attendu 30)', count(*)::text FROM public.supplier_invoices
  WHERE invoice_number IN (SELECT invoice_number FROM _po)
UNION ALL
SELECT 'total HT BdC v2 (attendu 58946.91)', round(sum(total_amount),2)::text
  FROM public.purchase_orders
  WHERE id IN (SELECT purchase_order_id FROM public.supplier_invoices WHERE invoice_number IN (SELECT invoice_number FROM _po));

COMMIT;
