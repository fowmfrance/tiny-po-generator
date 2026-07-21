-- =====================================================================
-- Module Notes de frais — vérification OCR post-upload + participants
-- Écran 1 : modale de vérification des données extraites (fournisseur,
--   SIRET, adresse, ventilation TVA par taux, totaux HT/TVA/TTC).
-- Écran 2 : « Qui participe » — invités du frais (lookup te_contacts,
--   entreprise remontée du contact, éditable par frais).
-- À jouer À LA MAIN dans Lovable. Purement additif.
-- =====================================================================

-- --- te_receipts : données OCR enrichies -----------------------------
ALTER TABLE public.te_receipts
  ADD COLUMN IF NOT EXISTS ocr_siret text,            -- SIRET (14) / SIREN (9) si imprimé
  ADD COLUMN IF NOT EXISTS ocr_address text,          -- adresse du commerçant
  ADD COLUMN IF NOT EXISTS ocr_total_ht numeric(12,2),
  ADD COLUMN IF NOT EXISTS ocr_vat_breakdown jsonb;   -- [{rate, ht, tva}]

COMMENT ON COLUMN public.te_receipts.ocr_vat_breakdown IS
  'Ventilation TVA lue sur le ticket : [{rate: 10, ht: 45.45, tva: 4.55}]. Un reçu resto porte souvent 10 % (nourriture) + 20 % (alcool).';

-- --- te_expenses : données vérifiées par l''utilisateur --------------
ALTER TABLE public.te_expenses
  ADD COLUMN IF NOT EXISTS amount_ht numeric(12,2),   -- total HT vérifié
  ADD COLUMN IF NOT EXISTS vat_breakdown jsonb,       -- [{rate, ht, tva}] vérifié
  ADD COLUMN IF NOT EXISTS supplier_siret text,
  ADD COLUMN IF NOT EXISTS supplier_address text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;   -- passage par la modale de vérification

COMMENT ON COLUMN public.te_expenses.vat_breakdown IS
  'Ventilation TVA par taux validée en modale de vérification : [{rate, ht, tva}]. amount = TTC, amount_ht = HT, vat_amount = TVA totale.';

-- =====================================================================
-- te_expense_guests — participants d''un frais (écran « Qui participe »)
--   Obligation fiscale repas d''affaires : noter les invités sur le
--   justificatif (BOI-TVA-DED-30-30-10). contact_id optionnel : un invité
--   peut être saisi librement sans exister dans te_contacts.
--   company_name figé SUR LE FRAIS (snapshot éditable) : l''entreprise du
--   contact peut changer plus tard, pas celle du dîner de l''époque.
-- =====================================================================
CREATE TABLE public.te_expense_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  expense_id uuid NOT NULL REFERENCES public.te_expenses(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.te_contacts(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  email text,
  company_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.te_expense_guests IS
  'Module Notes de frais — invités/participants d''un frais (repas d''affaires). Snapshot par frais, contact_id optionnel.';

CREATE INDEX idx_teguests_expense ON public.te_expense_guests(expense_id);
CREATE INDEX idx_teguests_user ON public.te_expense_guests(user_id);

-- Dénormalise user_id + organization_id depuis le frais parent (pattern
-- te_set_match_owner, dupliqué pour rester lisible table par table).
CREATE OR REPLACE FUNCTION public.te_set_guest_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.organization_id IS NULL THEN
    SELECT user_id, organization_id INTO NEW.user_id, NEW.organization_id
    FROM public.te_expenses WHERE id = NEW.expense_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_teguests_owner BEFORE INSERT ON public.te_expense_guests
  FOR EACH ROW EXECUTE FUNCTION public.te_set_guest_owner();

ALTER TABLE public.te_expense_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own guests - select" ON public.te_expense_guests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own guests - insert" ON public.te_expense_guests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own guests - update" ON public.te_expense_guests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own guests - delete" ON public.te_expense_guests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Vue org/DAF : lecture des invités (justification fiscale des repas)
CREATE POLICY "org guests - select" ON public.te_expense_guests
  FOR SELECT TO authenticated USING (
    organization_id = public.current_user_organization_id()
    OR public.has_role(auth.uid(), 'admin-sapajoo')
  );
