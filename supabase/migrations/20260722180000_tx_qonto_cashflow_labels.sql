-- Classification Qonto lisible sur les opérations bancaires.
--
-- Qonto renvoie deux niveaux de catégorisation dans /v2/transactions :
--   - category : slug technique legacy (restaurant_and_bar, other_expense…)
--   - cashflow_category / cashflow_subcategory : la classification exacte
--     affichée dans l'app Qonto, déjà en français (« Frais de nourriture et
--     boissons », « Licences logicielles »…)
-- On stockait le slug et on jetait le reste — alors que le raw JSON complet
-- dort dans qonto_raw_data. On promeut les libellés en colonnes.
--
-- ✅ EXÉCUTÉE en prod le 2026-07-22 via le connecteur Lovable (backfill inclus :
--    569 transactions avec catégorie, 186 non catégorisées côté Qonto).

alter table public.transactions
  add column if not exists qonto_cashflow_category text,
  add column if not exists qonto_cashflow_subcategory text;

comment on column public.transactions.qonto_cashflow_category is
  'Catégorie de flux Qonto (libellé exact de l''app, ex. « Frais de nourriture et boissons »). Source : cashflow_category.name du payload /v2/transactions.';
comment on column public.transactions.qonto_cashflow_subcategory is
  'Sous-catégorie de flux Qonto (ex. « Licences logicielles »).';

-- Backfill depuis le raw JSON déjà synchronisé
update public.transactions
set qonto_cashflow_category = nullif(qonto_raw_data->'cashflow_category'->>'name', ''),
    qonto_cashflow_subcategory = nullif(qonto_raw_data->'cashflow_subcategory'->>'name', '')
where qonto_raw_data ? 'cashflow_category';
