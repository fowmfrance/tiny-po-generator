-- Types de prestation & familles de dépenses P&L
--
-- Modèle (exemple photographe) :
--   Nature de prestation  = article_types (existant)        ex. « photos »
--   Type de prestation    = service_types (NOUVEAU)         ex. « Services image » (futur compte 604xxx)
--   Famille de dépenses   = expense_families (NOUVEAU)      Projets / Frais de structure / Investissements (hors P&L)
--
-- Chaque type de prestation est rattaché par défaut à une famille (mapping géré
-- dans Réglages, catalogue admin cascadé à toutes les instances au démarrage).
-- Le fournisseur porte un type de prestation par défaut ; chaque BdC peut
-- surcharger la famille → le type est alors marqué « à valider manuellement »
-- (service_type_needs_review) et le fournisseur devient « mixte » (dérivé,
-- calculé côté front à partir des familles réellement utilisées sur ses BdC).
--
-- Les codes comptables (accounting_code, 604xxx) restent NULL : plan de comptes
-- analytique à venir (Clement), les colonnes sont prêtes.
--
-- ⚠ À exécuter à la main dans Lovable Cloud (les migrations ne sont pas
--   déployées automatiquement). Idempotent : ré-exécutable sans dégât.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Familles de dépenses (par organisation)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.expense_families (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_pnl boolean not null default true, -- false = investissements/immo, hors P&L
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_expense_families_org_name
  on public.expense_families (organization_id, lower(name));

alter table public.expense_families enable row level security;

drop policy if exists "expense_families_select_org" on public.expense_families;
create policy "expense_families_select_org" on public.expense_families for select to authenticated
  using (organization_id = public.current_user_organization_id() or public.has_role(auth.uid(), 'admin-sapajoo'));

drop policy if exists "expense_families_insert_org" on public.expense_families;
create policy "expense_families_insert_org" on public.expense_families for insert to authenticated
  with check (organization_id = public.current_user_organization_id() or public.has_role(auth.uid(), 'admin-sapajoo'));

drop policy if exists "expense_families_update_org" on public.expense_families;
create policy "expense_families_update_org" on public.expense_families for update to authenticated
  using (organization_id = public.current_user_organization_id() or public.has_role(auth.uid(), 'admin-sapajoo'));

drop policy if exists "expense_families_delete_org" on public.expense_families;
create policy "expense_families_delete_org" on public.expense_families for delete to authenticated
  using (organization_id = public.current_user_organization_id() or public.has_role(auth.uid(), 'admin-sapajoo'));

drop trigger if exists update_expense_families_updated_at on public.expense_families;
create trigger update_expense_families_updated_at
  before update on public.expense_families
  for each row execute function public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Catalogue admin des types de prestation (cascadé à toutes les instances)
--    default_family_name : rattachement par nom (les familles sont org-scoped)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.service_type_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  accounting_code text, -- futur 604xxx, plan analytique à venir
  default_family_name text not null default 'Projets',
  created_at timestamptz not null default now()
);

alter table public.service_type_templates enable row level security;

drop policy if exists "service_type_templates readable by authenticated" on public.service_type_templates;
create policy "service_type_templates readable by authenticated"
  on public.service_type_templates for select to authenticated using (true);

drop policy if exists "service_type_templates admin write" on public.service_type_templates;
create policy "service_type_templates admin write"
  on public.service_type_templates for all to authenticated
  using (public.has_role(auth.uid(), 'admin-sapajoo'))
  with check (public.has_role(auth.uid(), 'admin-sapajoo'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Types de prestation (par organisation)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.service_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  accounting_code text, -- futur 604xxx
  default_expense_family_id uuid references public.expense_families(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_service_types_org_name
  on public.service_types (organization_id, lower(name));

alter table public.service_types enable row level security;

drop policy if exists "service_types_select_org" on public.service_types;
create policy "service_types_select_org" on public.service_types for select to authenticated
  using (organization_id = public.current_user_organization_id() or public.has_role(auth.uid(), 'admin-sapajoo'));

drop policy if exists "service_types_insert_org" on public.service_types;
create policy "service_types_insert_org" on public.service_types for insert to authenticated
  with check (organization_id = public.current_user_organization_id() or public.has_role(auth.uid(), 'admin-sapajoo'));

drop policy if exists "service_types_update_org" on public.service_types;
create policy "service_types_update_org" on public.service_types for update to authenticated
  using (organization_id = public.current_user_organization_id() or public.has_role(auth.uid(), 'admin-sapajoo'));

drop policy if exists "service_types_delete_org" on public.service_types;
create policy "service_types_delete_org" on public.service_types for delete to authenticated
  using (organization_id = public.current_user_organization_id() or public.has_role(auth.uid(), 'admin-sapajoo'));

drop trigger if exists update_service_types_updated_at on public.service_types;
create trigger update_service_types_updated_at
  before update on public.service_types
  for each row execute function public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) Colonnes : défaut fournisseur + type/famille par BdC
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.suppliers
  add column if not exists default_service_type_id uuid references public.service_types(id) on delete set null;

alter table public.purchase_orders
  add column if not exists service_type_id uuid references public.service_types(id) on delete set null,
  add column if not exists expense_family_id uuid references public.expense_families(id) on delete set null,
  add column if not exists service_type_needs_review boolean not null default false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) Set de démarrage du catalogue (modifiable ensuite dans Réglages / backoffice)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.service_type_templates (name, description, default_family_name) values
  ('Services image',            'Photo, vidéo, post-production, studio',            'Projets'),
  ('Création & design',         'Direction artistique, graphisme, stylisme',        'Projets'),
  ('Talents & casting',         'Mannequins, artistes, agences',                    'Projets'),
  ('Logistique & transport',    'Transport, livraison, régie',                      'Projets'),
  ('Marketing & communication', 'Publicité, RP, contenus de marque',                'Frais de structure'),
  ('Honoraires & conseil',      'Juridique, comptabilité, consulting',              'Frais de structure'),
  ('IT & logiciels',            'Développement, SaaS, infrastructure',              'Frais de structure'),
  ('Services généraux',         'Locaux, fournitures, services du quotidien',       'Frais de structure'),
  ('Matériel & équipement',     'Achats immobilisables (matériel durable)',         'Investissements')
on conflict (name) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6) Fonctions de seed par organisation
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.initialize_default_expense_families(_user_id uuid, _organization_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if _organization_id is null then
    return;
  end if;
  insert into public.expense_families (user_id, organization_id, name, description, is_pnl, sort_order)
  select _user_id, _organization_id, v.name, v.description, v.is_pnl, v.sort_order
  from (values
    ('Projets',            'Dépenses directement rattachées aux projets / à la production', true,  1),
    ('Frais de structure', 'Frais généraux de fonctionnement',                              true,  2),
    ('Investissements',    'Immobilisations — hors P&L',                                    false, 3)
  ) as v(name, description, is_pnl, sort_order)
  where not exists (
    select 1 from public.expense_families x
    where x.organization_id = _organization_id and lower(x.name) = lower(v.name)
  );
end;
$$;

create or replace function public.initialize_default_service_types(_user_id uuid, _organization_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if _organization_id is null then
    return;
  end if;
  -- Les familles doivent exister pour résoudre le rattachement par défaut
  perform public.initialize_default_expense_families(_user_id, _organization_id);

  insert into public.service_types (user_id, organization_id, name, description, accounting_code, default_expense_family_id)
  select _user_id, _organization_id, t.name, t.description, t.accounting_code,
         (select f.id from public.expense_families f
          where f.organization_id = _organization_id and lower(f.name) = lower(t.default_family_name))
  from public.service_type_templates t
  where not exists (
    select 1 from public.service_types x
    where x.organization_id = _organization_id and lower(x.name) = lower(t.name)
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7) Backfill : toutes les orgs existantes (ayant au moins un utilisateur)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  _org record;
  _uid uuid;
begin
  for _org in select o.id from public.organizations o
              where exists (select 1 from public.profiles p where p.organization_id = o.id)
  loop
    select p.id into _uid from public.profiles p where p.organization_id = _org.id limit 1;
    perform public.initialize_default_service_types(_uid, _org.id);
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8) Nouvelles orgs : brancher le seed dans handle_new_user
--    (reprend le corps actuel — 20260706115302 — et ajoute l'appel)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _org uuid;
begin
  _org := nullif(new.raw_user_meta_data->>'organization_id', '')::uuid;

  insert into public.profiles (id, email, full_name, organization_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    _org
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  if _org is not null then
    perform public.initialize_default_supplier_types(new.id, _org);
    perform public.initialize_default_service_types(new.id, _org);
  end if;

  return new;
end;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9) Propagation admin (même logique que propagate_supplier_type_templates)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.propagate_service_type_templates()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _org record;
  _uid uuid;
  _before integer;
  _after integer;
begin
  if not public.has_role(auth.uid(), 'admin-sapajoo') then
    raise exception 'Réservé aux administrateurs.';
  end if;

  select count(*) into _before from public.service_types;

  for _org in select o.id from public.organizations o
              where exists (select 1 from public.profiles p where p.organization_id = o.id)
  loop
    select p.id into _uid from public.profiles p where p.organization_id = _org.id limit 1;
    perform public.initialize_default_service_types(_uid, _org.id);
  end loop;

  select count(*) into _after from public.service_types;
  return _after - _before;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10) Défauts automatiques sur les BdC : type hérité du fournisseur, famille
--     héritée du type ; famille surchargée ≠ défaut du type → à valider.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.po_apply_service_type_defaults()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.service_type_id is null and new.supplier_id is not null then
    select s.default_service_type_id into new.service_type_id
    from public.suppliers s where s.id = new.supplier_id;
  end if;

  if new.expense_family_id is null and new.service_type_id is not null then
    select st.default_expense_family_id into new.expense_family_id
    from public.service_types st where st.id = new.service_type_id;
  end if;

  -- Famille forcée hors du défaut du type → le type est à revalider manuellement
  if new.service_type_id is not null and new.expense_family_id is not null then
    new.service_type_needs_review := exists (
      select 1 from public.service_types st
      where st.id = new.service_type_id
        and st.default_expense_family_id is not null
        and st.default_expense_family_id <> new.expense_family_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists po_apply_service_type_defaults on public.purchase_orders;
create trigger po_apply_service_type_defaults
  before insert or update of supplier_id, service_type_id, expense_family_id
  on public.purchase_orders
  for each row execute function public.po_apply_service_type_defaults();
