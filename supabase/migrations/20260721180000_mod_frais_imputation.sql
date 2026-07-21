-- =====================================================================
-- Module Notes de frais — imputation analytique (budget / client) + nature
-- des participants.
--
-- Chaînon manquant : un frais terrain finissait rattaché à un RDV et à des
-- invités, sans jamais atteindre le budget ni le P&L. Or un déjeuner de
-- prospection EST un coût d'obtention de contrat — il a vocation à alimenter
-- budgets.cac_capitalization (étalement IFRS 15 posé par le wizard de
-- reconnaissance).
--
-- is_internal sur te_contacts : un invité du même domaine que le tenant est un
-- collaborateur → repas d'équipe (625100 déplacements) et non réception
-- clients (625700), cf. docs/referentiel-tva-frais.md.
--
-- À jouer À LA MAIN dans Lovable. Purement additif.
-- =====================================================================

ALTER TABLE public.te_expenses
  ADD COLUMN IF NOT EXISTS budget_id uuid REFERENCES public.budgets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.te_expenses.budget_id IS
  'Imputation analytique : budget (= code projet) auquel le frais est rattaché. Alimente le P&L et, si le budget porte cac_capitalization, l''étalement des coûts d''obtention du contrat.';
COMMENT ON COLUMN public.te_expenses.client_id IS
  'Compte client concerné, déduit des participants ou choisi à la main. Sert au reporting conquête/entretien.';

CREATE INDEX IF NOT EXISTS idx_teexp_budget ON public.te_expenses(budget_id)
  WHERE budget_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teexp_client ON public.te_expenses(client_id)
  WHERE client_id IS NOT NULL;

-- Nature du participant : collaborateur (même domaine que le tenant) ou tiers.
ALTER TABLE public.te_contacts
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.te_contacts.is_internal IS
  'true = collaborateur (domaine email du tenant) → repas d''équipe ; false = tiers → réception clients. Pilote le compte PCG et la justification fiscale.';

-- Snapshot sur l'invité du frais (le statut d'une personne peut changer ;
-- celui du dîner de l'époque ne doit pas bouger).
ALTER TABLE public.te_expense_guests
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;
