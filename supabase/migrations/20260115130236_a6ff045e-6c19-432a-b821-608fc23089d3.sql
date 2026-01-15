-- Add supplier_id to budget_milestones for linking milestones to suppliers
ALTER TABLE public.budget_milestones 
ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_budget_milestones_supplier_id ON public.budget_milestones(supplier_id);