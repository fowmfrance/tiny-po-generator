import { BudgetCurrency } from '@/services/budgetService';

export const EXPENSE_TYPES = [
  { 
    id: 'supplier_invoices', 
    label: 'FACTURES FOURNISSEURS', 
    description: 'Prestations de services avec bon de commande et paiement différé' 
  },
  { 
    id: 'card_purchases', 
    label: 'ACHATS CARTE BANCAIRE', 
    description: 'Dépenses immédiates par CB professionnelle avec justificatif direct' 
  },
  { 
    id: 'recurring_debits', 
    label: 'PRÉLÈVEMENTS RÉCURRENTS', 
    description: 'Abonnements et charges automatiques avec mandat SEPA' 
  },
];

export const BUDGET_TYPES = [
  { id: 'project', name: 'Projet', poFormat: 'PRJ-{YYYY}-{NNN}', currentSequence: 42 },
  { id: 'ga', name: 'Frais généraux', poFormat: 'GA-{YYYY}-{NNN}', currentSequence: 15 },
  { id: 'capex', name: 'CAPEX', poFormat: 'CPX-{YYYY}-{NNN}', currentSequence: 8 },
];

export const MILESTONE_METHOD_CODE = 'poc_milestone';

export interface FormValues {
  budgetTypeId: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  resalePrice: number;
  startDate: string;
  endDate: string;
  recognitionMethodId: string;
  expenseTypes: string[];
}

export const formatBudgetCode = (format: string, sequence: number): string => {
  const year = new Date().getFullYear().toString();
  const paddedSequence = (sequence + 1).toString().padStart(3, '0');
  return format
    .replace('{YYYY}', year)
    .replace('{NNN}', paddedSequence);
};
