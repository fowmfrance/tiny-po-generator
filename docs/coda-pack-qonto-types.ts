/**
 * Types TypeScript pour l'intégration Qonto - Pack Coda
 * 
 * Ces types représentent les structures de données retournées par l'API Qonto v2
 * et peuvent servir de référence pour créer les schémas Coda.
 */

// ============================================
// ORGANISATION & COMPTES BANCAIRES
// ============================================

export interface Organization {
  slug: string;
  legal_name: string;
  bank_accounts: BankAccount[];
}

export interface BankAccount {
  /** Identifiant unique du compte (utilisé pour les requêtes) */
  slug: string;
  /** IBAN du compte */
  iban: string;
  /** Code BIC/SWIFT */
  bic: string;
  /** Nom du compte */
  name: string;
  /** Solde actuel en euros */
  balance: number;
  /** Solde en centimes */
  balance_cents: number;
  /** Devise (EUR) */
  currency: string;
  /** Solde autorisé (inclut les opérations en attente) */
  authorized_balance: number;
  authorized_balance_cents: number;
}

// ============================================
// TRANSACTIONS
// ============================================

export interface Transaction {
  /** UUID unique de la transaction */
  id: string;
  /** Date d'émission (ISO 8601) */
  emitted_at: string;
  /** Date de règlement (ISO 8601) */
  settled_at: string;
  /** Montant en devise principale */
  amount: number;
  /** Devise (EUR) */
  currency: string;
  /** Montant en devise locale (si différente) */
  local_amount?: number;
  /** Devise locale */
  local_currency?: string;
  /** Type: 'credit' (entrée) ou 'debit' (sortie) */
  side: 'credit' | 'debit';
  /** Type d'opération */
  operation_type?: OperationType;
  /** Libellé de la transaction */
  label: string;
  /** Statut de la transaction */
  status: TransactionStatus;
  /** Note ajoutée par l'utilisateur */
  note?: string;
  /** Référence de paiement */
  reference?: string;
  /** Montant TVA */
  vat_amount?: number;
  /** Taux TVA (ex: 20.0) */
  vat_rate?: number;
  /** UUID de l'initiateur (membre de l'équipe) */
  initiator_id?: string;
  /** 4 derniers chiffres de la carte (si paiement carte) */
  card_last_digits?: string;
  /** Catégorie Qonto */
  category?: TransactionCategory;
  /** IDs des pièces jointes */
  attachment_ids?: string[];
}

export type TransactionStatus = 
  | 'pending'    // En attente
  | 'declined'   // Refusée
  | 'completed'; // Terminée

export type OperationType = 
  | 'card'           // Paiement carte
  | 'transfer'       // Virement
  | 'direct_debit'   // Prélèvement
  | 'cheque'         // Chèque
  | 'qonto_fee'      // Frais Qonto
  | 'income'         // Revenu
  | 'swift_income'   // Virement SWIFT entrant
  | 'swift_outgoing' // Virement SWIFT sortant
  | 'recall';        // Rappel

export type TransactionCategory =
  | 'restaurants_and_bars'
  | 'hotels_and_lodging'
  | 'transport'
  | 'gas_stations'
  | 'groceries_and_supermarkets'
  | 'office_supplies'
  | 'software_and_online_services'
  | 'advertising_and_marketing'
  | 'legal_and_accounting'
  | 'utilities'
  | 'insurance'
  | 'taxes_and_government'
  | 'other';

// ============================================
// PARAMÈTRES DE REQUÊTE
// ============================================

export interface TransactionQueryParams {
  /** Slug du compte bancaire (obligatoire) */
  slug: string;
  /** Nombre de résultats par page (max 100) */
  per_page?: number;
  /** Page courante */
  current_page?: number;
  /** Date de début (YYYY-MM-DD) */
  settled_at_from?: string;
  /** Date de fin (YYYY-MM-DD) */
  settled_at_to?: string;
  /** Filtrer par statut */
  status?: TransactionStatus;
  /** Filtrer par type (credit/debit) */
  side?: 'credit' | 'debit';
}

// ============================================
// RÉPONSES API
// ============================================

export interface OrganizationResponse {
  organization: Organization;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  next_page: number | null;
  prev_page: number | null;
  total_pages: number;
  total_count: number;
  per_page: number;
}

// ============================================
// FACTURES CLIENT
// ============================================

export interface ClientInvoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  client: {
    name: string;
    email?: string;
  };
}

export interface ClientInvoicesResponse {
  client_invoices: ClientInvoice[];
}

// ============================================
// MEMBRES D'ÉQUIPE
// ============================================

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'employee' | 'accountant';
}

export interface MembersResponse {
  members: Member[];
}

// ============================================
// LABELS / ÉTIQUETTES
// ============================================

export interface Label {
  id: string;
  name: string;
  parent_id?: string;
}

export interface LabelsResponse {
  labels: Label[];
}

// ============================================
// ERREURS API
// ============================================

export interface QontoError {
  errors: Array<{
    code: 'unauthorized' | 'not_found' | 'rate_limited' | 'validation_error';
    detail: string;
  }>;
}

// ============================================
// CONFIGURATION AUTHENTIFICATION
// ============================================

/**
 * Format du header Authorization pour Qonto
 * 
 * @example
 * const authHeader = `${login}:${secretKey}`;
 * // Résultat: "mon-login-api:ma-cle-secrete"
 */
export interface QontoCredentials {
  /** Login API Qonto (disponible dans les paramètres Qonto) */
  login: string;
  /** Clé secrète API */
  secretKey: string;
}

// ============================================
// HELPERS POUR CODA
// ============================================

/**
 * Exemple de mapping transaction Qonto -> Coda
 */
export const mapTransactionForCoda = (tx: Transaction) => ({
  id: tx.id,
  emittedAt: tx.emitted_at,
  settledAt: tx.settled_at,
  amount: tx.side === 'debit' ? -tx.amount : tx.amount,
  currency: tx.currency,
  side: tx.side,
  operationType: tx.operation_type || 'unknown',
  label: tx.label,
  status: tx.status,
  note: tx.note || '',
  reference: tx.reference || '',
  category: tx.category || 'other',
  vatAmount: tx.vat_amount || 0,
  vatRate: tx.vat_rate || 0,
  cardLastDigits: tx.card_last_digits || '',
});

/**
 * URLs de l'API Qonto
 */
export const QONTO_API = {
  BASE_URL: 'https://thirdparty.qonto.com/v2',
  ENDPOINTS: {
    ORGANIZATION: '/organization',
    TRANSACTIONS: '/transactions',
    CLIENT_INVOICES: '/client_invoices',
    MEMBERS: '/members',
    LABELS: '/labels',
  },
} as const;
