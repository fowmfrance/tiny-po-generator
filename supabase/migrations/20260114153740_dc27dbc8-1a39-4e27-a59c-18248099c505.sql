-- Table pour stocker les budgets/projets
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  budget_type_id VARCHAR(50) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  initial_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  resale_price DECIMAL(15,2),
  recognition_method_id UUID REFERENCES public.recognition_methods(id),
  expense_types TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour stocker les milestones d'un budget/projet
CREATE TABLE public.budget_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed_date DATE,
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les confirmations de milestone par le project owner
CREATE TABLE public.milestone_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.budget_milestones(id) ON DELETE CASCADE,
  confirmed_by UUID NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_on_time BOOLEAN NOT NULL DEFAULT true,
  new_target_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_confirmations ENABLE ROW LEVEL SECURITY;

-- Policies pour budgets
CREATE POLICY "Users can view their own budgets" 
ON public.budgets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" 
ON public.budgets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
ON public.budgets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
ON public.budgets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies pour milestones (via budget ownership)
CREATE POLICY "Users can view milestones of their budgets" 
ON public.budget_milestones 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.budgets 
  WHERE budgets.id = budget_milestones.budget_id 
  AND budgets.user_id = auth.uid()
));

CREATE POLICY "Users can create milestones for their budgets" 
ON public.budget_milestones 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.budgets 
  WHERE budgets.id = budget_milestones.budget_id 
  AND budgets.user_id = auth.uid()
));

CREATE POLICY "Users can update milestones of their budgets" 
ON public.budget_milestones 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.budgets 
  WHERE budgets.id = budget_milestones.budget_id 
  AND budgets.user_id = auth.uid()
));

CREATE POLICY "Users can delete milestones of their budgets" 
ON public.budget_milestones 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.budgets 
  WHERE budgets.id = budget_milestones.budget_id 
  AND budgets.user_id = auth.uid()
));

-- Policies pour confirmations (via milestone/budget ownership)
CREATE POLICY "Users can view confirmations of their milestones" 
ON public.milestone_confirmations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.budget_milestones m
  JOIN public.budgets b ON b.id = m.budget_id
  WHERE m.id = milestone_confirmations.milestone_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can create confirmations for their milestones" 
ON public.milestone_confirmations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.budget_milestones m
  JOIN public.budgets b ON b.id = m.budget_id
  WHERE m.id = milestone_confirmations.milestone_id 
  AND b.user_id = auth.uid()
));

-- Index pour les performances
CREATE INDEX idx_budget_milestones_budget_id ON public.budget_milestones(budget_id);
CREATE INDEX idx_budget_milestones_target_date ON public.budget_milestones(target_date);
CREATE INDEX idx_milestone_confirmations_milestone_id ON public.milestone_confirmations(milestone_id);

-- Trigger pour updated_at sur budgets
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur milestones
CREATE TRIGGER update_budget_milestones_updated_at
BEFORE UPDATE ON public.budget_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();