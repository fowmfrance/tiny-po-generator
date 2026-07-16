-- Wizard « Aidez-moi à choisir » (méthode de reconnaissance à la création de budget)
-- ⚠️ Lovable Cloud : migration à exécuter MANUELLEMENT dans le SQL editor.
-- Le frontend est tolérant : tant qu'elle n'est pas exécutée, le tracking et
-- l'option avancée CAC sont simplement ignorés (aucun blocage à la création).

-- 1) Tracking du wizard : voie utilisée (picklist vs wizard), parcours Q1/Q2,
--    abandons par écran, modification manuelle post-wizard.
CREATE TABLE public.recognition_wizard_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recognition_wizard_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can log wizard events"
ON public.recognition_wizard_events
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read wizard events"
ON public.recognition_wizard_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- 2) Option avancée R6 (Over time — Straight-line) : étaler les coûts
--    d'acquisition (commissions, publicité) sur la durée du contrat au lieu
--    de les compter immédiatement. false = reconnaissance immédiate (défaut).
ALTER TABLE public.budgets
ADD COLUMN cac_capitalization boolean NOT NULL DEFAULT false;
