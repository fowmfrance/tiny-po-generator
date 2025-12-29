# Spécification Pack Coda - Intégration Qonto

## Vue d'ensemble

Ce document décrit l'intégration Qonto pour créer un Pack Coda qui permet de récupérer et gérer les données bancaires depuis l'API Qonto.

## Authentification Qonto

L'API Qonto utilise une authentification par **Login + Secret Key** (pas OAuth).

### Headers requis

```javascript
const qontoHeaders = {
  'Authorization': `${qontoLogin}:${qontoSecretKey}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

### Configuration dans Coda Pack

```javascript
pack.setUserAuthentication({
  type: coda.AuthenticationType.CustomHeaderToken,
  headerName: "Authorization",
  // L'utilisateur doit entrer "login:secretKey" comme token
});
```

Ou avec authentification custom :

```javascript
pack.setUserAuthentication({
  type: coda.AuthenticationType.Custom,
  params: [
    { name: "login", description: "Login API Qonto" },
    { name: "secretKey", description: "Clé secrète API Qonto" },
  ],
});
```

---

## Endpoints API Qonto

Base URL : `https://thirdparty.qonto.com/v2`

### 1. Organisation (Validation des credentials)

```
GET /organization
```

**Réponse :**
```json
{
  "organization": {
    "slug": "org-slug",
    "legal_name": "Ma Société SAS",
    "bank_accounts": [
      {
        "slug": "account-slug",
        "iban": "FR76...",
        "bic": "QNTOFRP1XXX",
        "name": "Compte principal",
        "balance": 15000.50,
        "balance_cents": 1500050,
        "currency": "EUR",
        "authorized_balance": 15000.50,
        "authorized_balance_cents": 1500050
      }
    ]
  }
}
```

### 2. Transactions

```
GET /transactions?slug={account_slug}&per_page=100&settled_at_from=2024-01-01
```

**Paramètres :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| slug | string | Slug du compte bancaire (obligatoire) |
| per_page | number | Nombre de résultats (max 100) |
| settled_at_from | date | Date de début (YYYY-MM-DD) |
| settled_at_to | date | Date de fin |
| status | string | pending, declined, completed |
| side | string | credit ou debit |

**Réponse :**
```json
{
  "transactions": [
    {
      "id": "txn-uuid",
      "emitted_at": "2024-01-15T10:30:00.000Z",
      "settled_at": "2024-01-15T14:00:00.000Z",
      "amount": 150.00,
      "currency": "EUR",
      "local_amount": 150.00,
      "local_currency": "EUR",
      "side": "debit",
      "operation_type": "card",
      "label": "Restaurant Le Petit Bistro",
      "status": "completed",
      "note": "Déjeuner client",
      "reference": "REF-2024-001",
      "vat_amount": 25.00,
      "vat_rate": 20.0,
      "initiator_id": "user-uuid",
      "card_last_digits": "4242",
      "category": "restaurants_and_bars",
      "attachment_ids": ["att-uuid-1"]
    }
  ],
  "meta": {
    "current_page": 1,
    "next_page": null,
    "prev_page": null,
    "total_pages": 1,
    "total_count": 50,
    "per_page": 100
  }
}
```

### 3. Factures clients (Client Invoices)

```
GET /client_invoices
```

**Réponse :**
```json
{
  "client_invoices": [
    {
      "id": "invoice-uuid",
      "invoice_number": "FAC-2024-001",
      "status": "paid",
      "amount": 1200.00,
      "currency": "EUR",
      "issue_date": "2024-01-10",
      "due_date": "2024-02-10",
      "paid_date": "2024-01-25",
      "client": {
        "name": "Client Corp",
        "email": "contact@client.com"
      }
    }
  ]
}
```

### 4. Membres (Team Members)

```
GET /members
```

### 5. Labels/Catégories

```
GET /labels
```

---

## Schémas Coda recommandés

### Schema: BankAccount

```javascript
const BankAccountSchema = coda.makeObjectSchema({
  properties: {
    slug: { type: coda.ValueType.String },
    name: { type: coda.ValueType.String },
    iban: { type: coda.ValueType.String },
    bic: { type: coda.ValueType.String },
    balance: { type: coda.ValueType.Number },
    currency: { type: coda.ValueType.String },
  },
  displayProperty: "name",
  idProperty: "slug",
});
```

### Schema: Transaction

```javascript
const TransactionSchema = coda.makeObjectSchema({
  properties: {
    id: { type: coda.ValueType.String },
    emittedAt: { type: coda.ValueType.String, codaType: coda.ValueHintType.DateTime },
    settledAt: { type: coda.ValueType.String, codaType: coda.ValueHintType.DateTime },
    amount: { type: coda.ValueType.Number, codaType: coda.ValueHintType.Currency },
    currency: { type: coda.ValueType.String },
    side: { type: coda.ValueType.String }, // "credit" ou "debit"
    operationType: { type: coda.ValueType.String },
    label: { type: coda.ValueType.String },
    status: { type: coda.ValueType.String },
    note: { type: coda.ValueType.String },
    reference: { type: coda.ValueType.String },
    category: { type: coda.ValueType.String },
    vatAmount: { type: coda.ValueType.Number },
    vatRate: { type: coda.ValueType.Number },
    cardLastDigits: { type: coda.ValueType.String },
  },
  displayProperty: "label",
  idProperty: "id",
});
```

---

## Formules Coda recommandées

### 1. GetOrganization

```javascript
pack.addFormula({
  name: "GetOrganization",
  description: "Récupère les informations de l'organisation Qonto",
  resultType: coda.ValueType.Object,
  schema: OrganizationSchema,
  isAction: false,
  parameters: [],
  execute: async function ([], context) {
    const response = await context.fetcher.fetch({
      method: "GET",
      url: "https://thirdparty.qonto.com/v2/organization",
    });
    return response.body.organization;
  },
});
```

### 2. SyncTransactions (Sync Table)

```javascript
pack.addSyncTable({
  name: "Transactions",
  schema: TransactionSchema,
  identityName: "Transaction",
  formula: {
    name: "SyncTransactions",
    description: "Synchronise les transactions Qonto",
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: "accountSlug",
        description: "Slug du compte bancaire",
      }),
      coda.makeParameter({
        type: coda.ParameterType.Date,
        name: "fromDate",
        description: "Date de début",
        optional: true,
      }),
    ],
    execute: async function ([accountSlug, fromDate], context) {
      let url = `https://thirdparty.qonto.com/v2/transactions?slug=${accountSlug}&per_page=100`;
      
      if (fromDate) {
        url += `&settled_at_from=${fromDate.toISOString().split('T')[0]}`;
      }

      const response = await context.fetcher.fetch({
        method: "GET",
        url: url,
      });

      const transactions = response.body.transactions.map(tx => ({
        id: tx.id,
        emittedAt: tx.emitted_at,
        settledAt: tx.settled_at,
        amount: tx.amount,
        currency: tx.currency,
        side: tx.side,
        operationType: tx.operation_type,
        label: tx.label,
        status: tx.status,
        note: tx.note,
        reference: tx.reference,
        category: tx.category,
        vatAmount: tx.vat_amount,
        vatRate: tx.vat_rate,
        cardLastDigits: tx.card_last_digits,
      }));

      return { result: transactions };
    },
  },
});
```

### 3. GetBankAccounts

```javascript
pack.addFormula({
  name: "GetBankAccounts",
  description: "Liste les comptes bancaires de l'organisation",
  resultType: coda.ValueType.Array,
  items: BankAccountSchema,
  parameters: [],
  execute: async function ([], context) {
    const response = await context.fetcher.fetch({
      method: "GET",
      url: "https://thirdparty.qonto.com/v2/organization",
    });
    return response.body.organization.bank_accounts;
  },
});
```

---

## Gestion des erreurs

L'API Qonto retourne des erreurs sous ce format :

```json
{
  "errors": [
    {
      "code": "unauthorized",
      "detail": "Invalid credentials"
    }
  ]
}
```

### Codes d'erreur courants

| Code | Description |
|------|-------------|
| unauthorized | Credentials invalides |
| not_found | Ressource non trouvée |
| rate_limited | Trop de requêtes |
| validation_error | Paramètres invalides |

---

## Pagination

L'API utilise une pagination classique :

```javascript
// Gestion de la pagination
let allTransactions = [];
let currentPage = 1;
let hasMore = true;

while (hasMore) {
  const response = await fetch(`${url}&current_page=${currentPage}`);
  const data = await response.json();
  
  allTransactions = allTransactions.concat(data.transactions);
  
  hasMore = data.meta.next_page !== null;
  currentPage++;
}
```

---

## Catégories de transactions Qonto

- `restaurants_and_bars`
- `hotels_and_lodging`
- `transport`
- `gas_stations`
- `groceries_and_supermarkets`
- `office_supplies`
- `software_and_online_services`
- `advertising_and_marketing`
- `legal_and_accounting`
- `utilities`
- `insurance`
- `taxes_and_government`
- `other`

---

## Ressources

- [Documentation API Qonto](https://api-doc.qonto.com/)
- [Guide récupération identifiants API](https://help.qonto.com/fr/articles/4359692-comment-recuperer-mes-identifiants-api)
