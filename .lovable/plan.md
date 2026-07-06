## Contexte

Le back-office `/backoffice` existe déjà avec :
- Table `organizations` (multi-tenant) + page `BackofficeOrganizations`
- Table `profiles` liée à `organization_id` + page `BackofficeUsers`
- Table `user_roles` (admin-sapajoo / admin / manager / user)
- Edge function `invite-org-user` pour inviter un user rattaché à une organisation
- RLS multi-tenant scopée par `organization_id` (migration récente)

Il ne manque donc pas d'infrastructure : il manque **la création effective de l'instance FLEURON + l'invitation de cyrielle@fleuron.fr**, plus une petite vérification que le back-office affiche bien les deux tables demandées.

## Plan d'action (rapide)

### 1. Créer l'organisation FLEURON (data)
`INSERT` dans `public.organizations` :
- `name` = "FLEURON"
- `slug` = "fleuron"

### 2. Inviter cyrielle@fleuron.fr comme admin de FLEURON
Appel de l'edge function `invite-org-user` avec :
- `email` = "cyrielle@fleuron.fr"
- `organization_id` = id de FLEURON
- `role` = "admin"

Elle recevra un email d'invitation Supabase Auth ; à sa première connexion, son `profiles.organization_id` sera rattaché à FLEURON et elle verra uniquement les données de son instance (RLS multi-tenant déjà en place).

### 3. Vérifier le back-office (aucun code à écrire si OK)
Confirmer que :
- `/backoffice/organizations` liste bien FLEURON après création
- `/backoffice/users` liste cyrielle avec l'organisation FLEURON et le rôle admin

Si l'affichage d'une des deux tables est incomplet, patch ciblé (colonne manquante uniquement).

## Détails techniques

- L'org FLEURON est créée via `supabase--insert` (opération data, pas de schéma).
- L'invitation passe par `supabase.functions.invoke('invite-org-user', ...)` déclenché depuis la page `BackofficeOrganizations` (bouton "Inviter un utilisateur" déjà présent) — OU directement via l'edge function côté serveur pour aller plus vite.
- Aucune nouvelle table nécessaire : `organizations` = table des instances, `profiles` (jointe à `organizations` via `organization_id`) = table des users des instances. C'est exactement le modèle demandé.
- Aucun changement de schéma → pas de migration.

## Livrable

Après exécution :
- 1 organisation "FLEURON" visible dans `/backoffice/organizations`
- 1 email d'invitation envoyé à cyrielle@fleuron.fr
- cyrielle apparaît dans `/backoffice/users` avec `organization = FLEURON`, `role = admin`
