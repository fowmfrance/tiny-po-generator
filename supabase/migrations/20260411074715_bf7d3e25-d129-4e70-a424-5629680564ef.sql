ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_role_check
CHECK (
  role = ANY (
    ARRAY[
      'admin'::text,
      'manager'::text,
      'user'::text,
      'admin-sapajoo'::text
    ]
  )
);

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin-sapajoo'
FROM public.profiles p
WHERE p.email = 'clement@sapajoo.fr'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p.id
      AND ur.role = 'admin-sapajoo'
  );