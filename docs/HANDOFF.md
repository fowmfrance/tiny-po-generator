# Passation — Sapajoo (état au 2026-07-09)

Document pour un agent reprenant le projet à contexte propre. À lire avec `docs/SPECIFICATION.md` (fonctionnel) et les `docs/spec-*.md`.

## 1. Projet & accès
- **App** : Sapajoo (sapajoo.fr) — procurement / budgets / contrôle de gestion pour TPE-PME.
- **Repo** : `fowmfrance/tiny-po-generator`, clone local `~/paperasse/fowm/tiny-po-generator`. Branche `main`. Vite/React/TS + shadcn + recharts + react-query.
- **Backend = Lovable Cloud** (Supabase managé, projet `krmtbyqqcwybdscvzcyx`, Postgres 17, Zurich). Accessible **uniquement via l'éditeur Lovable** (icône nuage → More → Database/Auth/Edge Functions/Secrets). **PAS** via supabase.com ni le MCP Supabase (qui ne voit que l'org FOWM/FLEURON).
- **git author email obligatoire** : `clement@fowm.io` (Vercel/Lovable rejette sinon). `git config user.email clement@fowm.io` après clone.

## 2. Contraintes critiques (⚠ lire avant de coder)
1. **Lovable ne déploie PAS depuis GitHub** : ni les migrations `supabase/migrations/*`, ni les **edge functions**. → toute migration DDL doit être **exécutée à la main par Clement** dans Lovable Cloud → SQL Editor ; les changements d'edge functions nécessitent un redéploiement côté Lovable. **Le frontend, lui, se déploie auto sur push `main`** (latence 5-20 min variable ; vérifier via le hash `assets/index-*.js` sur https://sapajoo.fr).
2. **Bug RLS récurrent** : les inserts qui omettent `organization_id` (NOT NULL + policy `organization_id = current_user_organization_id()`) → `new row violates row-level security policy`. **Fix systématique** : fournir `organization_id` (via `getCurrentOrganizationId()` de `@/utils/organization`, ou trigger `BEFORE INSERT` lisant `profiles.organization_id`). Déjà corrigé sur : `budget_milestones`, `supplier_access_tokens`, `bank_connections`, `transactions` (upsert).
3. **Je (agent) ne peux ni requêter ni migrer la base** — demander à Clement d'exécuter le SQL et de coller le résultat/erreur. Les toasts d'erreur ont été rendus explicites (affichent le message DB réel) pour diagnostiquer.
4. **Vérif visuelle en local** : la plupart des écrans exigent auth+données (indispo en local). Astuce utilisée : retirer temporairement `<ProtectedRoute>` d'une route dans `App.tsx`, `preview_start`/screenshot, puis **remettre** `<ProtectedRoute>`. Ne jamais committer le bypass.

## 3. Design system (transposé de Kiosco, accent terracotta conservé)
- Fonts : **Young Serif** (titres h1/h2/h3), **DM Sans** (corps), **JetBrains Mono** (chiffres, util `.num` + tabular-nums). Chargées dans `index.html`.
- Palette papier chaud dans `src/index.css` (CSS vars HSL) : bg paper `#FAF8F3`, cartes warm white, texte ink `#1A1914`/ash, filets hairline `#E6E1D6`, sidebar ink. **Accent `--brand` = terracotta `#D97757`** (à NE PAS remplacer par l'indigo Kiosco — décision produit).
- Charts : palette terroir (`#D97757` terracotta, `#B8853A` ocre, `#4A7C59` mousse, `#4A5568` ardoise, `#9B3B2A` brique), grille hairline, axes ash sans lignes, tooltips ink. Voir `SupplierDashboardTab.tsx` + `useSupplierDashboard.ts`.
- Icônes : Lucide partout (emojis supprimés de l'UI). Pastille terracotta `bg-brand-subtle`.

## 4. Livré cette session (21 commits, tous poussés)
- **Auth** : reset mdp (course de session, otp_expired, 422 mdp faible).
- **Banque Qonto** : connexion (fix RLS `bank_connections` : `login`/`secret_key` nullable + `organization_id` via trigger, appliqué), **pagination** de la synchro (levée limite 100), affichage **référence** Qonto, vue **multi-banques unifiée** + avatar banque, **entêtes de table figées**, remontée de la vraie erreur.
- **Rattachement transaction→fournisseur** : colonne `transactions.supplier_id` (**migration appliquée par Clement**), picklist Fournisseur avec « + Nouveau fournisseur » (modale), picklist Code projet avec « + Nouveau code projet » (`CreateBudget` en modale), **Inc A linkage** : picklist surbrillance + icône maillon → **fiche fournisseur 360 en modale** (`VendorDetail` rendu encapsulable via props `supplierId`/`embedded`).
- **FNP auto (le wedge produit)** : page `/cloture` (`CutOffClosing.tsx`) — increment 1 (calcul auto FNP par différentiel engagé×réalisé − facturé, par fournisseur, à une date de cut-off) + increment 2 (écriture 408 + TVA 44586 + charge, extourne J+1, export CSV). Spec : `docs/spec-fnp-auto-engagement.md`.
- **Budgets** : fix numérotation (max+1 réel, tient compte des suppressions), édition/suppression fonctionnelles (`BudgetList` : bouton Modifier était mort), rollback anti-doublon, fix RLS jalons.
- **Fournisseur** : sélecteur d'activité/métier (`supplier_type`) dans l'édition.
- **Landing + app** : emojis → Lucide.

## 5. Threads ouverts (next steps)
- ✅ **Colonne « Tiers » (fournisseur OU client)** (livré, commit `acba745`) : l'ex-colonne « Fournisseur » de l'écran banque gère les deux types. Débit → fournisseur, crédit → client ; type **pré-filtré par le signe mais modifiable** (toggle dans l'éditeur). Plus de picklist permanente : `src/components/banks/TiersCell.tsx` = valeur discrète éditable au **crayon** (popover + recherche cmdk) ; une fois liée, le nom est cliquable et ouvre la fiche (`VendorDetail` fournisseur / `ClientDetail` client, nouvelle fiche minimale nom+encaissements). Nouveaux : `src/hooks/useClients.ts`, `src/pages/ClientDetail.tsx`. Dédup fuzzy (Inc B) étendue aux clients + rattachement en masse par signe. ⚠ **Nécessite la migration `transactions.client_id` (voir §6) — sans elle TOUTE édition de tiers échoue.** Décisions produit : fiche client minimale (pas d'enrichissement table `clients`), type modifiable (pas verrouillé). Reste possible : enrichir `clients` (email/SIREN…) + `ClientDetail` complet si besoin.
- ✅ **Inc B — dédup fuzzy** (livré, commit `3348580`) : à la création d'un fournisseur depuis une transaction, rapprochement flou du nom saisi vs fournisseurs existants (`src/utils/fuzzyMatch.ts` — Levenshtein + recouvrement de tokens, normalisation formes juridiques/bruit bancaire, seuil 0.72) → dialog propose de **lier** au lieu de dupliquer, sinon « Créer quand même ». Après liaison, dialog de **rattachement en masse** des autres transactions non liées au même libellé (seuil 0.85). Logique testée (cas HELDER + non-régressions), tsc + build OK. _Reste possible : régler les seuils sur données réelles, ou persister les paires « ignoré » pour ne pas re-proposer._
- **FNP increment 3** : pondération fine du « réalisé » par jalons (au lieu du taux global), persistance `accrual_runs`, export format Pennylane/Cegid.
- **Numérotation budgets 100 % atomique** : trigger/séquence DB (actuellement calcul client à l'insert, race théorique en multi-user).
- **Éditer les jalons** d'un budget existant (`EditBudgetDialog` n'édite que nom/montant/dates).
- **Onglet Devis** (feature inexistante) + **RIB par devise** (vérifier si `supplier_bank_accounts` porte la devise) pour compléter la fiche fournisseur.
- **e-invoicing 2026 / PDP** : impératif réglementaire (raccordement à une PDP partenaire) — thèse stratégique (rachat Qonto/Pennylane, wedge = FNP auto que Pennylane fait en manuel).

## 6. Action manuelle DB en attente
- ⏳ **`transactions.client_id`** (migration `supabase/migrations/20260710150000_add_transactions_client_id.sql`) — **à exécuter à la main dans Lovable Cloud → SQL Editor** :
  ```sql
  ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS client_id uuid
    REFERENCES public.clients(id) ON DELETE SET NULL;
  ```
  Sans elle, la colonne « Tiers » (fournisseur inclus, car l'update écrit les deux champs) renvoie « column client_id does not exist ». `types.ts` déjà à jour.
- Migrations déjà **appliquées par Clement** : `transactions.supplier_id`, `bank_connections`. Pour toute future migration : la donner en SQL à exécuter dans Lovable Cloud.

## 7. ⚠ Piège collaboration Lovable
Lovable **auto-commite sur `main`** (« Changes ») pendant qu'on travaille en local → course/rebase possible. Vérifier `git fetch` avant push, préférer `--force-with-lease`. Ne jamais `git add -A` : la WIP Lovable non-commitée (ex. module « Frais & Attribution » : edge functions google/ocr/match-expense/sync-calendar, `config.toml`, migration `mod_frais_socle`) traîne dans le working tree et se ferait embarquer. Stager uniquement ses propres fichiers.
