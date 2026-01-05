-- Create budget_types table
CREATE TABLE public.budget_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  po_format TEXT NOT NULL DEFAULT 'PO-{YYYY}-{SEQ}',
  current_sequence INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS policies for budget_types
CREATE POLICY "Users can view their own budget types" 
ON public.budget_types 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget types" 
ON public.budget_types 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget types" 
ON public.budget_types 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget types" 
ON public.budget_types 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for teams
CREATE POLICY "Users can view their own teams" 
ON public.teams 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teams" 
ON public.teams 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teams" 
ON public.teams 
FOR DELETE 
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_budget_types_updated_at
BEFORE UPDATE ON public.budget_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize default budget types for new users
CREATE OR REPLACE FUNCTION public.initialize_default_budget_types(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.budget_types (user_id, name, description, po_format, is_default)
  VALUES
    (_user_id, 'G&A', 'Frais généraux et administratifs', 'GA-{YYYY}-{SEQ}', true),
    (_user_id, 'Projets', 'Budgets de projets spécifiques', 'PRJ-{YYYY}-{SEQ}', false)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Function to initialize default teams for new users
CREATE OR REPLACE FUNCTION public.initialize_default_teams(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.teams (user_id, name, description, color)
  VALUES
    (_user_id, 'Marketing', 'Équipe Marketing', '#EC4899'),
    (_user_id, 'Développement', 'Équipe Développement', '#3B82F6'),
    (_user_id, 'Finance', 'Équipe Finance', '#10B981'),
    (_user_id, 'Opérations', 'Équipe Opérations', '#F59E0B'),
    (_user_id, 'RH', 'Ressources Humaines', '#8B5CF6'),
    (_user_id, 'Services Généraux', 'Services Généraux', '#6B7280')
  ON CONFLICT DO NOTHING;
END;
$$;