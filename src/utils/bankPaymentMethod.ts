// Dérive le mode de paiement Sapajoo depuis le type d'opération Qonto.
// Pas de colonne en base : calcul pur à partir de transactions.qonto_operation_type.

export type BankPaymentMethod =
  | 'CB'
  | 'Virement'
  | 'Prélèvement'
  | 'Encaissement'
  | 'Chèque'
  | 'Autre';

export function derivePaymentMethod(operationType?: string | null): BankPaymentMethod {
  switch ((operationType || '').toLowerCase()) {
    case 'card':
      return 'CB';
    case 'transfer':
    case 'wire_transfer':
    case 'swift_transfer':
      return 'Virement';
    case 'direct_debit':
      return 'Prélèvement';
    case 'income':
    case 'swift_income':
      return 'Encaissement';
    case 'cheque':
    case 'check':
      return 'Chèque';
    default:
      return 'Autre';
  }
}

// Classes Tailwind par mode (cohérentes avec les badges de statut existants).
export const paymentMethodBadgeClass: Record<BankPaymentMethod, string> = {
  CB: 'bg-blue-50 text-blue-700 border border-blue-100',
  Virement: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  Prélèvement: 'bg-amber-50 text-amber-700 border border-amber-100',
  Encaissement: 'bg-slate-100 text-slate-600 border border-slate-200',
  Chèque: 'bg-violet-50 text-violet-700 border border-violet-100',
  Autre: 'bg-slate-100 text-slate-600 border border-slate-200',
};
