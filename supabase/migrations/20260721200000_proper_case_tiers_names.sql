-- Normalisation « format propre » des noms de tiers, AU NIVEAU BASE.
--
-- Pourquoi : jusqu'ici toProperCase() ne tournait qu'à l'affichage, dans 3
-- composants sur ~20 (VendorCard, VendorsList, TiersCell) — d'où des noms en
-- MAJUSCULES un peu partout ailleurs (BdC, factures, jalons, budgets). Et rien
-- ne normalisait à l'écriture : les libellés Qonto / SIRENE / OCR entraient
-- bruts, y compris via les edge functions que le front ne voit jamais passer.
--
-- Le trigger devient donc la source de vérité unique : plus besoin de
-- saupoudrer toProperCase() sur chaque écran.
--
-- Garde-fou : on ne normalise QUE les noms sans aucune minuscule (« FRANCOIS
-- TOUCHARD EI »). Un nom saisi à la main avec une casse voulue (« eBay »,
-- « L'Oréal ») n'est jamais touché.
--
-- ✅ EXÉCUTÉE en prod le 2026-07-21 via le connecteur Lovable (25 noms
--    normalisés : 17 fournisseurs + 8 clients). Idempotent, rejouable.

-- ---------------------------------------------------------------------------
-- 1. La fonction (port SQL de src/utils/properCase.ts — garder les 2 en phase)
-- ---------------------------------------------------------------------------
create or replace function public.proper_case_name(_raw text)
returns text
language plpgsql
immutable
as $$
declare
  _src text;
  _out text := '';
  _tok text;
  -- Acronymes / formes juridiques conservés en majuscules (= KEEP_UPPER côté TS)
  _keep_upper text[] := array[
    'SARL', 'SARLU', 'SAS', 'SASU', 'EURL', 'SA', 'SCI', 'SCOP', 'SNC',
    'EI', 'EIRL', 'SC', 'SCM', 'GIE', 'RH', 'IT', 'BTP', 'CB',
    'PME', 'TPE', 'CE', 'CSE'
  ];
begin
  if _raw is null or btrim(_raw) = '' then
    return _raw;
  end if;

  _src := regexp_replace(btrim(_raw), '\s+', ' ', 'g');

  -- Nom d'un seul mot de 4 caractères ou moins, tout en majuscules : acronyme
  -- présumé (EDF, SNCF, MUA, MHCS). On n'y touche pas.
  if _src = upper(_src) and _src ~ '^[[:alnum:]]{1,4}$' then
    return _src;
  end if;

  -- On ne peut pas s'appuyer sur initcap() : depuis PG17 l'apostrophe n'est plus
  -- un séparateur de mot (« L'ATELIER » → « L'atelier »), ce qui diverge du TS.
  -- On refait donc le découpage à la main : chaque suite alphanumérique est
  -- capitalisée, les séparateurs sont recopiés tels quels.
  for _tok in
    select m[1] from regexp_matches(_src, '([[:alnum:]]+|[^[:alnum:]]+)', 'g') m
  loop
    if _tok ~ '^[[:alnum:]]' then
      if upper(_tok) = any (_keep_upper) then
        _out := _out || upper(_tok);
      else
        _out := _out || upper(left(_tok, 1)) || lower(substr(_tok, 2));
      end if;
    else
      _out := _out || _tok;
    end if;
  end loop;

  return _out;
end;
$$;

comment on function public.proper_case_name(text) is
  'Met un nom de tiers au format propre en préservant les acronymes/formes juridiques. Miroir SQL de src/utils/properCase.ts.';

-- ---------------------------------------------------------------------------
-- 2. Le trigger : normalise à l'écriture, sauf casse volontaire
-- ---------------------------------------------------------------------------
create or replace function public.tg_normalize_tiers_name()
returns trigger
language plpgsql
as $$
begin
  -- Échappatoire pour la restauration de backup (voir admin_restore_supplier_names).
  if coalesce(current_setting('app.skip_name_normalization', true), 'off') = 'on' then
    return new;
  end if;

  -- Uniquement les noms « criés » : aucune minuscule => saisie non maîtrisée
  -- (libellé bancaire, SIRENE, OCR). Sinon on respecte la casse de l'auteur.
  if new.name is not null and new.name = upper(new.name) then
    new.name := public.proper_case_name(new.name);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_normalize_supplier_name on public.suppliers;
create trigger trg_normalize_supplier_name
  before insert or update of name on public.suppliers
  for each row execute function public.tg_normalize_tiers_name();

drop trigger if exists trg_normalize_client_name on public.clients;
create trigger trg_normalize_client_name
  before insert or update of name on public.clients
  for each row execute function public.tg_normalize_tiers_name();

-- ---------------------------------------------------------------------------
-- 3. Le trigger ne doit pas neutraliser la restauration du backup
-- ---------------------------------------------------------------------------
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
  perform set_config('app.skip_name_normalization', 'on', true);  -- local à la transaction
  with upd as (
    update public.suppliers s
    set name = b.original_name, updated_at = now()
    from public.supplier_name_backup b
    where b.supplier_id = s.id and s.name <> b.original_name
    returning 1
  )
  select count(*) into _n from upd;
  perform set_config('app.skip_name_normalization', 'off', true);
  return _n;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Backfill de l'existant (backup préalable dans supplier_name_backup)
-- ---------------------------------------------------------------------------
insert into public.supplier_name_backup (supplier_id, original_name)
select s.id, s.name
from public.suppliers s
where s.name is not null
  and s.name = upper(s.name)
  and s.name <> public.proper_case_name(s.name)
on conflict (supplier_id) do nothing;  -- ne sauvegarde que le tout premier état

update public.suppliers
set name = public.proper_case_name(name), updated_at = now()
where name is not null
  and name = upper(name)
  and name <> public.proper_case_name(name);

update public.clients
set name = public.proper_case_name(name), updated_at = now()
where name is not null
  and name = upper(name)
  and name <> public.proper_case_name(name);

-- Contrôle post-migration (doit renvoyer 0) :
--   select count(*) from public.suppliers
--   where name = upper(name) and name <> public.proper_case_name(name);
