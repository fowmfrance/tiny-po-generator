# Spec — Rattachement fournisseur ↔ transactions bancaires

## Objectif
Relier les transactions bancaires (déjà synchronisées depuis Qonto) à des
fournisseurs, dériver le mode de paiement réel, et offrir une vue « historique
de transactions par fournisseur » avec filtre de date.

Cas d'usage cible : « WeWork m'a coûté 1223 € en prélèvement, sauf le premier
en virement, depuis janvier 2024. »

## État existant (briques déjà là)
- Connexion bancaire Qonto (`Banks.tsx`, edge function `qonto-proxy`).
- Table `transactions` : `qonto_label`, `qonto_amount`, dates, **`qonto_operation_type`**,
  `qonto_card_last_digits`, `qonto_raw_data`, `sapajoo_category_id`, `project_code`.
  RLS = `auth.uid() = user_id`.
- Moteur de mapping libellé → catégorie (`bank_labels`, `bank_label_mappings`).
- Tables `suppliers` (org-scopé), `payment_methods`, `payment_modalities`.
- Invitation fournisseur (portail, `supplier_access_tokens`).
- Onglet « Historique » dans `VendorDetail.tsx` (aujourd'hui : BC + factures).

## Manque (le gap)
1. Aucun lien `transactions → suppliers`.
2. Pas d'agrégation du mode de paiement par fournisseur.
3. Pas de vue transactions bancaires par fournisseur.
4. Pas de création de fournisseur « bottom-up » depuis la banque.

---

## Modèle de données

### Increment 1
```sql
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS supplier_id uuid
  REFERENCES public.suppliers(id) ON DELETE SET NULL;
```
Nullable, additif — hérite des policies RLS existantes (user-scopé).

### Increment 2 — règles d'auto-rattachement
```sql
CREATE TABLE public.supplier_bank_label_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  match_type text NOT NULL CHECK (match_type IN ('label_exact','label_contains','counterparty_iban')),
  match_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- RLS : user_id = auth.uid() (comme transactions)
```

## Dérivation du mode de paiement (pur, pas de colonne)
`derivePaymentMethod(qonto_operation_type)` :
| operation_type Qonto | Mode Sapajoo |
|---|---|
| `card` | CB |
| `transfer` | Virement |
| `direct_debit` | Prélèvement |
| `income` | Encaissement |
| `cheque` | Chèque |
| autre / null | Autre |

Par fournisseur, on agrège l'ensemble des modes rencontrés = le « multi-select »,
mais **dérivé de la réalité bancaire** plutôt que saisi à la main.

## Logique de rattachement
1. **Manuel (increment 1)** : dans la table des transactions (page Banques), un
   sélecteur « Rattacher à un fournisseur » pose `transactions.supplier_id`.
2. **Auto (increment 2)** : à la sync, pour chaque transaction débit non rattachée,
   chercher une règle `supplier_bank_label_rules` qui matche (libellé exact/contient,
   ou IBAN contrepartie via `qonto_raw_data`). Si match → `supplier_id`. Le
   rattachement manuel crée la règle → les futures transactions du même libellé
   se rattachent automatiquement.
3. **Bottom-up / rattrapage (increment 2)** : bouton « Créer le fournisseur depuis
   ce libellé » → crée `suppliers` (nom = libellé nettoyé, org-scopé) + la règle.

## Vue « Historique » fournisseur (increment 1)
Dans l'onglet Historique de `VendorDetail`, section « Transactions bancaires » :
- Liste des transactions `supplier_id = X`, triées par date décroissante.
- Colonnes : date · libellé · montant · **badge mode de paiement**.
- Filtre de dates (réutilise le `PeriodFilter`).
- Récap par mode : « Prélèvement : 1223 € (11) · Virement : 89 € (1) ».

## Increments
- **1 (prototype)** : migration `supplier_id` + `derivePaymentMethod` + vue historique
  + rattachement manuel. Chemin lecture + boucle de rattachement complète.
- **2** : règles d'auto-rattachement + création bottom-up + intégration à la sync.
