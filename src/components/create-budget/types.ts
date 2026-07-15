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
  { id: 'project', name: 'Projet', poFormat: 'PR{YY}-{NNN}', currentSequence: 0 },
  { id: 'ga', name: 'Frais généraux', poFormat: 'GA{YY}-{NNN}', currentSequence: 0 },
  { id: 'capex', name: 'CAPEX', poFormat: 'CX{YY}-{NNN}', currentSequence: 0 },
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
  const shortYear = year.slice(-2);
  const paddedSequence = (sequence + 1).toString().padStart(3, '0'); // {NNN} = 3 chiffres (PR26-001)
  return format
    .replace('{YYYY}', year)
    .replace('{YY}', shortYear)
    .replace('{NNN}', paddedSequence);
};
