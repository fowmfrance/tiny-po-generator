-- Gestion du catalogue admin de métiers depuis le backoffice.
-- 1) Écriture réservée à admin-sapajoo. 2) RPC de propagation vers toutes les orgs.
-- ⚠ À exécuter à la main dans Lovable Cloud. Idempotent.

-- Écriture (insert/update/delete) réservée aux admins ; la lecture reste ouverte
-- aux authentifiés (policy créée dans la migration catalogue).
drop policy if exists "supplier_type_templates admin write" on public.supplier_type_templates;
create policy "supplier_type_templates admin write"
  on public.supplier_type_templates
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin-sapajoo'))
  with check (public.has_role(auth.uid(), 'admin-sapajoo'));

-- Propage le catalogue admin dans toutes les orgs (métiers manquants seulement).
-- Renvoie le nombre de lignes insérées. Réservé admin-sapajoo.
create or replace function public.propagate_supplier_type_templates()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _count integer;
begin
  if not public.has_role(auth.uid(), 'admin-sapajoo') then
    raise exception 'Réservé aux administrateurs.';
  end if;

  with ins as (
    insert into public.supplier_types (user_id, organization_id, name, description, color, icon, is_active)
    select (select p.id from public.profiles p where p.organization_id = o.id limit 1),
           o.id, t.name, t.description, t.color, t.icon, true
    from public.supplier_type_templates t
    cross join public.organizations o
    where exists (select 1 from public.profiles p where p.organization_id = o.id)
      and not exists (
        select 1 from public.supplier_types x
        where x.organization_id = o.id and lower(x.name) = lower(t.name)
      )
    returning 1
  )
  select count(*) into _count from ins;
  return _count;
end;
$$;
