
-- Create function to initialize default supplier types
CREATE OR REPLACE FUNCTION public.initialize_default_supplier_types(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.supplier_types (user_id, name, description, color)
  VALUES
    (_user_id, 'Production vidéo', 'Réalisation, tournage, montage vidéo', '#EF4444'),
    (_user_id, 'Restauration', 'Traiteur, catering, craft services', '#F59E0B'),
    (_user_id, 'Voyage', 'Transport, hébergement, logistique déplacement', '#10B981'),
    (_user_id, 'Mannequinat', 'Modèles, casting, agences mannequins', '#EC4899'),
    (_user_id, 'Conseil', 'Consulting, stratégie, accompagnement', '#8B5CF6'),
    (_user_id, 'IT', 'Développement, infrastructure, services informatiques', '#3B82F6')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Update handle_new_user to also initialize default supplier types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Initialize defaults
  PERFORM public.initialize_default_supplier_types(NEW.id);
  
  RETURN NEW;
END;
$$;
