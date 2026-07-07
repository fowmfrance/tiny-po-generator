-- Rattachement transaction bancaire → fournisseur (increment 1)
-- Colonne nullable, additive : hérite des policies RLS existantes de transactions
-- (auth.uid() = user_id). Aucun index créé ici (à ajouter plus tard si besoin).

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS supplier_id uuid
  REFERENCES public.suppliers(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.transactions.supplier_id IS
  'Fournisseur rattaché à cette transaction bancaire (rapprochement manuel ou auto).';
