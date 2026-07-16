# Runbook — déployer le module Notes de frais (Sprint 1)

> Rien n'est auto-déployé sur cette base Lovable : SQL et edge functions
> se poussent À LA MAIN, dans l'ordre ci-dessous.
> Réf fonctionnelle : [spec-module-frais-attribution.md](spec-module-frais-attribution.md).

## Glossaire anti-confusion (à garder en tête pendant tout le déploiement)

| Notes de frais (module `te_*`) | Le reste de Sapajoo |
|---|---|
| `te_expenses` — frais terrain (resto, taxi, hôtel) | `transactions` (Qonto), `supplier_invoices` (factures), budgets/BdC |
| `te_receipts` + bucket `te-receipts` — tickets de caisse | `invoice-attachments` — pièces de factures fournisseurs |
| `te_category` — type de frais (matching) | `expense_categories` — catégories budgétaires (compta) |
| UI « Notes de frais » (`/frais`) | UI Paiements / Bons de commande / Budgets |

Un frais **référence** éventuellement une transaction Qonto
(`te_expenses.transaction_id`) — il ne la duplique jamais, donc **aucun risque de
double comptage** dans les dashboards budget.

## Étape 1 — SQL socle (Lovable → SQL editor)

Coller et exécuter `supabase/migrations/20260710120000_mod_frais_socle.sql`.

Crée : `integration_connections`, `te_calendar_events`, `te_receipts`,
`te_expenses`, `te_expense_matches`, bucket `te-receipts`, triggers org + RLS.

⚠️ Pas de `CREATE INDEX` lourd à chaud : tables neuves, index simples — OK.

## Étape 2 — Secrets edge functions (Supabase → Edge Functions → Secrets)

Déjà en place : `SUPABASE_*`, `LOVABLE_API_KEY`, `BANK_CREDENTIALS_ENCRYPTION_KEY`.

À ajouter :

| Secret | Valeur |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | client OAuth du projet Google Cloud « sapajoo » (déjà créé) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | idem (visible une seule fois à la création) |
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://krmtbyqqcwybdscvzcyx.supabase.co/functions/v1/google-oauth-callback` |
| `GOOGLE_CALENDAR_WEBHOOK_URL` | `https://krmtbyqqcwybdscvzcyx.supabase.co/functions/v1/google-calendar-webhook` |
| `APP_URL` | URL front (prod Lovable), sans slash final |
| `CRON_SECRET` | valeur aléatoire forte (`openssl rand -hex 32`) |

Vérifier côté Google Cloud que le redirect URI ci-dessus est bien déclaré sur le
client OAuth, et que le compte de test est dans les test users (app en mode
« testing », 100 users max — suffisant pour le pilote).

## Étape 3 — Déployer les edge functions

```bash
npx supabase functions deploy google-oauth-start google-oauth-callback \
  sync-calendar google-calendar-webhook match-expense ocr-receipt \
  calendar-watch-renew --project-ref krmtbyqqcwybdscvzcyx
```

(`config.toml` porte déjà les bons `verify_jwt` par fonction.)

## Étape 4 — Vault + cron (Lovable → SQL editor)

1. Créer le secret Vault avec **la même valeur** que `CRON_SECRET` :
   ```sql
   SELECT vault.create_secret('<valeur de CRON_SECRET>', 'te_frais_cron_secret');
   ```
2. Coller et exécuter `supabase/migrations/20260716160000_mod_frais_cron.sql`
   (jobs `te-frais-purge-calendar` 03:10 UTC et `te-frais-watch-renew` 05:40 UTC).

## Étape 5 — Tests (dans l'ordre)

1. **RLS org** (le bug récurrent) : insérer un `te_expense` de test depuis le front,
   vérifier `organization_id` non nul, puis qu'un autre user de l'org NE le voit PAS
   (policy user) mais que le rôle DAF le voit (policy org).
2. **OAuth** : `/frais` → « Connecter mon agenda » → retour `?connexion=ok`,
   ligne `integration_connections` active, `watch_expires_at` renseigné.
3. **Sync** : bouton Synchroniser → `te_calendar_events` peuplée (fenêtre −90 j/+7 j,
   événements sans invités ET sans lieu exclus).
4. **OCR** : photo d'un reçu → `te_receipts.ocr_status='done'`, `te_expenses` créé,
   suggestion de RDV si l'agenda a un candidat dans [T−3 h, T+1 h].
5. **Matching** : confirmer une suggestion → `te_expense_matches.status='confirmed'`
   + snapshot `matched_event_title` posé (trigger).
6. **Vie privée DAF** : avec le rôle admin, vérifier qu'on lit les matches mais PAS
   `te_calendar_events`, et que le titre du RDV n'apparaît que sur les confirmés.
7. **Cron** : `SELECT * FROM cron.job WHERE jobname LIKE 'te-frais%';` puis, le
   lendemain, `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`.

## Reste à faire (hors déploiement)

- Nonce anti-CSRF sur `google-oauth-start` (le `state` = user_id nu pour l'instant).
- Géocodage de `location_raw` / `merchant_*` (signal géo inactif tant que null —
  non pénalisant, le score se joue sur le temps).
- `external_account_id` via userinfo (email du calendar).
- Flag tenant `auto_confirm` (seuil 85 inactif par défaut, opt-in).
- Types Supabase : régénérer après l'étape 1 (le front utilise un client non typé
  pour les tables `te_*` en attendant).
