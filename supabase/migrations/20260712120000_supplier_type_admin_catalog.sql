-- Catalogue « admin » de métiers fournisseurs, partagé par toutes les organisations.
-- Objectif : toute org possède le set admin, puis reste libre d'ajouter ses propres
-- métiers. Le catalogue (supplier_type_templates) est la source de vérité, amorcé
-- depuis l'org de référence Nina Noten (16 métiers), puis :
--   - backfill des orgs existantes,
--   - nouvelle fonction de seed pour les futures orgs.
-- ⚠ À exécuter à la main dans Lovable Cloud (les migrations ne sont pas déployées
--   automatiquement). Idempotent : ré-exécutable sans dégât.

-- 1) Table catalogue (indépendante des organisations)
create table if not exists public.supplier_type_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  color text not null default '#6B7280',
  icon text,
  created_at timestamptz not null default now()
);

alter table public.supplier_type_templates enable row level security;

drop policy if exists "supplier_type_templates readable by authenticated" on public.supplier_type_templates;
create policy "supplier_type_templates readable by authenticated"
  on public.supplier_type_templates
  for select
  to authenticated
  using (true);

-- 2) Amorçage du catalogue depuis l'org de référence (Nina Noten = set admin)
insert into public.supplier_type_templates (name, description, color, icon)
select st.name, st.description, coalesce(st.color, '#6B7280'), st.icon
from public.supplier_types st
where st.organization_id = (select id from public.organizations where name = 'Nina Noten')
  and st.is_active
on conflict (name) do nothing;

-- 3) Backfill : chaque org existante (ayant au moins un utilisateur) reçoit les
--    métiers admin qui lui manquent — ses métiers propres sont conservés.
insert into public.supplier_types (user_id, organization_id, name, description, color, icon, is_active)
select (select p.id from public.profiles p where p.organization_id = o.id limit 1),
       o.id, t.name, t.description, t.color, t.icon, true
from public.supplier_type_templates t
cross join public.organizations o
where exists (select 1 from public.profiles p where p.organization_id = o.id)
  and not exists (
    select 1 from public.supplier_types x
    where x.organization_id = o.id and lower(x.name) = lower(t.name)
  );

-- 4) Nouvelle fonction de seed : les futures orgs copient le catalogue admin
--    (au lieu des 6 défauts en dur). Signature inchangée → handle_new_user OK.
create or replace function public.initialize_default_supplier_types(_user_id uuid, _organization_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if _organization_id is null then
    return;
  end if;
  insert into public.supplier_types (user_id, organization_id, name, description, color, icon, is_active)
  select _user_id, _organization_id, t.name, t.description, t.color, t.icon, true
  from public.supplier_type_templates t
  where not exists (
    select 1 from public.supplier_types x
    where x.organization_id = _organization_id and lower(x.name) = lower(t.name)
  );
end;
$$;
