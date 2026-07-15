-- ============================================================
-- BACKFILL FOWM — 21 fournisseurs + 74 bons de commande
-- Source : Google Sheet « Backfill_Sapajoo_FOWM » (2026-07-15)
-- Dry-run : remplacer le COMMIT final par ROLLBACK.
-- ============================================================
BEGIN;

-- 0) Contexte (org FOWM + user clement@fowm.io)
CREATE TEMP TABLE _ctx ON COMMIT DROP AS
SELECT p.id AS user_id, p.organization_id AS org_id
FROM public.profiles p
WHERE p.email = 'clement@fowm.io'
LIMIT 1;

DO $$
BEGIN
  IF (SELECT count(*) FROM _ctx WHERE org_id IS NOT NULL) <> 1 THEN
    RAISE EXCEPTION 'Contexte introuvable (profil clement@fowm.io avec organisation)';
  END IF;
END $$;

-- 1) Backups
CREATE TABLE IF NOT EXISTS public.bkp_suppliers_backfill_20260715 AS
  SELECT * FROM public.suppliers;
CREATE TABLE IF NOT EXISTS public.bkp_purchase_orders_backfill_20260715 AS
  SELECT * FROM public.purchase_orders;
CREATE TABLE IF NOT EXISTS public.bkp_po_items_backfill_20260715 AS
  SELECT * FROM public.purchase_order_items;

-- 2) Nouveaux fournisseurs (21) — idempotent (skip si nom déjà présent)
CREATE TEMP TABLE _new_suppliers (name text, email text, address text, siren text, vat_number text, country text) ON COMMIT DROP;
INSERT INTO _new_suppliers VALUES
  ('FNAC (FNAC Etoile/Ternes)', '', 'Paris, France', NULL, NULL, 'France'),
  ('Antichaos (Ynapmoc Terces Eht LLP / The Secret Company LLP)', 'paname@jointhequest.co', '27 Old Gloucester St, Holborn, London WC1N 3AX, United Kingdom', NULL, 'GB385428368', 'Royaume-Uni'),
  ('de Huizer BV', '', 'Paul Fredericqstraat 24, 9000 Ghent, Belgium', NULL, 'BE0552857834', 'Belgique'),
  ('Tarabiscode', 'elise@tarabiscode.com', '4 Rue Des Argentieres, 21000 Dijon, France', '93774954700017', 'FR42937749547', 'France'),
  ('espoir-tech', '', '9 rue des Colonnes, 75002 Paris, France', NULL, 'FR15981853013', 'France'),
  ('The Ludic Company', 'clement.robin@gmail.com', '9 RUE MILTON, 75009 PARIS, France', '95175583400029', NULL, 'France'),
  ('SAS INOUI (Symples)', 'compta@symples.fr', '2 avenue de la foret de Haye, Batiment Presidence, 54500 Vandoeuvre-les-Nancy, France', '84019264500017', 'FR64840192645', 'France'),
  ('Grandwork', '', '11 Rue Christiani, 75018 Paris, France', '94880395200019', 'FR24948803952', 'France'),
  ('Unknown merchant (FACTURE FC/1992 - chocolatier/epicerie fine)', '', NULL, NULL, NULL, NULL),
  ('DIX SEPT G', 'hello@gregcha.com', '56 RUE DU FAUBOURG SAINT DENIS, 75010 PARIS, France', NULL, 'FR67920860756', 'France'),
  ('m3 Hospitality Ferney SAS', 'reception@theresidencehotel.fr', '34 Rue de Geneve, 01210 Ferney-Voltaire, France', '83753798400010', 'FR72837537984', 'France'),
  ('B2G & Associes (SELARL B2G, Avocats)', 'b2g@degastines-avocats.fr', '5, rue du Renard, 75004 Paris, France', NULL, 'FR06415181726', 'France'),
  ('Celine LE BRAS', '', '39, rue du Calvaire, 92000 Nanterre, France', NULL, NULL, 'France'),
  ('Google Cloud France SARL', '', '8 Rue de Londres, 75009 Paris, France', NULL, 'FR78881721583', 'France'),
  ('Apple (Apple Retail France E.U.R.L / Apple Opera)', '', '12 rue Halevy, 75009 Paris, France', '48320938300049', 'FR21483209383', 'France'),
  ('Champagne Dremont-Marroy (SAS Les Perles de Saint Jean)', 'champagne.dremontmarroy@gmail.com', '11 Rue Paul Hivet, 02310 Charly-sur-Marne, France', '82171435900014', 'FR27821714359', 'France'),
  ('COPY-TOP (Julien Robert / Interking SA)', 'Voltaire@copytop.com', 'Paris (agence Voltaire), France', NULL, NULL, 'France'),
  ('Anthropic, PBC', 'support@anthropic.com', '548 Market Street, PMB 90375, San Francisco, California 94104, United States', NULL, NULL, 'États-Unis'),
  ('Lovable Labs Incorporated', 'support@lovable.dev', '1111b South Governors Avenue, Dover, Delaware 19904, United States', NULL, NULL, 'États-Unis'),
  ('Devoteam G Cloud Belux', 'fourcast.backoffice@devoteam.com', 'Culliganlaan 3, 1831 Diegem, Belgium', NULL, 'BE0563526547', 'Belgique'),
  ('Sosh / Orange SA', '', '111 quai du Pres. Roosevelt, 92130 Issy-les-Moulineaux, France', NULL, NULL, 'France');

INSERT INTO public.suppliers (organization_id, user_id, name, email, address, siren, vat_number, country, is_active)
SELECT c.org_id, c.user_id, ns.name, ns.email, NULLIF(ns.address,''), ns.siren, ns.vat_number, ns.country, true
FROM _new_suppliers ns CROSS JOIN _ctx c
WHERE NOT EXISTS (
  SELECT 1 FROM public.suppliers s
  WHERE s.organization_id = c.org_id AND lower(s.name) = lower(ns.name)
);

-- 3) Bons de commande (74)
CREATE TEMP TABLE _po (
  fichier text, supplier_match text, date_facture date, date_envoi date,
  currency text, amount numeric, objet text, notes text
) ON COMMIT DROP;
INSERT INTO _po VALUES
  ('Invoice-3FF76A63-0006_019b98d6-a180-757f-bd25-237e3b0d8f55', 'Anthropic, PBC', '2026-01-07', '2026-01-06', 'EUR', 18.00, 'Claude Pro subscription (Jan 7 - Feb 7 2026)', 'Backfill facture « Invoice-3FF76A63-0006_019b98d6-a180-757f-bd25-237e3b0d8f55 » — n° 3FF76A63-0006 du 2026-01-07 — TTC 18,00 EUR'),
  ('2025-5-12-1137_AC', 'Antichaos (Ynapmoc Terces Eht LLP / The Secret Company LLP)', '2025-05-12', '2025-05-11', 'EUR', 490.00, 'Audit des processus / creation cahier des charges agent IA', 'Backfill facture « 2025-5-12-1137_AC » — n° 2025-5-12-1137 du 2025-05-12 — TTC 490,00 EUR'),
  ('IMG_20251024_112711', 'Apple (Apple Retail France E.U.R.L / Apple Opera)', '2025-05-23', '2025-05-22', 'EUR', 1024.17, 'iPhone 16 Pro 128 Go Titane noir + eco-participation', 'Backfill facture « IMG_20251024_112711 » — n° 1C2025R277000003276 du 2025-05-23 — TTC 1 229,00 EUR'),
  ('Facture_FOWM_-_250303', 'B2G & Associes (SELARL B2G, Avocats)', '2025-03-06', '2025-03-05', 'EUR', 800.00, 'Honoraires avocat - elaboration contrat de prestation de services', 'Backfill facture « Facture_FOWM_-_250303 » — n° 250303 du 2025-03-06 — TTC 960,00 EUR'),
  ('Facture_Cyrielle_Domerg_FOWM_Mission_accompagnement_strate_gique_e_ditorial_LinkedIn_mars_2026_-_Chloe_Marcel_EI_-202603-100', 'Chloé Marcel EI', '2026-03-30', '2026-03-29', 'EUR', 400.00, 'Package accompagnement editorial LinkedIn (mars 2026)', 'Backfill facture « Facture_Cyrielle_Domerg_FOWM_Mission_accompagnement_strate_gique_e_ditorial_LinkedIn_mars_2026_-_Chloe_Marcel_EI_-202603-100 » — n° 202603-100 du 2026-03-30 — TTC 400,00 EUR'),
  ('_FA043945', 'Comptoir de l''Emballage', '2026-01-19', '2026-01-18', 'EUR', 51.78, 'Sacs extra large kraft (emballage) + livraison', 'Backfill facture « _FA043945 » — n° FA043945 du 2026-01-19 — TTC 62,14 EUR'),
  ('IMG_9187', 'COPY-TOP (Julien Robert / Interking SA)', NULL, NULL, 'EUR', 0, 'Impression / reprographie (OCR very garbled - amounts unreliable; line items approx 29.03/7.15)', 'Backfill facture « IMG_9187 » — n° 86597 du ? — TTC ? EUR — MONTANTS ILLISIBLES (OCR), à corriger'),
  ('Facture_000421_Camille_BARBA_FOWM', 'Camille Barba', '2026-01-28', '2026-01-27', 'EUR', 1222.50, 'Dejeuner Fleuron 27 Janvier (solde apres acompte n420); restant du TTC 1344.75', 'Backfill facture « Facture_000421_Camille_BARBA_FOWM » — n° 421 du 2026-01-28 — TTC 1 344,75 EUR'),
  ('Facture_Laga25-001_Cyrielle_Domerg', 'Celine LE BRAS', '2025-04-01', '2025-03-31', 'EUR', 300.00, 'Enregistrement et prod video (TVA non applicable art 293B)', 'Backfill facture « Facture_Laga25-001_Cyrielle_Domerg » — n° Laga25-001 du 2025-04-01 — TTC 300,00 EUR'),
  ('IMG_4331', 'Champagne Dremont-Marroy (SAS Les Perles de Saint Jean)', '2025-03-03', '2025-03-02', 'EUR', 412.50, 'Champagne Carte Noire x18 + Carte Rouge x12 (75cl AOC Champagne)', 'Backfill facture « IMG_4331 » — n° F251388 du 2025-03-03 — TTC 495,00 EUR'),
  ('Facture_000020_DIX_SEPT_G_FOWM_SAS_', 'DIX SEPT G', '2025-01-14', '2025-01-13', 'EUR', 600.00, 'Workshop produit (SIREN 920860756)', 'Backfill facture « Facture_000020_DIX_SEPT_G_FOWM_SAS_ » — n° 2025-01-000020 du 2025-01-14 — TTC 720,00 EUR'),
  ('efff_BE0563526547_251231_Inv_25703948', 'Devoteam G Cloud Belux', '2025-12-31', '2025-12-30', 'EUR', 406.19, 'Google Cloud Platform Usage November 2025 (reverse charge)', 'Backfill facture « efff_BE0563526547_251231_Inv_25703948 » — n° 25703948 du 2025-12-31 — TTC 406,19 EUR'),
  ('2024-11-14_-_FNAC_TERNES_-__25_99', 'FNAC (FNAC Etoile/Ternes)', '2024-11-14', '2024-11-13', 'EUR', 21.66, 'Cable Apple USB-C -> US (accessoire)', 'Backfill facture « 2024-11-14_-_FNAC_TERNES_-__25_99 » — n° Ticket 000031 (Magasin 00102) du 2024-11-14 — TTC 25,99 EUR'),
  ('Facture_2025-010_Fowm', 'François Touchard EI', '2024-12-02', '2024-12-01', 'EUR', 1000.00, 'Enregistrement et production podcast Fleuron (2 sessions nov 2024)', 'Backfill facture « Facture_2025-010_Fowm » — n° 2025-012 du 2024-12-02 — TTC 1 200,00 EUR'),
  ('Facture_2025-021_Fowm_140125__1_', 'François Touchard EI', '2025-01-14', '2025-01-13', 'EUR', 1000.00, 'Enregistrement et production podcast Fleuron (2 sessions)', 'Backfill facture « Facture_2025-021_Fowm_140125__1_ » — n° 2025-021 du 2025-01-14 — TTC 1 200,00 EUR'),
  ('Facture_2025-030_Fowm_080425__1_', 'François Touchard EI', '2025-04-08', '2025-04-07', 'EUR', 1000.00, 'Enregistrement et production podcast Fleuron (2 sessions)', 'Backfill facture « Facture_2025-030_Fowm_080425__1_ » — n° 2025-030 du 2025-04-08 — TTC 1 200,00 EUR'),
  ('Facture_2025-035_Fowm_120525', 'François Touchard EI', '2025-05-12', '2025-05-11', 'EUR', 1500.00, 'Enregistrement et production podcast Fleuron (3 sessions)', 'Backfill facture « Facture_2025-035_Fowm_120525 » — n° 2025-035 du 2025-05-12 — TTC 1 800,00 EUR'),
  ('Facture_2025-059_Fowm_011225', 'François Touchard EI', '2025-12-01', '2025-11-30', 'EUR', 500.00, 'Enregistrement et production podcast Fleuron (1 session)', 'Backfill facture « Facture_2025-059_Fowm_011225 » — n° 2025-059 du 2025-12-01 — TTC 600,00 EUR'),
  ('Facture_2026-002_Fowm_191225', 'François Touchard EI', '2025-12-19', '2025-12-18', 'EUR', 500.00, 'Enregistrement et production podcast Fleuron (1 session)', 'Backfill facture « Facture_2026-002_Fowm_191225 » — n° 2026-002 du 2025-12-19 — TTC 600,00 EUR'),
  ('Facture_2026-007_Fowm_260126', 'François Touchard EI', '2026-01-26', '2026-01-25', 'EUR', 500.00, 'Enregistrement et production podcast Fleuron (1 session)', 'Backfill facture « Facture_2026-007_Fowm_260126 » — n° 2026-007 du 2026-01-26 — TTC 600,00 EUR'),
  ('Facture_2026-012_Fowm_060326', 'François Touchard EI', '2026-03-06', '2026-03-05', 'EUR', 1000.00, 'Enregistrement et production podcast Fleuron (2 sessions)', 'Backfill facture « Facture_2026-012_Fowm_060326 » — n° 2026-012 du 2026-03-06 — TTC 1 200,00 EUR'),
  ('Facture_2026-019_Fowm_020526', 'François Touchard EI', '2026-05-02', '2026-05-01', 'EUR', 650.00, 'Podcast Fleuron (1 session) + production video verticale (Ep McDonalds)', 'Backfill facture « Facture_2026-019_Fowm_020526 » — n° 2026-019 du 2026-05-02 — TTC 780,00 EUR'),
  ('Facture_2026-025_Fowm_290526', 'François Touchard EI', '2026-05-29', '2026-05-28', 'EUR', 550.00, 'Podcast Fleuron (Ep Compass) + productions video verticale (Rungis, face cam)', 'Backfill facture « Facture_2026-025_Fowm_290526 » — n° 2026-025 du 2026-05-29 — TTC 660,00 EUR'),
  ('Facture_2026-031_Fowm_070726', 'François Touchard EI', '2026-07-07', '2026-07-06', 'EUR', 300.00, 'Production video verticale < 1'' (4x)', 'Backfill facture « Facture_2026-031_Fowm_070726 » — n° 2026-031 du 2026-07-07 — TTC 360,00 EUR'),
  ('Facture_002996_GOINFRES_FOWM_Cyrielle_DOMERG__4_', 'Goinfres', '2026-01-08', '2026-01-07', 'EUR', 1500.00, 'Location seche restaurant + materiel 27 Janvier 2026 (SIREN 911315687)', 'Backfill facture « Facture_002996_GOINFRES_FOWM_Cyrielle_DOMERG__4_ » — n° 2026-002996 du 2026-01-08 — TTC 1 800,00 EUR'),
  ('GCFRD0011101858', 'Google Cloud France SARL', '2025-11-30', '2025-11-29', 'EUR', 0.77, 'Google Cloud - frais novembre 2025 (SIREN 881721583)', 'Backfill facture « GCFRD0011101858 » — n° GCFRD0011101858 du 2025-11-30 — TTC 0,92 EUR'),
  ('GCFRD0011390185', 'Google Cloud France SARL', '2025-12-31', '2025-12-30', 'EUR', 48.07, 'Google Workspace Business Standard (domaine fowm.io) decembre 2025', 'Backfill facture « GCFRD0011390185 » — n° GCFRD0011390185 du 2025-12-31 — TTC 57,68 EUR'),
  ('Facture-202410-31', 'Grandwork', '2024-10-24', '2024-10-23', 'EUR', 400.00, 'Intervention 0,5 jour (avec remise)', 'Backfill facture « Facture-202410-31 » — n° 202410-31 du 2024-10-24 — TTC 520,00 EUR'),
  ('Facture_He_lderFerreira.film_-_FOWM_2', 'Helder Ferreira Film', '2026-06-30', '2026-06-29', 'EUR', 600.00, 'Forfait essentiel (prestation video) - exonere TVA art 293B', 'Backfill facture « Facture_He_lderFerreira.film_-_FOWM_2 » — n° 2026-023 du 2026-06-30 — TTC 600,00 EUR'),
  ('Facture_V3_Curielle_Fleuron_', 'Hotel Hoy', '2026-04-07', '2026-04-06', 'EUR', 2696.97, 'Evenement mardi 2 juin (25 pax): dejeuner + privatisation Floreria/restaurant. Total TTC 3125 (acompte 50% 1562,50)', 'Backfill facture « Facture_V3_Curielle_Fleuron_ » — n° 21540-26 du 2026-04-07 — TTC 3 125,00 EUR'),
  ('Facture-F2602-245', 'La Frenchie Communication', '2026-02-05', '2026-02-04', 'EUR', 85.00, 'Montage video court', 'Backfill facture « Facture-F2602-245 » — n° F2602-245 du 2026-02-05 — TTC 102,00 EUR'),
  ('Facture-F2603-264', 'La Frenchie Communication', '2026-03-10', '2026-03-09', 'EUR', 120.00, 'Coaching 1h feuille de route montages video', 'Backfill facture « Facture-F2603-264 » — n° F2603-264 du 2026-03-10 — TTC 144,00 EUR'),
  ('Invoice-6774745F-0017', 'Lovable Labs Incorporated', '2026-01-05', '2026-01-04', 'USD', 25.00, 'Lovable Pro subscription (Jan 5 - Feb 5 2026), reverse charge', 'Backfill facture « Invoice-6774745F-0017 » — n° 6774745F-0017 du 2026-01-05 — TTC 25,00 USD'),
  ('Facture_Fe_vrier_2025__1_', 'Marie-Alix de Charry', '2025-02-26', '2025-02-25', 'EUR', 3000.00, 'Retention/Prospection (French Biscuit, Nomie, Martin Pouret, Chateau de Cranne) fevrier 2025', 'Backfill facture « Facture_Fe_vrier_2025__1_ » — n° 20250201 du 2025-02-26 — TTC 3 000,00 EUR'),
  ('Facture_Mars_2025', 'Marie-Alix de Charry', '2025-03-28', '2025-03-27', 'EUR', 3000.00, 'Retention/Prospection Martin Pouret, Fleuron, Nomie, Chateau de Cranne (mars 2025)', 'Backfill facture « Facture_Mars_2025 » — n° 20250302 du 2025-03-28 — TTC 3 000,00 EUR'),
  ('Facture_Avril__2025', 'Marie-Alix de Charry', '2025-04-30', '2025-04-29', 'EUR', 3000.00, 'Retention Martin Pouret/Nomie/Chateau de Cranne + Prospection Fleuron (avril 2025)', 'Backfill facture « Facture_Avril__2025 » — n° 20250403 du 2025-04-30 — TTC 3 000,00 EUR'),
  ('Facture_Mai_2025_VF', 'Marie-Alix de Charry', '2025-05-28', '2025-05-27', 'EUR', 3000.00, 'Retention/Prospection Martin Pouret, Fleuron, Nomie, Chateau de Cranne (mai 2025)', 'Backfill facture « Facture_Mai_2025_VF » — n° 20250504 du 2025-05-28 — TTC 3 000,00 EUR'),
  ('Facture_Juin_2025_VF', 'Marie-Alix de Charry', '2025-06-27', '2025-06-26', 'EUR', 3000.00, 'Retention Martin Pouret/Nomie/Chateau de Cranne + Prospection Fleuron (juin 2025)', 'Backfill facture « Facture_Juin_2025_VF » — n° 20250605 du 2025-06-27 — TTC 3 000,00 EUR'),
  ('Facture_Juillet_2025_VF', 'Marie-Alix de Charry', '2025-07-23', '2025-07-22', 'EUR', 3000.00, 'Retention Martin Pouret/Nomie/Chateau de Cranne + Prospection Fleuron (juillet 2025)', 'Backfill facture « Facture_Juillet_2025_VF » — n° 20250706 du 2025-07-23 — TTC 3 000,00 EUR'),
  ('Facture_Aout_2025', 'Marie-Alix de Charry', '2025-09-01', '2025-08-31', 'EUR', 1250.00, 'Retention Martin Pouret + Prospection Fleuron (aout 2025) - TVA non applicable 293B', 'Backfill facture « Facture_Aout_2025 » — n° 20250807 du 2025-09-01 — TTC 1 250,00 EUR'),
  ('Facture_Septembre_2025_VF', 'Marie-Alix de Charry', '2025-10-01', '2025-09-30', 'EUR', 3250.00, 'Retention Martin Pouret/Nomie/Belsia + Prospection Fleuron (septembre 2025)', 'Backfill facture « Facture_Septembre_2025_VF » — n° 20250908 du 2025-10-01 — TTC 3 250,00 EUR'),
  ('Facture_Octobre_2025_FOWM', 'Marie-Alix de Charry', '2025-10-29', '2025-10-28', 'EUR', 3250.00, 'Retention Martin Pouret/Belsia/Chateau de Cranne + Prospection Fleuron (octobre 2025)', 'Backfill facture « Facture_Octobre_2025_FOWM » — n° 20251010 du 2025-10-29 — TTC 3 250,00 EUR'),
  ('Facture_Novembre_2025_FOWM', 'Marie-Alix de Charry', '2025-11-24', '2025-11-23', 'EUR', 3000.00, 'Retention Martin Pouret/Belsia + Prospection Fleuron (novembre 2025)', 'Backfill facture « Facture_Novembre_2025_FOWM » — n° 20251113 du 2025-11-24 — TTC 3 000,00 EUR'),
  ('Facture_D_cembre_2025_FOWM', 'Marie-Alix de Charry', '2025-12-18', '2025-12-17', 'EUR', 2500.00, 'Retention Martin Pouret + Belsia (decembre 2025)', 'Backfill facture « Facture_D_cembre_2025_FOWM » — n° 20251215 du 2025-12-18 — TTC 2 500,00 EUR'),
  ('Facture_Janvier_2026_FOWM', 'Marie-Alix de Charry', '2026-01-21', '2026-01-20', 'EUR', 1750.00, 'Retention Martin Pouret (janvier 2026)', 'Backfill facture « Facture_Janvier_2026_FOWM » — n° 20260117 du 2026-01-21 — TTC 1 750,00 EUR'),
  ('Facture_Fe_vrier_2026_FOWM', 'Marie-Alix de Charry', '2026-02-26', '2026-02-25', 'EUR', 2000.00, 'Retention Martin Pouret + Introduction Maison Verteux (fevrier 2026)', 'Backfill facture « Facture_Fe_vrier_2026_FOWM » — n° 20260219 du 2026-02-26 — TTC 2 000,00 EUR'),
  ('Facture_Mars_2026_FOWM', 'Marie-Alix de Charry', '2026-03-31', '2026-03-30', 'EUR', 1750.00, 'Retention Martin Pouret (mars 2026)', 'Backfill facture « Facture_Mars_2026_FOWM » — n° 20260321 du 2026-03-31 — TTC 1 750,00 EUR'),
  ('Facture_comple_mentaire_Mars_2026_FOWM', 'Marie-Alix de Charry', '2026-04-07', '2026-04-06', 'EUR', 500.00, 'Facture complementaire - Retention Martin Pouret (mars 2026)', 'Backfill facture « Facture_comple_mentaire_Mars_2026_FOWM » — n° 20260323 du 2026-04-07 — TTC 500,00 EUR'),
  ('Facture_Avril_2026_FOWM', 'Marie-Alix de Charry', '2026-04-29', '2026-04-28', 'EUR', 1750.00, 'Retention Martin Pouret (avril 2026)', 'Backfill facture « Facture_Avril_2026_FOWM » — n° 20260424 du 2026-04-29 — TTC 1 750,00 EUR'),
  ('Facture_Mai_FOWM', 'Marie-Alix de Charry', '2026-05-28', '2026-05-27', 'EUR', 1750.00, 'Retention Martin Pouret (mai 2026)', 'Backfill facture « Facture_Mai_FOWM » — n° 20260527 du 2026-05-28 — TTC 1 750,00 EUR'),
  ('Facture_juin_FOWM', 'Marie-Alix de Charry', '2026-06-29', '2026-06-28', 'EUR', 1750.00, 'Retention Martin Pouret (juin 2026)', 'Backfill facture « Facture_juin_FOWM » — n° 20260629 du 2026-06-29 — TTC 1 750,00 EUR'),
  ('2025F02-056_PAULINE_LAGARDE', 'Pauline Lagarde', '2025-02-24', '2025-02-23', 'EUR', 250.00, 'Conception de newsletters Fleuron (Fevrier-Mars)', 'Backfill facture « 2025F02-056_PAULINE_LAGARDE » — n° 2025F02-056 du 2025-02-24 — TTC 300,00 EUR'),
  ('2025F03-058_PAULINE_LAGARDE', 'Pauline Lagarde', '2025-03-07', '2025-03-06', 'EUR', 640.00, 'Newsletters Animation Mars FOWM', 'Backfill facture « 2025F03-058_PAULINE_LAGARDE » — n° 2025F03-058 du 2025-03-07 — TTC 768,00 EUR'),
  ('Facture-F202511-21', 'Pauline Lagarde', '2025-11-12', '2025-11-11', 'EUR', 1080.67, 'Accompagnement Marketing - video courte + support webinar + deplacement', 'Backfill facture « Facture-F202511-21 » — n° F202511-21 du 2025-11-12 — TTC 1 296,80 EUR'),
  ('Facture-F202512-64', 'Pauline Lagarde', '2025-12-17', '2025-12-16', 'EUR', 550.00, 'Forfait jour accompagnement marketing et communication', 'Backfill facture « Facture-F202512-64 » — n° F202512-64 du 2025-12-17 — TTC 660,00 EUR'),
  ('F-260306-15748', 'SAS INOUI (Symples)', '2026-03-06', '2026-03-05', 'EUR', 133.08, 'Commande boissons Symples (infusions petillantes bio) + port', 'Backfill facture « F-260306-15748 » — n° F-260306-15748 du 2026-03-06 — TTC 142,57 EUR'),
  ('20251019_0958_JustificatifAchat_SNCFCONNECT', 'SNCF', '2025-10-17', '2025-10-16', 'EUR', 68.00, 'Billets train Paris Gare du Nord - Compiegne A/R', 'Backfill facture « 20251019_0958_JustificatifAchat_SNCFCONNECT » — n° 3453759071-20260106 du 2025-10-17 — TTC 68,00 EUR — montant TTC (HT inconnu)'),
  ('PARIS_EST-REIMS_08-11-25_DOMERG_CYRIELLE_HMH9C8_2FNGiMr4hKSDeNyqFYob', 'SNCF', '2025-11-08', '2025-11-07', 'EUR', 84.00, 'Billets TGV Paris Est-Reims A/R (48 EUR + 36 EUR)', 'Backfill facture « PARIS_EST-REIMS_08-11-25_DOMERG_CYRIELLE_HMH9C8_2FNGiMr4hKSDeNyqFYob » — n° e-billet 302393712 / 235910112 (dossier HMH9C8) du 2025-11-08 — TTC 84,00 EUR — montant TTC (HT inconnu)'),
  ('facture_9011275593_2025-04-24', 'Sosh / Orange SA', '2025-04-24', '2025-04-23', 'EUR', 17.49, 'Forfait mobile Sosh 20,99 + tiers (ticket transport) - ligne 0750490177', 'Backfill facture « facture_9011275593_2025-04-24 » — n° 9264654460 du 2025-04-24 — TTC 23,49 EUR'),
  ('facture_9011275593_2025-09-24', 'Sosh / Orange SA', '2025-09-24', '2025-09-23', 'EUR', 17.49, 'Forfait mobile Sosh 20,99 150Go 5G + tiers (tickets transport)', 'Backfill facture « facture_9011275593_2025-09-24 » — n° 9300450903 du 2025-09-24 — TTC 28,49 EUR'),
  ('facture_9011275593_2025-10-24__1_', 'Sosh / Orange SA', '2025-10-24', '2025-10-23', 'EUR', 17.49, 'Forfait mobile Sosh 20,99 150Go 5G + tiers (don SMS Institut Pasteur 20 EUR)', 'Backfill facture « facture_9011275593_2025-10-24__1_ » — n° 9307670498 du 2025-10-24 — TTC 40,99 EUR'),
  ('facture_9011275593_2025-11-25', 'Sosh / Orange SA', '2025-11-25', '2025-11-24', 'EUR', 17.49, 'Forfait mobile Sosh 20,99 150Go 5G + tiers (ticket transport)', 'Backfill facture « facture_9011275593_2025-11-25 » — n° 9314889782 du 2025-11-25 — TTC 23,49 EUR'),
  ('facture_9011275593_2025-12-24', 'Sosh / Orange SA', '2025-12-24', '2025-12-23', 'EUR', 17.49, 'Forfait mobile Sosh 20,99 150Go 5G (decembre 2025)', 'Backfill facture « facture_9011275593_2025-12-24 » — n° 9322130297 du 2025-12-24 — TTC 20,99 EUR'),
  ('2505-F-2025-021-Tarabiscode', 'Tarabiscode', '2025-05-01', '2025-04-30', 'EUR', 800.00, 'Pack 10 heures accompagnement developpement Coda', 'Backfill facture « 2505-F-2025-021-Tarabiscode » — n° F-2025-021 du 2025-05-01 — TTC 960,00 EUR'),
  ('2512-FA-2025-001-The-Ludic-Company', 'The Ludic Company', '2025-12-30', '2025-12-29', 'EUR', 18520.00, 'Refacturation mission CFO (client Nina Noten)', 'Backfill facture « 2512-FA-2025-001-The-Ludic-Company » — n° FA-2025-001 du 2025-12-30 — TTC 18 520,00 EUR'),
  ('2512-FA-2025-002-The-Ludic-Company', 'The Ludic Company', '2025-12-30', '2025-12-29', 'EUR', 7500.00, 'Plateforme Coda retention + connecteurs (Odoo/Pennylane/Sellsy/Ankorstore) + add-on prospection 2025', 'Backfill facture « 2512-FA-2025-002-The-Ludic-Company » — n° FA-2025-002 du 2025-12-30 — TTC 7 500,00 EUR'),
  ('2512-FA-2025-003-The-Ludic-Company', 'The Ludic Company', '2025-12-30', '2025-12-29', 'EUR', 2750.00, 'Site FOWM + Site Fleuron - evolution/maintenance 2025', 'Backfill facture « 2512-FA-2025-003-The-Ludic-Company » — n° FA-2025-003 du 2025-12-30 — TTC 2 750,00 EUR'),
  ('2512-FA-2025-005-The-Ludic-Company', 'The Ludic Company', '2025-12-30', '2025-12-29', 'EUR', 5000.00, 'CFO part time (4 jours - cloture/revue/budget)', 'Backfill facture « 2512-FA-2025-005-The-Ludic-Company » — n° FA-2025-005 du 2025-12-30 — TTC 5 000,00 EUR'),
  ('Facture-FC_1992__1_', 'Unknown merchant (FACTURE FC/1992 - chocolatier/epicerie fine)', '2025-12-16', '2025-12-15', 'EUR', 67.58, 'Tablettes chocolat (Rosita, Eclair de Genie) + Champagne Ruinart - vendor name absent from OCR', 'Backfill facture « Facture-FC_1992__1_ » — n° FC/1992 du 2025-12-16 — TTC 79,50 EUR'),
  ('250203_facture_04_pour_FOWM_-_Paris_-_de_Huizer_BV', 'de Huizer BV', '2025-02-03', '2025-02-02', 'EUR', 1875.00, 'General Coda.io consulting (15 x)', 'Backfill facture « 250203_facture_04_pour_FOWM_-_Paris_-_de_Huizer_BV » — n° 4 du 2025-02-03 — TTC 1 875,00 EUR'),
  ('250304_facture_08_pour_FOWM_-_Paris_de_Huizer_BV__Gand_', 'de Huizer BV', '2025-03-04', '2025-03-03', 'EUR', 562.50, 'General Coda.io consulting (4.5 x)', 'Backfill facture « 250304_facture_08_pour_FOWM_-_Paris_de_Huizer_BV__Gand_ » — n° 8 du 2025-03-04 — TTC 562,50 EUR'),
  ('250505_facture_12_pour_FOWM_de_Huizer_BV', 'de Huizer BV', '2025-05-05', '2025-05-04', 'EUR', 343.75, 'General Coda.io consulting (2.75 x)', 'Backfill facture « 250505_facture_12_pour_FOWM_de_Huizer_BV » — n° 12 du 2025-05-05 — TTC 343,75 EUR'),
  ('25102922300NK7J', 'espoir-tech', '2025-10-29', '2025-10-28', 'EUR', 76.82, 'Ecouteurs sans fil sport SUUNTO Sonic', 'Backfill facture « 25102922300NK7J » — n° 240902210200 (order 25102922300NK7J) du 2025-10-29 — TTC 92,18 EUR'),
  ('Facture_46190', 'm3 Hospitality Ferney SAS', '2024-11-03', '2024-11-02', 'EUR', 361.36, 'Sejour hotel (Cyrielle Domerg, 31/10-03/11/2024, chambre classique)', 'Backfill facture « Facture_46190 » — n° 46190 du 2024-11-03 — TTC 396,30 EUR');

-- Résolution fournisseur (exact insensible à la casse, puis préfixe)
CREATE TEMP TABLE _po_resolved ON COMMIT DROP AS
SELECT p.*,
  COALESCE(
    (SELECT s.id FROM public.suppliers s, _ctx c
      WHERE s.organization_id = c.org_id AND lower(s.name) = lower(p.supplier_match) LIMIT 1),
    (SELECT s.id FROM public.suppliers s, _ctx c
      WHERE s.organization_id = c.org_id AND s.name ILIKE p.supplier_match || '%' LIMIT 1)
  ) AS supplier_id,
  row_number() OVER (ORDER BY p.date_envoi NULLS LAST, p.fichier) AS seq
FROM _po p;

DO $$
DECLARE missing int;
BEGIN
  SELECT count(*) INTO missing FROM _po_resolved WHERE supplier_id IS NULL;
  IF missing > 0 THEN
    RAISE EXCEPTION 'Fournisseur non résolu pour % BdC : %', missing,
      (SELECT string_agg(DISTINCT supplier_match, ' | ') FROM _po_resolved WHERE supplier_id IS NULL);
  END IF;
END $$;

-- Garde-fou anti double exécution
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.purchase_orders WHERE notes LIKE 'Backfill facture %') THEN
    RAISE EXCEPTION 'Des BdC de backfill existent déjà — script déjà exécuté ?';
  END IF;
END $$;

-- Numérotation : continue la séquence PO-XXXX de l'app (hors brouillons)
CREATE TEMP TABLE _base ON COMMIT DROP AS
SELECT count(*)::int AS n FROM public.purchase_orders po, _ctx c
WHERE po.user_id = c.user_id AND po.po_number NOT LIKE 'DR-%';

INSERT INTO public.purchase_orders
  (organization_id, user_id, supplier_id, supplier_name, po_number, currency,
   total_amount, status, sent_at, notes, created_at, updated_at)
SELECT
  c.org_id, c.user_id, r.supplier_id, s.name,
  'PO-' || lpad((b.n + r.seq)::text, 4, '0'),
  r.currency, r.amount, 'sent',
  (COALESCE(r.date_envoi, r.date_facture)::timestamptz + interval '10 hours'),
  r.notes,
  (COALESCE(r.date_envoi, r.date_facture, now()::date)::timestamptz + interval '10 hours'),
  (COALESCE(r.date_envoi, r.date_facture, now()::date)::timestamptz + interval '10 hours')
FROM _po_resolved r
JOIN public.suppliers s ON s.id = r.supplier_id
CROSS JOIN _ctx c CROSS JOIN _base b;

-- 4) Lignes de BdC (1 ligne par BdC)
INSERT INTO public.purchase_order_items
  (purchase_order_id, organization_id, description, quantity, unit_price)
SELECT po.id, po.organization_id, r.objet, 1, r.amount
FROM _po_resolved r
JOIN public.purchase_orders po
  ON po.notes = r.notes AND po.notes LIKE 'Backfill facture %';

-- 5) Vérifications
SELECT 'fournisseurs backfill présents' AS check_label, count(*)::text AS valeur
  FROM public.suppliers s, _ctx c
  WHERE s.organization_id = c.org_id AND s.name IN (SELECT name FROM _new_suppliers)
UNION ALL
SELECT 'BdC backfill', count(*)::text FROM public.purchase_orders WHERE notes LIKE 'Backfill facture %'
UNION ALL
SELECT 'lignes BdC backfill', count(*)::text FROM public.purchase_order_items i
  JOIN public.purchase_orders po ON po.id = i.purchase_order_id
  WHERE po.notes LIKE 'Backfill facture %'
UNION ALL
SELECT 'total engagé backfill', round(sum(total_amount),2)::text
  FROM public.purchase_orders WHERE notes LIKE 'Backfill facture %';

COMMIT;
