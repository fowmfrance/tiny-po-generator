-- =====================================================================
-- Module Notes de frais — code NAF du fournisseur (lookup SIRENE)
-- La sous-modale SIRENE (recherche-entreprises.api.gouv.fr) complète
-- SIRET/adresse/NAF quand l'OCR n'y arrive pas. Additive, rejouable.
-- À jouer À LA MAIN dans Lovable (avec 20260721120000 si pas encore fait).
-- =====================================================================
ALTER TABLE public.te_expenses
  ADD COLUMN IF NOT EXISTS supplier_naf text,        -- code NAF/APE (ex: 56.10A)
  ADD COLUMN IF NOT EXISTS supplier_naf_label text;  -- libellé du code

COMMENT ON COLUMN public.te_expenses.supplier_naf IS
  'Code NAF/APE du fournisseur, complété via le lookup SIRENE de la modale de vérification.';
