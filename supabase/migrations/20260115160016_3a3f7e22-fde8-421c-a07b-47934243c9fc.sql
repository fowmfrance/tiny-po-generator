-- Mode de jalons sur le budget
ALTER TABLE public.budgets 
ADD COLUMN milestone_mode varchar(20) DEFAULT 'global' 
CHECK (milestone_mode IN ('global', 'per_supplier'));

-- Extension de la table budget_milestones pour le mode par prestataire
ALTER TABLE public.budget_milestones 
ADD COLUMN supplier_type_id uuid REFERENCES public.supplier_types(id) ON DELETE SET NULL;

ALTER TABLE public.budget_milestones 
ADD COLUMN supplier_type_id_original uuid REFERENCES public.supplier_types(id) ON DELETE SET NULL;

ALTER TABLE public.budget_milestones 
ADD COLUMN article_type_id uuid REFERENCES public.article_types(id) ON DELETE SET NULL;

ALTER TABLE public.budget_milestones 
ADD COLUMN assignment_status varchar(20) DEFAULT 'pending' 
CHECK (assignment_status IN ('pending', 'assigned', 'confirmed'));

-- Index pour les performances
CREATE INDEX idx_milestones_supplier_type ON public.budget_milestones(supplier_type_id);
CREATE INDEX idx_milestones_article_type ON public.budget_milestones(article_type_id);
CREATE INDEX idx_milestones_assignment ON public.budget_milestones(assignment_status);