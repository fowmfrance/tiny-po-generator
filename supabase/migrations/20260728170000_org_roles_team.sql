-- Équipe & rôles par instance client.
--
-- Modèle voulu par Clement (2026-07-28) : hors participation explicite à un
-- budget, seuls le créateur du budget et le key user/admin créent des budgets
-- et émettent des BdC. Chaque instance porte sa grille de rôles : droit de
-- créer des budgets + limite d'engagement PAR BdC. Onglet « Équipe » :
-- rôles / membres & invitations / KPIs (cumuls par personne, top fournisseur —
-- surveillance conflits d'intérêts).
--
-- Seed de non-régression : les profils EXISTANTS reçoivent le rôle key_user de
-- leur organisation (personne n'est bloqué au déploiement) ; le key user ajuste
-- ensuite depuis l'onglet Équipe. Les nouvelles organisations sont seedées par
-- trigger. L'enforcement est fait côté app (CreateBudget / CreatePO) ;
-- durcissement RLS budgets/purchase_orders = étape suivante, une fois les
-- rôles posés dans les instances.
--
-- ✅ EXÉCUTÉE en prod le 2026-07-28 via le connecteur Lovable (sans index).

-- ---------------------------------------------------------------------------
-- 1. Grille de rôles par organisation
-- ---------------------------------------------------------------------------
create table if not exists public.org_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  label text not null,
  is_key_user boolean not null default false,
  can_create_budgets boolean not null default false,
  max_po_amount numeric,               -- limite par BdC, null = illimité
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

comment on table public.org_roles is
  'Grille de rôles par instance : droit de créer des budgets + limite d''engagement par BdC. is_key_user = administrateur de l''instance.';

-- ---------------------------------------------------------------------------
-- 2. Invitations à rejoindre l'app
-- ---------------------------------------------------------------------------
create table if not exists public.org_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  org_role_id uuid references public.org_roles(id) on delete set null,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (organization_id, email)
);

-- ---------------------------------------------------------------------------
-- 3. Profils : rôle d'instance + dernière activité (heartbeat app)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists org_role_id uuid references public.org_roles(id) on delete set null,
  add column if not exists last_seen_at timestamptz;

-- ---------------------------------------------------------------------------
-- 4. Helper : l'utilisateur courant est-il key user de son instance ?
-- ---------------------------------------------------------------------------
create or replace function public.current_user_is_key_user()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select r.is_key_user
     from profiles p join org_roles r on r.id = p.org_role_id
     where p.id = auth.uid()),
    false
  ) or has_role(auth.uid(), 'admin-sapajoo');
$$;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
alter table public.org_roles enable row level security;
alter table public.org_invitations enable row level security;

create policy org_roles_select_org on public.org_roles
  for select using (
    organization_id = current_user_organization_id()
    or has_role(auth.uid(), 'admin-sapajoo')
  );

create policy org_roles_write_key_user on public.org_roles
  for all using (
    (organization_id = current_user_organization_id() and current_user_is_key_user())
    or has_role(auth.uid(), 'admin-sapajoo')
  )
  with check (
    (organization_id = current_user_organization_id() and current_user_is_key_user())
    or has_role(auth.uid(), 'admin-sapajoo')
  );

create policy org_invitations_select_org on public.org_invitations
  for select using (
    organization_id = current_user_organization_id()
    or has_role(auth.uid(), 'admin-sapajoo')
  );

create policy org_invitations_write_key_user on public.org_invitations
  for all using (
    (organization_id = current_user_organization_id() and current_user_is_key_user())
    or has_role(auth.uid(), 'admin-sapajoo')
  )
  with check (
    (organization_id = current_user_organization_id() and current_user_is_key_user())
    or has_role(auth.uid(), 'admin-sapajoo')
  );

-- Le key user peut affecter les rôles des membres de SON instance.
create policy profiles_update_key_user on public.profiles
  for update using (
    organization_id = current_user_organization_id() and current_user_is_key_user()
  );

-- ---------------------------------------------------------------------------
-- 6. Le rôle des participants budget devient libre (grille par instance)
-- ---------------------------------------------------------------------------
alter table public.budget_participants
  drop constraint if exists budget_participants_role_check;

-- ---------------------------------------------------------------------------
-- 7. Seed : grille par défaut pour toutes les organisations existantes
-- ---------------------------------------------------------------------------
insert into public.org_roles (organization_id, key, label, is_key_user, can_create_budgets, max_po_amount)
select o.id, r.key, r.label, r.is_key_user, r.can_create, r.max_po
from public.organizations o
cross join (values
  ('key_user',       'Key user',       true,  true,  null::numeric),
  ('directeur',      'Directeur',      false, true,  10000),
  ('responsable',    'Responsable',    false, false, 2000),
  ('chef_de_projet', 'Chef de projet', false, false, 500)
) as r(key, label, is_key_user, can_create, max_po)
on conflict (organization_id, key) do nothing;

-- Non-régression : les profils existants deviennent key user de leur instance.
update public.profiles p
set org_role_id = r.id
from public.org_roles r
where r.organization_id = p.organization_id
  and r.key = 'key_user'
  and p.org_role_id is null
  and p.organization_id is not null;

-- ---------------------------------------------------------------------------
-- 8. Les nouvelles organisations reçoivent la grille par défaut
-- ---------------------------------------------------------------------------
create or replace function public.tg_seed_org_roles()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into org_roles (organization_id, key, label, is_key_user, can_create_budgets, max_po_amount)
  values
    (new.id, 'key_user',       'Key user',       true,  true,  null),
    (new.id, 'directeur',      'Directeur',      false, true,  10000),
    (new.id, 'responsable',    'Responsable',    false, false, 2000),
    (new.id, 'chef_de_projet', 'Chef de projet', false, false, 500)
  on conflict (organization_id, key) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_seed_org_roles on public.organizations;
create trigger trg_seed_org_roles
  after insert on public.organizations
  for each row execute function public.tg_seed_org_roles();
