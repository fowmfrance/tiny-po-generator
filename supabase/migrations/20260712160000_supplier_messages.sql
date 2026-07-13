-- Messagerie simplifiée fournisseur ↔ équipe (un fil par fournisseur) + chatbot.
-- Le fournisseur écrit via l'edge function `supplier-messages` (service role, token) ;
-- l'équipe lit/répond via le client authentifié (RLS org-scopée).
-- ⚠ À exécuter à la main dans Lovable Cloud. Idempotent.

create table if not exists public.supplier_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  sender_type text not null check (sender_type in ('supplier', 'internal', 'bot')),
  sender_name text,                       -- nom affiché (membre équipe / fournisseur / « Assistant »)
  body text not null,
  created_at timestamptz not null default now(),
  read_by_supplier_at timestamptz,        -- messages équipe/bot lus par le fournisseur
  read_by_team_at timestamptz             -- messages fournisseur lus par l'équipe
);

alter table public.supplier_messages enable row level security;

-- Équipe (authentifiée) : lecture sur sa propre org (ou admin-sapajoo)
drop policy if exists "supplier_messages team read" on public.supplier_messages;
create policy "supplier_messages team read"
  on public.supplier_messages for select to authenticated
  using (organization_id = public.current_user_organization_id()
         or public.has_role(auth.uid(), 'admin-sapajoo'));

-- Équipe : écriture (réponses) sur sa propre org
drop policy if exists "supplier_messages team insert" on public.supplier_messages;
create policy "supplier_messages team insert"
  on public.supplier_messages for insert to authenticated
  with check (organization_id = public.current_user_organization_id());

-- Équipe : maj (accusés de lecture)
drop policy if exists "supplier_messages team update" on public.supplier_messages;
create policy "supplier_messages team update"
  on public.supplier_messages for update to authenticated
  using (organization_id = public.current_user_organization_id());
