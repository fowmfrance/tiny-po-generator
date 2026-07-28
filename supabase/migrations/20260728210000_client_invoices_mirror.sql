-- POC facturation Qonto : miroir des factures clients (et avoirs) émises.
--
-- Source = API Qonto /v2/client_invoices et /v2/credit_notes, tirée via l'edge
-- function qonto-proxy existante (passthrough générique, identifiants de la
-- connexion bancaire déjà stockés — FOWM est branché). Les avoirs sont stockés
-- dans la MÊME table (is_credit_note=true, montants NÉGATIFS) : le CA facturé
-- d'un budget = somme simple des amount_ht rattachés.
--
-- Le rattachement au budget (budget_id) est manuel côté app — Qonto n'a pas la
-- notion de projet. La resynchro upsert les champs Qonto et PRÉSERVE budget_id.
-- Alimente le volet CA du bloc Reconnaissance (facturé + FAE / PCA par
-- différentiel, doctrine lissage).
--
-- ✅ EXÉCUTÉE en prod le 2026-07-28 via le connecteur Lovable (sans index).

create table if not exists public.client_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id),
  qonto_invoice_id text not null,
  number text,
  status text,
  invoice_type text,
  is_credit_note boolean not null default false,
  linked_qonto_invoice_id text,
  client_name text,
  issue_date date,
  due_date date,
  paid_at timestamptz,
  currency text default 'EUR',
  amount_ttc numeric,
  vat_amount numeric,
  amount_ht numeric,
  invoice_url text,
  budget_id uuid references public.budgets(id) on delete set null,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, qonto_invoice_id)
);

comment on table public.client_invoices is
  'Miroir des factures clients (et avoirs, montants négatifs) Qonto. budget_id = rattachement projet manuel, préservé à la resynchro.';

alter table public.client_invoices enable row level security;

create policy client_invoices_select_org on public.client_invoices
  for select using (
    organization_id = current_user_organization_id()
    or has_role(auth.uid(), 'admin-sapajoo')
  );

create policy client_invoices_insert_org on public.client_invoices
  for insert with check (
    organization_id = current_user_organization_id()
    or has_role(auth.uid(), 'admin-sapajoo')
  );

create policy client_invoices_update_org on public.client_invoices
  for update using (
    organization_id = current_user_organization_id()
    or has_role(auth.uid(), 'admin-sapajoo')
  );

create policy client_invoices_delete_org on public.client_invoices
  for delete using (
    organization_id = current_user_organization_id()
    or has_role(auth.uid(), 'admin-sapajoo')
  );
