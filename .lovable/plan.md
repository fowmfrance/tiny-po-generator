

# Plan : Import des 80 projets Nina Noten

## Résumé

Importer les projets du CSV dans l'instance de clement@fowm.io. Cela nécessite des modifications de schéma (nouvelles colonnes sur `budgets`, nouvelle table `clients`) puis l'insertion des 80 lignes.

## Modifications de schéma (migration)

### 1. Nouvelle table `clients`
Stocke les clients des projets (company_name du CSV).

```sql
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- RLS: user_id = auth.uid() pour SELECT/INSERT/UPDATE/DELETE
```

### 2. Nouvelles colonnes sur `budgets`
- `client_id uuid` — référence vers `clients`
- `project_manager_id uuid` — futur lien vers un user/profile (nullable, tu les lieras après avoir créé les users)
- `completion_percentage numeric DEFAULT 0` — % de reconnaissance à date (progress du CSV)

### 3. Création des budget_types pour cet utilisateur
Insérer les deux types manquants :
- `project` (Projet) — format `PRJ-{YYYY}-{SEQ}`
- `ga` (Services généraux) — format `GA-{YYYY}-{SEQ}`

## Insertion des données

### 4. Script d'import
Un script exécuté via `psql` / insert tool qui :
1. Parse le CSV
2. Crée les entrées `clients` uniques (dédupliquées par `company_name`)
3. Insère les 80 budgets avec :
   - `budget_type_id` = `'project'` si type_label ≠ "Interne", `'ga'` sinon
   - `initial_amount` = `total_cost`
   - `resale_price` = `total_amount` (uniquement si pas Interne)
   - `recognition_method_id` = `8ee98649-b925-486d-8606-47257bf8b94e` (linéaire)
   - `completion_percentage` = `progress` du CSV
   - `created_at` = valeur du CSV
   - `start_date` / `end_date` depuis le CSV
   - `client_id` = lien vers la table clients
   - `project_manager_id` = NULL (à lier plus tard)
   - `code` = généré séquentiellement (PRJ-2026-002, PRJ-2026-003... ou GA-2026-001...)
   - `status` = `'active'` si actif=1, `'completed'` sinon
   - `currency` = `'EUR'`

## Détails techniques

- **User ID cible** : `1968507c-9dd7-4f0b-badf-3d44dfd97456`
- **Budget existant** : PRJ-2026-001 (BIDOUDOU) — les codes commenceront après
- **Recognition method** : `8ee98649-b925-486d-8606-47257bf8b94e`
- Les `project_manager` du CSV (prénoms) seront stockés temporairement quelque part ou ignorés pour l'instant — tu les lieras manuellement après création des users

