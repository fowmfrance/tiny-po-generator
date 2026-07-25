-- Frais engagé à l'étranger : la TVA étrangère n'est pas déductible sur la
-- déclaration française (remboursement UE à part) — le flag isole ces frais
-- dans le reporting et l'export comptable.
ALTER TABLE public.te_expenses
  ADD COLUMN IF NOT EXISTS is_abroad boolean NOT NULL DEFAULT false;
