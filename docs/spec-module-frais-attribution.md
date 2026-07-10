# Spec — Module Frais & Attribution (adaptation Sapajoo)

> Doc d'intégration. Prend le spec source (`specs-sapajoo-module-frais.md`, 10 juil. 2026)
> et le **réconcilie avec l'existant Sapajoo** + les conventions du repo.
> Objectif de ce doc : décider quoi réutiliser vs construire, corriger le modèle
> multi-tenant (`tenant_id` → `organization_id`), et donner un découpage sûr pour
> une base **Lovable / SQL manuel** (rien n'est auto-déployé).

## Objectif (rappel condensé)
Unifier les dépenses terrain (T&E) quelle que soit la source de paiement, les enrichir
par le calendrier + le CRM, et produire une **attribution du coût commercial par
compte/deal**. Le « wow » du Sprint 1 = une dépense qui se rattache toute seule au
bon RDV agenda.

**Hors périmètre v1** : remboursement multi-niveaux + SEPA, OCR ligne à ligne,
indemnités kilométriques, multi-devises, cartes émises en propre.

---

## 1. État existant — les briques déjà là (à NE PAS reconstruire)

Le spec est écrit comme un greenfield. Il ne l'est pas. Ce qui existe déjà dans le repo :

| Brique existante | Ce que le spec appelait | Décision |
|---|---|---|
| Table **`transactions`** (Qonto, très riche : `qonto_amount`, `qonto_side`, `qonto_operation_type`, `qonto_settled_at`/`qonto_emitted_at`, `qonto_vat_amount/rate`, `qonto_card_last_digits`, `qonto_attachment_ids`, `qonto_raw_data`, `sapajoo_category_id`, `project_code`, `supplier_id`) | `expense_events (source='card_platform'/'bank_feed')` + connecteur Qonto §4.3 | **Réutiliser.** Qonto est déjà ingéré. Voir §3 — `expense_events` ne re-sync pas Qonto. |
| Edge function **`qonto-proxy`** | connecteur `sync-cards` Qonto | **Réutiliser** tel quel comme source. |
| Edge function **`analyze-invoice`** (OCR vision, modèle `google/gemini-2.5-flash`) | `ocr-receipt` §4.5 (le spec proposait Claude vision) | **Réutiliser le pipeline OCR**, prompt dédié « reçu » (merchant/amount/vat/date). ⚠️ le spec dit « Claude vision » — l'infra en place est **Gemini flash**, pas Anthropic. |
| Table **`suppliers`** (org-scopée) + `supplier_bank_label_rules` (matching libellé→fournisseur) | `merchant_clean` / marchand | Le marchand d'une dépense **peut** être un `supplier` connu. Ne pas dupliquer la notion. |
| Table **`expense_categories`** | champ `category` texte libre | FK vers `expense_categories` plutôt que texte. |
| Buckets privés `kyc-documents`, `invoice-attachments` (+ RLS storage) | bucket `receipts` | Copier le pattern (nouveau bucket privé `receipts`). |
| **pg_cron** (déjà utilisé, `email_infra`) | jobs de renouvellement channels / purge / capture proactive | Disponible, réutiliser. |
| Helpers RLS `current_user_organization_id()`, `has_role(auth.uid(),'admin-sapajoo')` ; colonne `organization_id` remplie par trigger depuis `profiles` | `tenant_id` + « RLS par tenant » | **Convention à substituer partout** (§2). |

**Conséquence architecturale n°1 — DÉCIDÉE : option A (pivot mince).** le spec pose
`expense_events` comme objet pivot unique. Or les transactions carte/banque vivent
déjà dans `transactions`. Deux options :

- **A — pivot mince (recommandé).** `expense_events` = objet d'**attribution**, pas
  d'ingestion. Une transaction Qonto reste dans `transactions` ; on crée un
  `expense_event` qui la **référence** (`transaction_id`) uniquement quand elle est
  T&E et candidate à un rattachement. Le canal perso (reçu sans transaction) crée un
  `expense_event` autonome (`source='receipt_only'`). Évite la double écriture et le
  désync avec la sync bancaire existante.
- **B — pivot épais.** `expense_events` copie/normalise toute transaction T&E. Plus
  proche du spec littéral, mais duplique la donnée Qonto et impose une réconciliation
  permanente `transactions` ↔ `expense_events`.

Le reste de ce doc est écrit pour **l'option A**.

---

## 2. Conventions Sapajoo à appliquer au spec

1. **`tenant_id` → `organization_id`** partout. Rempli par trigger `BEFORE INSERT`
   depuis `profiles` (pattern `set_bank_connection_org` déjà en place), pas par le client.
2. **RLS à deux étages** (comme le reste du repo) :
   - données perso du collaborateur (`expense_events`, `calendar_events`, `receipts`,
     `integration_connections`) → `USING (auth.uid() = user_id)`.
   - vue org / rôle DAF → `organization_id = current_user_organization_id() OR has_role(auth.uid(),'admin-sapajoo')`,
     mais **le DAF ne voit pas le détail calendrier** (titres/participants) sauf sur un
     match **confirmé** → minimisation (cf. §5 sécurité du spec).
3. **Secrets connecteurs** : Vault (comme `bank_connections` chiffre login/secret). Jamais de token en clair en table applicative.
4. **Migrations** = fichiers SQL horodatés `supabase/migrations/AAAAMMJJhhmmss_*.sql`, **appliqués à la main** (Lovable ne déploie pas auto). ⚠️ éviter `CREATE INDEX CONCURRENTLY` / gros index dans une migration jouée à chaud sur la prod — a déjà fait tomber une instance. Index simples, tables neuves = OK (pas de données).
5. **Edge functions** : structure `supabase/functions/<nom>/index.ts` (Deno), déploiement manuel.

---

## 3. Modèle de données (adapté, option A)

Toutes les tables : `organization_id uuid not null` (trigger), `created_at/updated_at`,
RLS activée. Seuls les écarts vs le spec source sont détaillés ; le reste = §3 du spec.

### 3.1 `integration_connections` — inchangé sauf
- `tenant_id` → `organization_id`.
- providers : retirer ceux hors-scope tant que non branchés ; garder au minimum
  `('google_calendar')` pour le Sprint 1, ajouter `qonto`/`bridge`/`powens`/`hubspot`
  au fil des sprints.
- Qonto est déjà connecté via `bank_connections` → **ne pas dupliquer** la connexion
  Qonto ici ; `integration_connections` sert surtout au calendrier (et plus tard CRM).

### 3.2 `expense_events` — pivot mince
Écarts vs spec :
- `tenant_id` → `organization_id`.
- **+ `transaction_id uuid references public.transactions(id) on delete set null`** :
  lien vers la transaction Qonto source (option A). `source='card_platform'` ⇒
  `transaction_id` renseigné, montant/date/marchand **dérivés** de `transactions`
  (ne pas recopier, lire via jointure ou trigger de cache).
- `category text` → `category_id uuid references public.expense_categories(id)`.
- `merchant_clean` peut pointer un `supplier_id uuid references public.suppliers(id)`
  quand le marchand est un fournisseur connu.
- garder `status`, `reimbursable`, `reimbursement_status`, `receipt_id`, géoloc marchand.
- Unicité : pour `receipt_only`/`manual`, `(organization_id, id)` suffit ; pour les
  sources externes, l'anti-doublon vit sur `transactions.qonto_transaction_id` (déjà unique).

### 3.3 `calendar_events` — inchangé sauf `organization_id`
Fenêtre glissante −90 j/+7 j, `is_external` affiné côté sync (≥1 participant hors
domaine tenant), purge 15 mois (pg_cron). Nouveau (pas d'existant à réutiliser).

### 3.4 `receipts` — inchangé sauf `organization_id`
Nouveau bucket privé `receipts` (copier RLS de `invoice-attachments`). `ocr_status`,
champs `ocr_*`. Conservation 6 ans (valeur probante) — juste une note, pas de purge auto.

### 3.5 CRM (`crm_accounts/contacts/deals`) — Sprint 3, `organization_id` + clé `(organization_id, provider, external_id)`.

### 3.6 `expense_matches` — inchangé sauf `organization_id`
`unique (expense_id)`. `signals jsonb` = explicabilité + jeu d'apprentissage. RLS user.

---

## 4. Connecteurs — ce qui change

- **Google Calendar (§4.1)** : entièrement neuf, garder le spec tel quel (OAuth PKCE,
  scope `calendar.events.readonly`, sync incrémentale `syncToken`, webhook push,
  renouvellement channels par pg_cron, anti-spoof `X-Goog-Channel-Id`). C'est le
  cœur du Sprint 1.
- **Qonto (§4.3)** : **déjà là** (`qonto-proxy` + `transactions`). « Connecteur » =
  brancher le matching sur les lignes T&E de `transactions`, pas re-sync.
- **Banque DSP2 Bridge/Powens (§4.2)** : Sprint 2, neuf.
- **OCR reçu (§4.5)** : réutiliser le pipeline `analyze-invoice` (Gemini flash),
  prompt « reçu » → `{merchant, amount, vat, date}`, crée `expense_event(source='receipt_only')`.
- **CRM (§4.4)** : Sprint 3, neuf.

---

## 5. Moteur de matching — inchangé sur le fond
Edge function `match-expense`, candidats agenda dans `[T−3h, T+1h]`, score pondéré
(temps 40 / géo 25 / catégorie×heure 15 / participants 10 / historique 10),
seuils 85 / 50 / <50. `signals` conservé. Réconciliation ticket↔transaction via
`pg_trgm` (montant ±15 %, date ±3 j, similarité marchand). **Note d'intégration :**
la « transaction » côté réconciliation = ligne `transactions` existante, et
`pg_trgm` doit être activé (`create extension if not exists pg_trgm`).

---

## 6. Points de vigilance (spécifiques Sapajoo)

1. **Bug RLS org récurrent** : chaque table doit tester son trigger `organization_id`
   + policies AVANT usage réel (un `organization_id` null passe les policies user mais
   casse la vue DAF). Prévoir un test fonctionnel par table.
2. **DAF vs vie privée du salarié** : le calendrier est une donnée perso. Policies à
   écrire de sorte que le rôle admin ne lise `calendar_events.title/attendees` **que**
   via un `expense_matches.status='confirmed'`. À vérifier explicitement (c'est la
   partie la plus facile à rater).
3. **Provider OCR** : ne pas coder « Claude » comme le suppose le spec — l'infra est
   Gemini flash. Trancher sur 50 reçus réels si TVA FR fiable (sinon Mindee).
4. **Pas de gros index à chaud** ; tables neuves donc risque faible, mais rester vigilant.
5. **RGPD** : consentement explicite à la connexion calendrier, purge 15 mois,
   révocation = suppression cascade. Registre de traitement à documenter.

---

## 7. Découpage proposé (base Lovable, SQL manuel)

**Sprint 1 — socle + calendrier (le wow)**
1. Migration `20260710120000_mod_frais_socle.sql` (**écrite**) : `integration_connections`,
   `expense_events` (option A, avec `transaction_id`), `calendar_events`, `receipts`,
   `expense_matches` + triggers `organization_id` + RLS deux étages + bucket `receipts`.
   → à coller dans Lovable, puis **tester chaque RLS** (le trigger org null casse la vue DAF).
2. Edge functions (**scaffolds écrits, `deno check` OK**) : `google-oauth-start`,
   `google-oauth-callback`, `sync-calendar`, `google-calendar-webhook`,
   `match-expense`, `ocr-receipt` (fork vision de `analyze-invoice`) + helper
   `_shared/google.ts` (`google-token-refresh` fondu dedans). `config.toml` renseigné.
   Restent des `TODO` marqués : nonce anti-CSRF, géocodage, userinfo email, flag
   tenant auto-confirm.

   **Secrets à provisionner (Supabase → Edge Functions)** — au-delà de ceux déjà là
   (`SUPABASE_*`, `LOVABLE_API_KEY`, `BANK_CREDENTIALS_ENCRYPTION_KEY`) :
   `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`
   (= `…/functions/v1/google-oauth-callback`), `GOOGLE_CALENDAR_WEBHOOK_URL`
   (= `…/functions/v1/google-calendar-webhook`), `APP_URL`, `CRON_SECRET`.
   Les tokens Google sont **chiffrés via `encrypt_credential`** (pattern bank_connections),
   pas Supabase Vault — cf. `_shared/google.ts`.
3. UI « À traiter » : reprendre le prototype `sapajoo-module-frais.jsx`.
4. Test réel : frais Fowm/Fleuron + agenda perso.

**Sprint 2 — sources de paiement** : brancher matching sur `transactions` (Qonto déjà
là) ; réconciliation ticket↔transaction ; capture proactive (pg_cron 9 h) ; puis Bridge/Powens.

**Sprint 3 — CRM + attribution** : HubSpot, jointure par email participants, vue
matérialisée `attribution_by_account`, UI Attribution, fallback compte dérivé du domaine.

**Critère de succès pilote** : ≥ 70 % des dépenses T&E auto-rattachées sans intervention,
et un rapport d'attribution qui fait réagir un DAF en démo.

---

## 8. Points ouverts (décisions avant de coder)

1. ~~**Option A vs B**~~ **TRANCHÉ → option A** (pivot mince, `expense_events` référence `transactions`). Migration socle écrite sur cette base.
2. **Agrégateur bancaire** Bridge vs Powens (Sprint 2) — pricing + couverture cartes corpo.
3. **Auto-confirmation** seuil 85 : opt-in tenant (recommandé, la confiance se gagne).
4. ~~**OCR**~~ **TRANCHÉ → Gemini flash** (réutilise `analyze-invoice`). Repli Mindee gardé en réserve si TVA FR peu fiable sur 50 reçus réels.
5. **Dédup reçu ↔ facture entrante** (circuit PA e-invoicing) : clé SIREN marchand +
   montant + date. À câbler avec `supplier_invoices` existant.
