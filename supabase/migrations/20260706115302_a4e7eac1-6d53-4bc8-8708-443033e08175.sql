
CREATE OR REPLACE FUNCTION public.initialize_default_supplier_types(_user_id uuid, _organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _organization_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.supplier_types (user_id, organization_id, name, description, color)
  VALUES
    (_user_id, _organization_id, 'Production vidéo', 'Réalisation, tournage, montage vidéo', '#EF4444'),
    (_user_id, _organization_id, 'Restauration', 'Traiteur, catering, craft services', '#F59E0B'),
    (_user_id, _organization_id, 'Voyage', 'Transport, hébergement, logistique déplacement', '#10B981'),
    (_user_id, _organization_id, 'Mannequinat', 'Modèles, casting, agences mannequins', '#EC4899'),
    (_user_id, _organization_id, 'Conseil', 'Consulting, stratégie, accompagnement', '#8B5CF6'),
    (_user_id, _organization_id, 'IT', 'Développement, infrastructure, services informatiques', '#3B82F6')
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org uuid;
BEGIN
  _org := NULLIF(NEW.raw_user_meta_data->>'organization_id', '')::uuid;

  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _org
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  IF _org IS NOT NULL THEN
    PERFORM public.initialize_default_supplier_types(NEW.id, _org);
  END IF;

  RETURN NEW;
END;
$function$;
