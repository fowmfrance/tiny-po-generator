-- Participants de budget : le créateur d'un budget invite des collaborateurs de
-- son organisation à émettre des BdC sur son projet, avec un plafond
-- d'engagement PAR BdC selon le rôle.
--
-- Rôles et plafonds par défaut (phase 1, codés côté app) :
--   chef_de_projet : 500 € · responsable : 2 000 € · directeur : 10 000 €
-- Le plafond reste ajustable par participant (max_po_amount, null = illimité).
-- Phase 2 prévue : grille de rôles/plafonds paramétrable par instance (key user).
--
-- NB : la RLS purchase_orders est déjà org-scopée (tout membre de l'org peut
-- créer un BdC) ; le plafond est appliqué à la création côté app pour les
-- utilisateurs listés comme participants. Le créateur du budget n'est pas
-- plafonné. Durcissement RLS éventuel en phase 2.
--
-- ✅ EXÉCUTÉE en prod le 2026-07-28 via le connecteur Lovable (sans index,
--    volumes faibles — cf. règle « pas de CREATE INDEX via MCP »).

create table if not exists public.budget_participants (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  role text not null default 'chef_de_projet'
    check (role in ('chef_de_projet', 'responsable', 'directeur')),
  max_po_amount numeric,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (budget_id, user_id)
);

comment on table public.budget_participants is
  'Collaborateurs invités sur un budget par son créateur, avec plafond d''engagement par BdC (max_po_amount, null = illimité).';

alter table public.budget_participants enable row level security;

create policy bp_select_org on public.budget_participants
  for select using (
    organization_id = current_user_organization_id()
    or has_role(auth.uid(), 'admin-sapajoo')
  );

-- Seul le créateur du budget (ou un admin) gère la liste des participants.
create policy bp_insert_owner on public.budget_participants
  for insert with check (
    (organization_id = current_user_organization_id()
      and exists (select 1 from public.budgets b where b.id = budget_id and b.user_id = auth.uid()))
    or has_role(auth.uid(), 'admin-sapajoo')
  );

create policy bp_update_owner on public.budget_participants
  for update using (
    exists (select 1 from public.budgets b where b.id = budget_id and b.user_id = auth.uid())
    or has_role(auth.uid(), 'admin-sapajoo')
  );

create policy bp_delete_owner on public.budget_participants
  for delete using (
    exists (select 1 from public.budgets b where b.id = budget_id and b.user_id = auth.uid())
    or has_role(auth.uid(), 'admin-sapajoo')
  );
