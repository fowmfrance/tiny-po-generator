# Sapajoo - Spécification Technique et Fonctionnelle

**Version**: 1.0  
**Date**: 7 janvier 2026  
**Statut**: Document de référence

---

## Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Modèle de données](#3-modèle-de-données)
4. [Modules fonctionnels](#4-modules-fonctionnels)
5. [Intégrations externes](#5-intégrations-externes)
6. [Sécurité et authentification](#6-sécurité-et-authentification)
7. [Portail fournisseur](#7-portail-fournisseur)

---

## 1. Vue d'ensemble

### 1.1 Description du produit

**Sapajoo** est une application web de gestion des achats et de la trésorerie destinée aux PME et ETI. Elle permet de :

- Gérer les budgets par projet ou par nature (G&A)
- Créer et suivre les bons de commande (Purchase Orders)
- Gérer les fournisseurs et leurs coordonnées bancaires
- Traiter les factures fournisseurs
- Générer des fichiers de paiement SEPA
- Synchroniser les transactions avec les banques (Qonto)
- Catégoriser automatiquement les dépenses

### 1.2 Public cible

- Directeurs financiers (CFO)
- Contrôleurs de gestion
- Responsables achats
- Comptables fournisseurs

### 1.3 Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS |
| State Management | React Query (TanStack) |
| Routing | React Router v6 |
| Backend | Supabase (Lovable Cloud) |
| Database | PostgreSQL |
| Edge Functions | Deno (Supabase Functions) |
| Authentication | Supabase Auth |

---

## 2. Architecture technique

### 2.1 Structure du projet

```
src/
├── components/          # Composants React réutilisables
│   ├── ui/             # Composants shadcn/ui
│   ├── budget/         # Composants liés aux budgets
│   ├── dashboard/      # Composants du tableau de bord
│   ├── landing/        # Composants de la page d'accueil
│   ├── payments/       # Composants de paiement
│   ├── purchase-orders/# Composants des bons de commande
│   ├── reports/        # Graphiques et rapports
│   ├── settings/       # Configuration
│   ├── signup/         # Inscription
│   ├── supplier/       # Portail fournisseur
│   └── vendors/        # Gestion des fournisseurs
├── hooks/              # Custom React hooks
├── integrations/       # Intégration Supabase
├── models/             # Types et interfaces métier
├── pages/              # Pages de l'application
├── services/           # Services métier
├── types/              # Types TypeScript
└── utils/              # Utilitaires
```

### 2.2 Routes de l'application

| Route | Page | Accès |
|-------|------|-------|
| `/` | Landing Page | Public |
| `/auth` | Authentification | Public |
| `/dashboard` | Tableau de bord | Authentifié |
| `/budgets` | Liste des budgets | Authentifié |
| `/budgets/create` | Création de budget | Authentifié |
| `/budgets/:id` | Détail d'un budget | Authentifié |
| `/purchase-orders` | Liste des BC | Authentifié |
| `/purchase-orders/create` | Création de BC | Authentifié |
| `/purchase-orders/:id` | Détail d'un BC | Authentifié |
| `/vendors` | Liste des fournisseurs | Authentifié |
| `/vendors/:id` | Détail fournisseur | Authentifié |
| `/payments` | Gestion des paiements | Authentifié |
| `/banques` | Connexions bancaires | Authentifié |
| `/reports` | Rapports et analytics | Authentifié |
| `/settings` | Paramètres | Authentifié |
| `/supplier` | Portail fournisseur | Public |
| `/supplier/dashboard/:vendorId` | Dashboard fournisseur | Fournisseur |

---

## 3. Modèle de données

### 3.1 Schéma de base de données

#### Tables principales

##### `profiles`
Profils utilisateurs liés à `auth.users`.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire (= auth.users.id) |
| email | TEXT | Email de l'utilisateur |
| full_name | TEXT | Nom complet |
| company | TEXT | Nom de l'entreprise |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

##### `user_roles`
Rôles des utilisateurs (user, admin).

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Référence utilisateur |
| role | TEXT | Rôle (user, admin) |

##### `suppliers`
Fournisseurs de l'entreprise.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Propriétaire |
| name | TEXT | Nom du fournisseur |
| email | TEXT | Email de contact |
| phone | TEXT | Téléphone |
| address | TEXT | Adresse |
| city | TEXT | Ville |
| country | TEXT | Pays |
| tax_id | TEXT | Numéro de TVA/SIRET |
| is_active | BOOLEAN | Statut actif |

##### `supplier_bank_accounts`
Comptes bancaires des fournisseurs (chiffrés).

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| supplier_id | UUID | Référence fournisseur |
| label | TEXT | Libellé du compte |
| currency | TEXT | Devise (EUR, USD, GBP) |
| encrypted_iban | TEXT | IBAN chiffré (AES-256) |
| encrypted_bic | TEXT | BIC chiffré |
| bank_name | TEXT | Nom de la banque |
| is_primary | BOOLEAN | Compte principal |
| is_archived | BOOLEAN | Archivé |

##### `supplier_invoices`
Factures fournisseurs.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Propriétaire |
| supplier_id | UUID | Référence fournisseur |
| invoice_number | TEXT | Numéro de facture |
| po_number | TEXT | Numéro de BC associé |
| amount | NUMERIC | Montant TTC |
| vat_amount | NUMERIC | Montant TVA |
| vat_rate | NUMERIC | Taux de TVA |
| currency | TEXT | Devise |
| invoice_date | DATE | Date de facture |
| received_date | DATE | Date de réception |
| due_date | DATE | Date d'échéance |
| paid_date | DATE | Date de paiement |
| status | TEXT | Statut (pending, approved, paid, cancelled) |
| attachment_url | TEXT | URL de la pièce jointe |

##### `payment_batches`
Lots de paiement SEPA.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Propriétaire |
| batch_reference | TEXT | Référence du lot |
| currency | TEXT | Devise |
| total_amount | NUMERIC | Montant total |
| invoice_count | INTEGER | Nombre de factures |
| status | TEXT | Statut (draft, generated, submitted, processed) |
| sepa_xml | TEXT | Fichier XML SEPA généré |
| generated_at | TIMESTAMP | Date de génération |
| submitted_at | TIMESTAMP | Date de soumission |

##### `payment_batch_invoices`
Association lots de paiement / factures.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| batch_id | UUID | Référence lot |
| invoice_id | UUID | Référence facture |
| amount_paid | NUMERIC | Montant payé |

##### `bank_connections`
Connexions aux API bancaires (Qonto).

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Propriétaire |
| bank_name | TEXT | Nom de la banque |
| login | TEXT | Identifiant (masqué) |
| secret_key | TEXT | Clé secrète (masquée) |
| encrypted_login | TEXT | Login chiffré |
| encrypted_secret_key | TEXT | Clé chiffrée |
| organization_name | TEXT | Nom de l'organisation |
| bank_accounts | JSONB | Comptes disponibles |
| is_active | BOOLEAN | Connexion active |

##### `transactions`
Transactions bancaires importées (Qonto).

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Propriétaire |
| bank_connection_id | UUID | Connexion bancaire |
| qonto_transaction_id | TEXT | ID Qonto |
| qonto_amount | NUMERIC | Montant |
| qonto_currency | TEXT | Devise |
| qonto_label | TEXT | Libellé |
| qonto_category | TEXT | Catégorie Qonto |
| qonto_status | TEXT | Statut |
| qonto_emitted_at | TIMESTAMP | Date d'émission |
| qonto_settled_at | TIMESTAMP | Date de règlement |
| sapajoo_category_id | UUID | Catégorie Sapajoo mappée |
| project_code | TEXT | Code projet associé |

##### `expense_categories`
Catégories de dépenses personnalisées.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Propriétaire |
| name | TEXT | Nom de la catégorie |
| description | TEXT | Description |
| color | TEXT | Couleur d'affichage (hex) |
| is_default | BOOLEAN | Catégorie par défaut |
| is_active | BOOLEAN | Active |

##### `bank_labels`
Labels bancaires (référentiel).

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| bank_name | TEXT | Banque (qonto) |
| label_code | TEXT | Code du label |
| label_name | TEXT | Nom du label |
| description | TEXT | Description |
| is_active | BOOLEAN | Actif |

##### `bank_label_mappings`
Mapping labels bancaires → catégories Sapajoo.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Propriétaire |
| bank_label_id | UUID | Label bancaire |
| expense_category_id | UUID | Catégorie Sapajoo |

##### `budget_types`
Types de budget et formats de numérotation.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Propriétaire |
| name | TEXT | Nom du type (G&A, Projets) |
| description | TEXT | Description |
| po_format | TEXT | Format de numéro BC |
| current_sequence | INTEGER | Séquence courante |
| is_default | BOOLEAN | Type par défaut |
| is_active | BOOLEAN | Actif |

##### `teams`
Équipes/départements.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| user_id | UUID | Propriétaire |
| name | TEXT | Nom de l'équipe |
| description | TEXT | Description |
| color | TEXT | Couleur |
| is_active | BOOLEAN | Active |

### 3.2 Fonctions de base de données

| Fonction | Description |
|----------|-------------|
| `handle_new_user()` | Crée automatiquement un profil et un rôle lors de l'inscription |
| `initialize_default_budget_types()` | Initialise les types de budget par défaut |
| `initialize_default_categories()` | Initialise les catégories de dépenses par défaut |
| `initialize_default_teams()` | Initialise les équipes par défaut |
| `encrypt_credential()` | Chiffre une valeur avec AES-256 (pgp_sym_encrypt) |
| `decrypt_credential()` | Déchiffre une valeur |
| `encrypt_supplier_bank_account()` | Crée un compte bancaire fournisseur chiffré |
| `get_decrypted_supplier_bank()` | Récupère les coordonnées bancaires déchiffrées |
| `archive_supplier_bank_account()` | Archive un compte bancaire |
| `has_role()` | Vérifie si un utilisateur a un rôle spécifique |

---

## 4. Modules fonctionnels

### 4.1 Gestion des Budgets

#### Fonctionnalités
- Création de budgets avec montant initial, devise et période
- Deux types de budget : **Projet** et **G&A** (General & Administrative)
- Suivi du montant engagé vs disponible
- Mode de reconnaissance : **Linéaire** ou **À l'achèvement**
- Vue kanban et vue liste
- Rattachement des bons de commande

#### Calculs budgétaires
```typescript
interface Budget {
  initialAmount: number;      // Montant initial du budget
  sentAmount: number;         // Somme des BC envoyés
  availableAmount: number;    // initialAmount - sentAmount
  remainingAmount: number;    // BC envoyés, factures non reçues
  receivedAmount: number;     // BC envoyés, factures reçues
}
```

#### Devises supportées
- EUR (Euro) - devise de base
- USD (Dollar américain)
- GBP (Livre sterling)

### 4.2 Gestion des Bons de Commande (BC)

#### Cycle de vie d'un BC
```
Brouillon → En attente → Approuvé → Envoyé → Terminé
   ↓           ↓           ↓
Annulé     Rejeté       Annulé
```

#### Statuts
| Statut | Description |
|--------|-------------|
| `draft` | Brouillon, modifiable |
| `pending` | En attente d'approbation |
| `approved` | Approuvé, prêt à être envoyé |
| `sent` | Envoyé au fournisseur |
| `completed` | Facturé et terminé |
| `rejected` | Rejeté |
| `cancelled` | Annulé |

#### Informations du BC
- Numéro de commande (généré automatiquement selon le format)
- Fournisseur
- Budget rattaché
- Lignes de commande (articles, quantités, prix unitaires)
- Montant total HT/TTC
- Date de commande et date de livraison prévue

### 4.3 Gestion des Fournisseurs

#### Données fournisseur
- Informations de contact (nom, email, téléphone)
- Adresse complète
- Numéro de TVA intracommunautaire
- Comptes bancaires (IBAN/BIC chiffrés)
- Historique des commandes

#### Coordonnées bancaires
- Chiffrement AES-256 des IBAN et BIC
- Support multi-comptes par fournisseur
- Système de compte principal
- Archivage des anciens comptes

### 4.4 Gestion des Factures

#### Cycle de vie
```
En attente → Approuvée → Payée
    ↓
Annulée
```

#### Données facture
- Numéro de facture
- Lien avec BC (optionnel)
- Montant HT, TVA, TTC
- Date de facture, réception, échéance
- Statut de paiement
- Pièce jointe (PDF)

#### Indicateurs de paiement
- **À échéance** : date d'échéance > aujourd'hui
- **Échéance proche** : échéance dans les 7 jours
- **En retard** : échéance dépassée
- **Payée** : facture réglée

### 4.5 Paiements et SEPA

#### Génération de fichiers SEPA
- Standard : ISO 20022 pain.001.001.03
- Regroupement par fournisseur et devise
- Génération de lots de paiement
- Téléchargement du fichier XML

#### Structure SEPA
```typescript
interface SepaPaymentInfo {
  paymentInfoId: string;
  numberOfTransactions: number;
  controlSum: number;
  requestedExecutionDate: string;
  debtor: { name, iban, bic };
  creditTransfers: SepaCreditTransfer[];
}
```

### 4.6 Connexion Bancaire (Qonto)

#### Fonctionnalités
- Authentification API Qonto (login + secret key)
- Import des transactions
- Synchronisation des catégories
- Mapping catégories Qonto → catégories Sapajoo

#### Edge Function `qonto-proxy`
Actions disponibles :
- `get_organization` : informations organisation
- `get_transactions` : liste des transactions
- `get_categories` : catégories uniques des transactions

### 4.7 Rapports et Analytics

#### Graphiques disponibles
- Performance budgétaire (consommation vs temps)
- Dépenses par fournisseur
- Nombre de BC par fournisseur
- Évolution mensuelle des métriques
- Factures en attente
- Nouveaux fournisseurs

---

## 5. Intégrations externes

### 5.1 API Qonto

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/v2/organization` | GET | Informations organisation |
| `/v2/transactions` | GET | Liste des transactions |

#### Paramètres de requête transactions
- `slug` : identifiant du compte
- `status[]` : filtre par statut
- `current_page` : pagination
- `per_page` : nombre par page (max 100)

### 5.2 Format d'échange

#### Export SEPA XML
- Format : ISO 20022 pain.001.001.03
- Encodage : UTF-8
- Nom de fichier : `SEPA_BATCH_{reference}_{date}.xml`

---

## 6. Sécurité et authentification

### 6.1 Authentification

- Provider : Supabase Auth
- Méthode : Email + Mot de passe
- Auto-confirmation des emails activée
- Sessions persistantes (localStorage)

### 6.2 Row Level Security (RLS)

Toutes les tables utilisent RLS avec les politiques suivantes :
- `SELECT` : utilisateur propriétaire uniquement
- `INSERT` : utilisateur authentifié (user_id = auth.uid())
- `UPDATE` : utilisateur propriétaire uniquement
- `DELETE` : utilisateur propriétaire (si autorisé)

### 6.3 Chiffrement

- Données sensibles (IBAN, BIC, credentials) : AES-256 via `pgp_sym_encrypt`
- Clé de chiffrement stockée dans les secrets Supabase
- Déchiffrement uniquement côté serveur (fonctions security definer)

### 6.4 Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| `user` | CRUD sur ses propres données |
| `admin` | Accès lecture sur toutes les données utilisateurs |

---

## 7. Portail Fournisseur

### 7.1 Fonctionnalités

Le portail fournisseur permet aux fournisseurs de :
- Se connecter via un lien dédié
- Consulter leurs bons de commande
- Soumettre des factures
- Suivre l'état des paiements

### 7.2 Routes

| Route | Description |
|-------|-------------|
| `/supplier` | Page de connexion fournisseur |
| `/supplier/dashboard/:vendorId` | Tableau de bord fournisseur |
| `/supplier/invoice/create/:vendorId` | Création de facture |
| `/supplier/invoice/guest` | Soumission facture invité |
| `/supplier/purchaseorders/:vendorId` | Liste des BC |

### 7.3 Authentification fournisseur

Mode de connexion simplifié (email du fournisseur) sans création de compte Supabase.

---

## Annexes

### A. Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase |
| `BANK_CREDENTIALS_ENCRYPTION_KEY` | Clé de chiffrement des données bancaires |

### B. Dépendances principales

| Package | Version | Usage |
|---------|---------|-------|
| react | ^18.3.1 | Framework UI |
| @supabase/supabase-js | ^2.86.0 | Client Supabase |
| @tanstack/react-query | ^5.56.2 | Gestion d'état async |
| react-router-dom | ^6.26.2 | Routing |
| recharts | ^2.12.7 | Graphiques |
| date-fns | ^3.6.0 | Manipulation de dates |
| zod | ^3.23.8 | Validation de schémas |
| react-hook-form | ^7.53.0 | Gestion de formulaires |

### C. Conventions de code

- **Nommage** : camelCase pour variables/fonctions, PascalCase pour composants
- **Types** : TypeScript strict
- **Styling** : Tailwind CSS avec tokens sémantiques
- **Composants** : Fonctionnels avec hooks

---

*Document généré automatiquement - Sapajoo v1.0*
