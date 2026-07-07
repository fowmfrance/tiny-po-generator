# Spec — FNP automatique par différentiel d'engagement

## Thèse produit (le différenciateur)
Générer automatiquement les **FNP (charges à payer, compte 408)** à une date de
cut-off, **sans saisie du montant attendu**, en s'appuyant sur la donnée
d'**engagement** (BC) que Sapajoo détient et que les outils compta (Pennylane,
Regate) n'ont pas — chez eux la FNP est **manuelle par nécessité**.

## Principe de calcul
La brique existe déjà : `useBudgetsData.ts:144`
```
remainingAmount = max(0, sentAmount(BC engagés) − receivedAmount(factures reçues))
```
Mais `engagé − facturé` = « commandé non facturé », ce qui **surévalue** la FNP.
Une FNP correcte = **réalisé/livré non facturé**. D'où la formule cible, **datée**
et **par fournisseur** :

```
FNP(fournisseur, à la date T) =
  Σ sur les BC du fournisseur [ montant_engagé × taux_réalisé(T) ]  − facturé(≤ T)
```
- `taux_réalisé(T)` vient de la méthode de reconnaissance déjà modélisée
  (`recognition_methods`) :
  - **jalons** → % via `budget_milestones.completion_percentage` / `milestone_confirmations`
  - **linéaire (prorata temporis)** → jours écoulés / durée BC
  - **à la transaction** → 100 % dès réception, 0 % sinon
- `facturé(≤ T)` = Σ `supplier_invoices.amount` du fournisseur avec `received_date ≤ T`.

C'est la jointure **engagement × réalisé × facturé** — donnée qu'un outil
facture-centrique ne peut pas reconstituer.

## Modèle de données (additif)
```sql
-- 1. Compte de charge par catégorie (mapping vers la classe 6)
ALTER TABLE public.expense_categories
  ADD COLUMN IF NOT EXISTS account_code text; -- ex '607', '604', '622'

-- 2. Runs de clôture + écritures FNP générées (auditable, extournable, exportable)
CREATE TABLE public.accrual_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  cutoff_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- draft | posted | reversed
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.accrual_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES accrual_runs(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id),
  budget_id uuid REFERENCES budgets(id),
  expense_category_id uuid REFERENCES expense_categories(id),
  engaged_amount numeric,       -- engagé (BC)
  realized_rate numeric,        -- taux réalisé à la date
  realized_amount numeric,      -- engagé × taux
  invoiced_amount numeric,      -- facturé ≤ cutoff
  accrual_ht numeric,           -- FNP HT = max(0, réalisé − facturé)
  vat_amount numeric,           -- TVA sur FNP (compte 44586)
  accrual_ttc numeric,
  account_charge text,          -- classe 6 (depuis expense_categories)
  account_supplier text,        -- 408 + code auxiliaire (suppliers.code_auxiliaire)
  manual_override numeric       -- ajustement optionnel de l'utilisateur
);
-- RLS : user_id = auth.uid() (même pattern que transactions)
```

## Écriture comptable générée (par ligne, à la date de cut-off)
- **Débit** `account_charge` (classe 6) — montant HT
- **Débit** `44586` (TVA sur FNP) — TVA (optionnel v1)
- **Crédit** `408` + auxiliaire fournisseur (`suppliers.code_auxiliaire`) — TTC
- **Extourne** : écriture inverse datée au **lendemain du cut-off** (ouverture N+1),
  pour éviter le double-compte avec la facture réelle qui arrivera en 401.

## Export
- CSV/journal au format import compta (colonnes : date, journal, compte, auxiliaire,
  libellé, débit, crédit) + le miroir d'extourne.
- Cible : import Pennylane / Cegid / Sage, ou via API. C'est le **point d'intégration
  vers l'acquéreur**.

## Écran / flux
Nouvelle vue « Clôture » (remplace/complète `CutOffSimulator`) :
1. Choisir la **date de cut-off**.
2. Tableau **pré-rempli automatiquement** : par fournisseur → engagé, taux réalisé,
   réalisé, facturé, **FNP proposée**, catégorie/compte, TVA. (≠ Pennylane où on saisit.)
3. Ajustement manuel possible ligne à ligne (`manual_override`).
4. « Générer les écritures » → crée `accrual_run` + `accrual_lines` + le miroir d'extourne.
5. Export.

## Increments
- **1 — Preuve du calcul auto (lecture seule).** Formule datée par fournisseur/catégorie
  (engagé × réalisé − facturé) à une date choisie → tableau FNP pré-rempli. Pas d'écriture.
  Réutilise `useBudgetsData`, `budget_milestones`, `supplier_invoices`.
- **2 — Écriture + extourne + export.** Mapping catégorie→compte 6, fournisseur→408 aux,
  TVA 44586 ; persistance `accrual_runs/lines` ; génération journal + extourne ; export CSV.
- **3 — Fiabilisation & intégration.** Pondération réalisé par méthode de reconnaissance
  (jalons/linéaire), workflow de validation, export format Pennylane/Cegid, (option) API.

## Pourquoi c'est défendable
Structurel, pas cosmétique : la FNP auto exige la donnée d'**engagement (BC)** +
**réalisé (jalons)**. Pennylane/Regate partent des factures → ils ne l'ont pas →
FNP manuelle. Reproduire = construire toute la couche procurement en amont.
C'est le « feature que les autres n'ont pas », et le point d'entrée d'un rachat
complémentaire (combler leur FNP manuelle avec ta donnée).
