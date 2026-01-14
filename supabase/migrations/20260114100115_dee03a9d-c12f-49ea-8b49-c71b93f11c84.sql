-- Table des méthodes de reconnaissance (Cut-off rules)
-- Base de données de référence pour tous les clients
CREATE TABLE public.recognition_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_revenue text NOT NULL,
  name_expense text NOT NULL,
  trigger_type text NOT NULL,
  description text NOT NULL,
  use_cases text,
  ifrs15_justification text,
  example text,
  relation_type text NOT NULL DEFAULT 'Obligatoire',
  formula_revenue text,
  formula_expense text,
  is_active boolean DEFAULT true,
  is_system boolean DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.recognition_methods ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique (table de référence)
CREATE POLICY "Anyone can view recognition methods"
ON public.recognition_methods
FOR SELECT
USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can manage recognition methods"
ON public.recognition_methods
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger de mise à jour du timestamp
CREATE TRIGGER update_recognition_methods_updated_at
BEFORE UPDATE ON public.recognition_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les données de base
INSERT INTO public.recognition_methods (code, name_revenue, name_expense, trigger_type, description, use_cases, ifrs15_justification, example, relation_type, display_order) VALUES
('point_in_time', 'Point-of-sale / Point-in-time', 'Direct matching', 'Transaction', 'Reconnaissance au moment du transfert de contrôle (livraison/réception)', 'Vente de marchandises, retail, e-commerce', 'Le CA déclenche la reconnaissance des charges directes correspondantes au même moment', 'Vente produit 1 000€ → CA 1 000€ + COGS 600€ reconnus simultanément à la livraison', 'Obligatoire', 1),
('poc_cost_to_cost', 'Percentage-of-completion (PoC) - Cost-to-cost', 'Cost-to-cost matching (PoC)', 'Coûts engagés', 'Avancement = Coûts encourus / Coûts totaux estimés', 'Projets construction, sous-traitance importante', 'Les charges sont l''input du calcul du CA, mathématiquement couplés', 'Projet 10M€, coûts encourus 2,4M€/8M€ = 30% → CA 3M€ + Charges 2,4M€', 'Obligatoire', 2),
('poc_efforts', 'Percentage-of-completion (PoC) - Efforts expended', 'Cost-to-cost matching (PoC) - basé efforts', 'Temps effectif passé', 'Avancement basé sur heures travaillées ou jalons physiques', 'Projets de conseil, IT, ingénierie', 'Les efforts (heures) mesurent simultanément l''avancement CA et les charges à reconnaître', 'Projet 500K€, 350h/1000h = 35% → CA 175K€ + Charges 350h reconnus', 'Obligatoire', 3),
('poc_milestone', 'Percentage-of-completion (PoC) - Milestone method', 'Cost-to-cost matching (PoC) - par paliers', 'Milestones', 'Reconnaissance à l''atteinte de jalons contractuels spécifiques', 'R&D, projets complexes à phases distinctes', 'Les charges s''accumulent en WIP puis sont reconnues par paliers avec le CA', 'Milestone 2 atteint (35%) → CA 3,5M€ + Charges cumulées WIP reconnues ensemble', 'Obligatoire', 4),
('over_time_linear', 'Over time - Straight-line', 'Systematic & rational allocation (coûts variables) + Immediate recognition (coûts fixes/structure)', 'Temps', 'Reconnaissance prorata temporis linéaire sur la durée du contrat', 'Abonnements, licences, maintenance, locations', 'Service continu uniforme où chaque JOUR calendaire a la même valeur économique', 'Location 12 000€/an → Janvier 31j = 1 019€, Février 28j = 920€ (prorata strict jours)', 'Mixte', 5),
('completed_contract', 'Completed contract', 'Neutralisation puis reconnaissance totale finale', 'Achèvement', 'Reconnaissance uniquement à l''achèvement total', 'Contrats courts, montants faibles, incertitudes majeures', 'Rien n''est reconnu (ni CA ni charges) jusqu''à la fin, puis tout ensemble', 'Projet 50K€, coûts 45K€ accumulés en WIP → Au mois 3 : CA 50K€ + Charges 45K€ d''un coup', 'Obligatoire', 6),
('collection', 'Collection', 'Cash basis (Accrual basis interdit)', 'Encaissement', 'Reconnaissance à l''encaissement effectif', 'Recouvrement très incertain, certaines activités réglementées', 'Cohérence : si CA à l''encaissement → charges à la sortie de trésorerie effective', 'CA reconnu uniquement à réception 10K€ → Charges reconnues au paiement effectif fournisseurs', 'Obligatoire', 7),
('proportional', 'Proportional performance', 'Matching principle / Direct matching - par acte', 'Prorata global', 'Reconnaissance proportionnelle aux actes réalisés', 'Adapté aux forfaits de services répétitifs, égaux', 'Reconnaissance basée sur unités livrées/consommées (mois d''abonnement, Go, consultations, etc.). Chaque unité = valeur égale', 'Abonnement 100€/mois → 3 mois = 300€ OU Forfait 1000 Go à 500€ → 300 Go = 150€ OU 10 consultations 5K€ → 4 faites = 2K€', 'Custom', 8);