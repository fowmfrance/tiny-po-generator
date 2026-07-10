-- Rattachement transaction bancaire → client (colonne « Tiers »)
-- Un encaissement (qonto_side = 'credit') se rattache à un client plutôt qu'à
-- un fournisseur. Colonne nullable, additive : hérite des policies RLS
-- existantes de transactions (auth.uid() = user_id). Pas d'index ici.
-- L'exclusivité fournisseur/client est gérée côté application (l'un XOR l'autre).

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS client_id uuid
  REFERENCES public.clients(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.transactions.client_id IS
  'Client rattaché à cette transaction bancaire (encaissement). Exclusif avec supplier_id.';
