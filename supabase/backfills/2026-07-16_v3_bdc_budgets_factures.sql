-- ============================================================
-- SAPAJOO v3 — BdC imputés au budget + factures seules (org FLEURON)
-- Remplace le backfill v1 (74 BdC). Source: onglet 2 du sheet (curé).
--  * 31 BdC réels -> purchase_orders (statut matched) imputés au Code projet
--    + facture liée (supplier_invoices) + PDF (invoice-attachments)
--  * 14 factures « Pas de BdC » (semi-auto) -> supplier_invoices SANS BdC
--    + code projet si présent + PDF ; fournisseurs passés is_po_exempt
--  * 38 lignes exclues (À créer=Non, ou BdC 2025 sans code)
-- Notes: aucune mention « backfill ». Dry-run: COMMIT -> ROLLBACK.
-- ============================================================
BEGIN;

CREATE TEMP TABLE _ctx ON COMMIT DROP AS
SELECT '9d9f9f6c-ab05-4bc3-acdc-60d335523731'::uuid AS user_id, 'c636ddb8-725d-45d2-b43b-5d41704dcf62'::uuid AS org_id;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations o,_ctx c WHERE o.id=c.org_id AND o.name='FLEURON') THEN
    RAISE EXCEPTION 'Org FLEURON introuvable'; END IF;
END $$;

DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(code,', ') INTO missing FROM (VALUES ('GA26-001'), ('GA26-002'), ('GA26-003'), ('PR26-001'), ('PR26-002'), ('PR26-003')) v(code)
    WHERE NOT EXISTS (SELECT 1 FROM public.budgets b,_ctx c WHERE b.organization_id=c.org_id AND b.code=v.code);
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Budgets absents (créer d''abord): %', missing; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.bkp_po_v1_20260716 AS
  SELECT * FROM public.purchase_orders WHERE notes LIKE 'Backfill facture %';
CREATE TABLE IF NOT EXISTS public.bkp_po_items_v1_20260716 AS
  SELECT i.* FROM public.purchase_order_items i JOIN public.purchase_orders po ON po.id=i.purchase_order_id
  WHERE po.notes LIKE 'Backfill facture %';
DELETE FROM public.purchase_order_items i USING public.purchase_orders po
  WHERE po.id=i.purchase_order_id AND po.notes LIKE 'Backfill facture %';
DELETE FROM public.purchase_orders WHERE notes LIKE 'Backfill facture %';

UPDATE public.suppliers s SET is_po_exempt=true FROM _ctx c
WHERE s.organization_id=c.org_id AND (
  s.name ILIKE 'SNCF%' OR s.name ILIKE 'Sosh%' OR s.name ILIKE 'Google Cloud%' OR s.name ILIKE 'Lovable%'
  OR s.name ILIKE 'COPY-TOP%' OR s.name ILIKE 'FNAC%' OR s.name ILIKE 'espoir-tech%' OR s.name ILIKE 'm3 Hospitality%');

CREATE TEMP TABLE _po (match text, invnum text, invdate date, sent date, ht numeric, vat numeric, rate numeric, objet text, code text, pdf text) ON COMMIT DROP;
INSERT INTO _po VALUES
  ('%Touchard', '2025-012', DATE '2024-12-02', DATE '2024-12-01', 1000.00, 200.00, 20.0, 'Enregistrement et production podcast Fleuron (2 sessions nov 2024)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2025-010_Fowm.pdf'),
  ('%Touchard', '2025-021', DATE '2025-01-14', DATE '2025-01-13', 1000.00, 200.00, 20.0, 'Enregistrement et production podcast Fleuron (2 sessions)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2025-021_Fowm_140125__1_.pdf'),
  ('Pauline Lagarde', '2025F02-056', DATE '2025-02-24', DATE '2025-02-23', 250.00, 50.00, 20.0, 'Conception de newsletters Fleuron (Fevrier-Mars)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/2025F02-056_PAULINE_LAGARDE.pdf'),
  ('Champagne Dremont-Marroy', 'F251388', DATE '2025-03-03', DATE '2025-03-02', 412.50, 82.50, 20.0, 'Champagne Carte Noire x18 + Carte Rouge x12 (75cl AOC Champagne)', 'GA26-003', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/IMG_4331.jpg'),
  ('Pauline Lagarde', '2025F03-058', DATE '2025-03-07', DATE '2025-03-06', 640.00, 128.00, 20.0, 'Newsletters Animation Mars FOWM', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/2025F03-058_PAULINE_LAGARDE.pdf'),
  ('Celine LE BRAS', 'Laga25-001', DATE '2025-04-01', DATE '2025-03-31', 300.00, 0.00, 0.0, 'Enregistrement et prod video (TVA non applicable art 293B)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_Laga25-001_Cyrielle_Domerg.pdf'),
  ('%Touchard', '2025-030', DATE '2025-04-08', DATE '2025-04-07', 1000.00, 200.00, 20.0, 'Enregistrement et production podcast Fleuron (2 sessions)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2025-030_Fowm_080425__1_.pdf'),
  ('%Touchard', '2025-035', DATE '2025-05-12', DATE '2025-05-11', 1500.00, 300.00, 20.0, 'Enregistrement et production podcast Fleuron (3 sessions)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2025-035_Fowm_120525.pdf'),
  ('Pauline Lagarde', 'F202511-21', DATE '2025-11-12', DATE '2025-11-11', 1080.67, 216.13, 20.0, 'Accompagnement Marketing - video courte + support webinar + deplacement', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture-F202511-21.pdf'),
  ('%Touchard', '2025-059', DATE '2025-12-01', DATE '2025-11-30', 500.00, 100.00, 20.0, 'Enregistrement et production podcast Fleuron (1 session)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2025-059_Fowm_011225.pdf'),
  ('Pauline Lagarde', 'F202512-64', DATE '2025-12-17', DATE '2025-12-16', 550.00, 110.00, 20.0, 'Forfait jour accompagnement marketing et communication', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture-F202512-64.pdf'),
  ('%Touchard', '2026-002', DATE '2025-12-19', DATE '2025-12-18', 500.00, 100.00, 20.0, 'Enregistrement et production podcast Fleuron (1 session)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2026-002_Fowm_191225.pdf'),
  ('Goinfres', '2026-002996', DATE '2026-01-08', DATE '2026-01-07', 1500.00, 300.00, 20.0, 'Location seche restaurant + materiel 27 Janvier 2026 (SIREN 911315687)', 'PR26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_002996_GOINFRES_FOWM_Cyrielle_DOMERG__4_.pdf'),
  ('%Emballage', 'FA043945', DATE '2026-01-19', DATE '2026-01-18', 51.78, 10.36, 20.0, 'Sacs extra large kraft (emballage) + livraison', 'PR26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/_FA043945.pdf'),
  ('Marie-Alix de Charry', '20260117', DATE '2026-01-21', DATE '2026-01-20', 1750.00, 0.00, 0.0, 'Retention Martin Pouret (janvier 2026)', 'PR26-003', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_Janvier_2026_FOWM.pdf'),
  ('%Touchard', '2026-007', DATE '2026-01-26', DATE '2026-01-25', 500.00, 100.00, 20.0, 'Enregistrement et production podcast Fleuron (1 session)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2026-007_Fowm_260126.pdf'),
  ('Camille Barba', '421', DATE '2026-01-28', DATE '2026-01-27', 1222.50, 122.25, 10.0, 'Dejeuner Fleuron 27 Janvier (solde apres acompte n420); restant du TTC 1344.75', 'PR26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_000421_Camille_BARBA_FOWM.pdf'),
  ('Marie-Alix de Charry', '20260219', DATE '2026-02-26', DATE '2026-02-25', 2000.00, 0.00, 0.0, 'Retention Martin Pouret + Introduction Maison Verteux (fevrier 2026)', 'PR26-003', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_Fe_vrier_2026_FOWM.pdf'),
  ('SAS INOUI (Symples)', 'F-260306-15748', DATE '2026-03-06', DATE '2026-03-05', 133.08, 9.49, 7.1, 'Commande boissons Symples (infusions petillantes bio) + port', 'GA26-002', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/F-260306-15748.pdf'),
  ('%Touchard', '2026-012', DATE '2026-03-06', DATE '2026-03-05', 1000.00, 200.00, 20.0, 'Enregistrement et production podcast Fleuron (2 sessions)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2026-012_Fowm_060326.pdf'),
  ('Chloé Marcel EI', '202603-100', DATE '2026-03-30', DATE '2026-03-29', 400.00, 0.00, 0.0, 'Package accompagnement editorial LinkedIn (mars 2026)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_Cyrielle_Domerg_FOWM_Mission_accompagnement_strate_gique_e_ditorial_LinkedIn_mars_2026_-_Chloe_Marcel_EI_-202603-100.pdf'),
  ('Marie-Alix de Charry', '20260321', DATE '2026-03-31', DATE '2026-03-30', 1750.00, 0.00, 0.0, 'Retention Martin Pouret (mars 2026)', 'PR26-003', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_Mars_2026_FOWM.pdf'),
  ('Hotel Hoy', '21540-26', DATE '2026-04-07', DATE '2026-04-06', 2696.97, 428.03, 15.9, 'Evenement mardi 2 juin (25 pax): dejeuner + privatisation Floreria/restaurant. Total TTC 3125 (acompte 50% 1562,50)', 'PR26-002', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_V3_Curielle_Fleuron_.pdf'),
  ('Marie-Alix de Charry', '20260323', DATE '2026-04-07', DATE '2026-04-06', 500.00, 0.00, 0.0, 'Facture complementaire - Retention Martin Pouret (mars 2026)', 'PR26-003', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_comple_mentaire_Mars_2026_FOWM.pdf'),
  ('Marie-Alix de Charry', '20260424', DATE '2026-04-29', DATE '2026-04-28', 1750.00, 0.00, 0.0, 'Retention Martin Pouret (avril 2026)', 'PR26-003', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_Avril_2026_FOWM.pdf'),
  ('%Touchard', '2026-019', DATE '2026-05-02', DATE '2026-05-01', 650.00, 130.00, 20.0, 'Podcast Fleuron (1 session) + production video verticale (Ep McDonalds)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2026-019_Fowm_020526.pdf'),
  ('Marie-Alix de Charry', '20260527', DATE '2026-05-28', DATE '2026-05-27', 1750.00, 0.00, 0.0, 'Retention Martin Pouret (mai 2026)', 'PR26-003', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_Mai_FOWM.pdf'),
  ('%Touchard', '2026-025', DATE '2026-05-29', DATE '2026-05-28', 550.00, 110.00, 20.0, 'Podcast Fleuron (Ep Compass) + productions video verticale (Rungis, face cam)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2026-025_Fowm_290526.pdf'),
  ('Marie-Alix de Charry', '20260629', DATE '2026-06-29', DATE '2026-06-28', 1750.00, 0.00, 0.0, 'Retention Martin Pouret (juin 2026)', 'PR26-003', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_juin_FOWM.pdf'),
  ('Helder Ferreira Film', '2026-023', DATE '2026-06-30', DATE '2026-06-29', 600.00, 0.00, 0.0, 'Forfait essentiel (prestation video) - exonere TVA art 293B', 'PR26-002', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_He_lderFerreira.film_-_FOWM_2.pdf'),
  ('%Touchard', '2026-031', DATE '2026-07-07', DATE '2026-07-06', 300.00, 60.00, 20.0, 'Production video verticale < 1'' (4x)', 'GA26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_2026-031_Fowm_070726.pdf');

CREATE TEMP TABLE _por ON COMMIT DROP AS
SELECT p.*,
  (SELECT s.id FROM public.suppliers s,_ctx c WHERE s.organization_id=c.org_id AND s.name ILIKE p.match||'%' LIMIT 1) AS supplier_id,
  (SELECT b.id FROM public.budgets b,_ctx c WHERE b.organization_id=c.org_id AND b.code=p.code LIMIT 1) AS budget_id,
  row_number() OVER (ORDER BY p.sent, p.pdf) AS seq
FROM _po p;

DO $$
DECLARE m text;
BEGIN
  SELECT string_agg(DISTINCT match,' | ') INTO m FROM _por WHERE supplier_id IS NULL;
  IF m IS NOT NULL THEN RAISE EXCEPTION 'Fournisseur non résolu: %', m; END IF;
  IF EXISTS (SELECT 1 FROM public.supplier_invoices WHERE invoice_number IN (SELECT invnum FROM _po)) THEN
    RAISE EXCEPTION 'Factures déjà présentes — script déjà exécuté ?'; END IF;
END $$;

CREATE TEMP TABLE _base ON COMMIT DROP AS
SELECT count(*)::int AS n FROM public.purchase_orders po,_ctx c WHERE po.user_id=c.user_id AND po.po_number NOT LIKE 'DR-%';

INSERT INTO public.purchase_orders
  (organization_id,user_id,supplier_id,supplier_name,budget_id,po_number,currency,total_amount,status,sent_at,notes,created_at,updated_at)
SELECT c.org_id,c.user_id,r.supplier_id,s.name,r.budget_id,
  'PO-'||lpad((b.n+r.seq)::text,4,'0'),'EUR',r.ht,'matched',
  (r.sent::timestamptz+interval '10 hours'), NULLIF(r.objet,''),
  (r.sent::timestamptz+interval '10 hours'),(r.sent::timestamptz+interval '10 hours')
FROM _por r JOIN public.suppliers s ON s.id=r.supplier_id CROSS JOIN _ctx c CROSS JOIN _base b;

INSERT INTO public.purchase_order_items (purchase_order_id,organization_id,description,quantity,unit_price)
SELECT po.id,po.organization_id,COALESCE(NULLIF(r.objet,''),'Prestation'),1,r.ht
FROM _por r CROSS JOIN _base b JOIN public.purchase_orders po ON po.po_number='PO-'||lpad((b.n+r.seq)::text,4,'0');

INSERT INTO public.supplier_invoices
  (organization_id,user_id,supplier_id,supplier_name,purchase_order_id,po_number,project_code,
   invoice_number,amount,vat_amount,vat_rate,currency,invoice_date,received_date,due_date,status,attachment_url,created_at,updated_at)
SELECT c.org_id,c.user_id,r.supplier_id,s.name,po.id,po.po_number,r.code,
  r.invnum,r.ht,NULLIF(r.vat,0),NULLIF(r.rate,0),'EUR',
  COALESCE(r.invdate,r.sent),COALESCE(r.invdate,r.sent),COALESCE(r.invdate,r.sent)+30,'paid',
  '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/'||r.pdf,(COALESCE(r.invdate,r.sent)::timestamptz+interval '11 hours'),(COALESCE(r.invdate,r.sent)::timestamptz+interval '11 hours')
FROM _por r CROSS JOIN _base b JOIN public.purchase_orders po ON po.po_number='PO-'||lpad((b.n+r.seq)::text,4,'0')
JOIN public.suppliers s ON s.id=r.supplier_id CROSS JOIN _ctx c;

CREATE TEMP TABLE _inv (match text, invnum text, invdate date, ht numeric, vat numeric, rate numeric, objet text, code text, pdf text) ON COMMIT DROP;
INSERT INTO _inv VALUES
  ('COPY-TOP%', '86597', NULL, 0.00, 0.00, 0.0, 'Impression / reprographie (OCR very garbled - amounts unreliable; line items approx 29.03/7.15)', 'PR26-001', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/IMG_9187.jpg'),
  ('m3 Hospitality Ferney', '46190', DATE '2024-11-03', 361.36, 34.94, 9.7, 'Sejour hotel (Cyrielle Domerg, 31/10-03/11/2024, chambre classique)', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Facture_46190.pdf'),
  ('FNAC%', 'Ticket', DATE '2024-11-14', 21.66, 4.33, 20.0, 'Cable Apple USB-C -> US (accessoire)', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/2024-11-14_-_FNAC_TERNES_-__25_99.pdf'),
  ('Sosh%', '9264654460', DATE '2025-04-24', 17.49, 6.00, 34.3, 'Forfait mobile Sosh 20,99 + tiers (ticket transport) - ligne 0750490177', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/facture_9011275593_2025-04-24.pdf'),
  ('Sosh%', '9300450903', DATE '2025-09-24', 17.49, 11.00, 62.9, 'Forfait mobile Sosh 20,99 150Go 5G + tiers (tickets transport)', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/facture_9011275593_2025-09-24.pdf'),
  ('SNCF', '3453759071', DATE '2025-10-17', 68.00, 0.00, 0.0, 'Billets train Paris Gare du Nord - Compiegne A/R', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/20251019_0958_JustificatifAchat_SNCFCONNECT.pdf'),
  ('Sosh%', '9307670498', DATE '2025-10-24', 17.49, 23.50, 134.4, 'Forfait mobile Sosh 20,99 150Go 5G + tiers (don SMS Institut Pasteur 20 EUR)', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/facture_9011275593_2025-10-24__1_.pdf'),
  ('espoir-tech', '240902210200', DATE '2025-10-29', 76.82, 15.36, 20.0, 'Ecouteurs sans fil sport SUUNTO Sonic', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/25102922300NK7J.pdf'),
  ('SNCF', 'e-billet', DATE '2025-11-08', 84.00, 0.00, 0.0, 'Billets TGV Paris Est-Reims A/R (48 EUR + 36 EUR)', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/PARIS_EST-REIMS_08-11-25_DOMERG_CYRIELLE_HMH9C8_2FNGiMr4hKSDeNyqFYob.pdf'),
  ('Sosh%', '9314889782', DATE '2025-11-25', 17.49, 6.00, 34.3, 'Forfait mobile Sosh 20,99 150Go 5G + tiers (ticket transport)', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/facture_9011275593_2025-11-25.pdf'),
  ('Google Cloud France', 'GCFRD0011101858', DATE '2025-11-30', 0.77, 0.15, 19.5, 'Google Cloud - frais novembre 2025 (SIREN 881721583)', 'GA26-002', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/GCFRD0011101858.pdf'),
  ('Sosh%', '9322130297', DATE '2025-12-24', 17.49, 3.50, 20.0, 'Forfait mobile Sosh 20,99 150Go 5G (decembre 2025)', '', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/facture_9011275593_2025-12-24.pdf'),
  ('Google Cloud France', 'GCFRD0011390185', DATE '2025-12-31', 48.07, 9.61, 20.0, 'Google Workspace Business Standard (domaine fowm.io) decembre 2025', 'GA26-002', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/GCFRD0011390185.pdf'),
  ('Lovable Labs', '6774745F-0017', DATE '2026-01-05', 25.00, 0.00, 0.0, 'Lovable Pro subscription (Jan 5 - Feb 5 2026), reverse charge', 'GA26-002', '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/Invoice-6774745F-0017.pdf');

CREATE TEMP TABLE _invr ON COMMIT DROP AS
SELECT p.*, (SELECT s.id FROM public.suppliers s,_ctx c WHERE s.organization_id=c.org_id AND s.name ILIKE p.match||'%' LIMIT 1) AS supplier_id
FROM _inv p;

DO $$ DECLARE m text; BEGIN
  SELECT string_agg(DISTINCT match,' | ') INTO m FROM _invr WHERE supplier_id IS NULL;
  IF m IS NOT NULL THEN RAISE EXCEPTION 'Fournisseur (facture seule) non résolu: %', m; END IF;
END $$;

INSERT INTO public.supplier_invoices
  (organization_id,user_id,supplier_id,supplier_name,purchase_order_id,po_number,project_code,
   invoice_number,amount,vat_amount,vat_rate,currency,invoice_date,received_date,due_date,status,attachment_url,created_at,updated_at)
SELECT c.org_id,c.user_id,r.supplier_id,s.name,NULL,NULL,NULLIF(r.code,''),
  r.invnum,r.ht,NULLIF(r.vat,0),NULLIF(r.rate,0),'EUR',
  r.invdate,r.invdate,r.invdate+30,'paid',
  '9d9f9f6c-ab05-4bc3-acdc-60d335523731/factures-fournisseurs/'||r.pdf,(r.invdate::timestamptz+interval '11 hours'),(r.invdate::timestamptz+interval '11 hours')
FROM _invr r JOIN public.suppliers s ON s.id=r.supplier_id CROSS JOIN _ctx c;

SELECT 'BdC v1 restants (attendu 0)' l, count(*)::text v FROM public.purchase_orders WHERE notes LIKE 'Backfill facture %'
UNION ALL SELECT 'BdC v3 (attendu 31)', count(*)::text FROM public.supplier_invoices WHERE purchase_order_id IS NOT NULL AND invoice_number IN (SELECT invnum FROM _po)
UNION ALL SELECT 'Factures seules (attendu 14)', count(*)::text FROM public.supplier_invoices WHERE purchase_order_id IS NULL AND invoice_number IN (SELECT invnum FROM _inv)
UNION ALL SELECT 'Total HT BdC v3', round(sum(total_amount),2)::text FROM public.purchase_orders po WHERE po.id IN (SELECT purchase_order_id FROM public.supplier_invoices WHERE invoice_number IN (SELECT invnum FROM _po))
UNION ALL SELECT 'Répartition budget', string_agg(code||':'||n,', ') FROM (SELECT b.code, count(*) n FROM public.purchase_orders po JOIN public.budgets b ON b.id=po.budget_id WHERE po.id IN (SELECT purchase_order_id FROM public.supplier_invoices WHERE invoice_number IN (SELECT invnum FROM _po)) GROUP BY b.code ORDER BY b.code) x;

COMMIT;
