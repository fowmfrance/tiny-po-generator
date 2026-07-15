-- Normalisation « format propre » des noms de fournisseurs, appliquée depuis le
-- backoffice (la vraie logique toProperCase tourne côté front, ligne par ligne).
-- Backup préalable + restauration possible. Réservé admin-sapajoo.
-- ⚠ À exécuter à la main dans Lovable Cloud. Idempotent.

create table if not exists public.supplier_name_backup (
  supplier_id uuid primary key references public.suppliers(id) on delete cascade,
  original_name text not null,
  backed_up_at timestamptz not null default now()
);
alter table public.supplier_name_backup enable row level security;
-- Aucune policy : accès uniquement via les fonctions SECURITY DEFINER ci-dessous.

-- Liste de tous les fournisseurs (toutes orgs) pour l'admin.
create or replace function public.admin_list_suppliers()
returns table(id uuid, organization_id uuid, name text)
language sql
security definer
set search_path to 'public'
as $$
  select s.id, s.organization_id, s.name
  from public.suppliers s
  where public.has_role(auth.uid(), 'admin-sapajoo')
  order by s.name;
$$;

-- Renomme un fournisseur avec backup one-shot de son nom d'origine.
create or replace function public.admin_rename_supplier(_id uuid, _name text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.has_role(auth.uid(), 'admin-sapajoo') then
    raise exception 'Réservé aux administrateurs.';
  end if;
  insert into public.supplier_name_backup (supplier_id, original_name)
  select _id, s.name from public.suppliers s where s.id = _id
  on conflict (supplier_id) do nothing;               -- ne sauvegarde qu'une fois
  update public.suppliers set name = _name, updated_at = now() where id = _id;
end;
$$;

-- Restaure les noms d'origine depuis le backup. Renvoie le nombre restauré.
create or replace function public.admin_restore_supplier_names()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare _n integer;
begin
  if not public.has_role(auth.uid(), 'admin-sapajoo') then
    raise exception 'Réservé aux administrateurs.';
  end if;
  with upd as (
    update public.suppliers s
    set name = b.original_name, updated_at = now()
    from public.supplier_name_backup b
    where b.supplier_id = s.id and s.name <> b.original_name
    returning 1
  )
  select count(*) into _n from upd;
  return _n;
end;
$$;
