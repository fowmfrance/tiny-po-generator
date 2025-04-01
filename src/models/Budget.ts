
import { BudgetCurrency, BudgetRecognitionType } from '@/services/budgetService';

export interface Budget {
  id: string;
  code: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  remainingAmount: number;
  receivedAmount: number;
  type: 'Project' | 'G&A';
  poCount: number;
  createdAt: Date;
  startDate: Date | null;
  endDate: Date | null;
  recognitionType: BudgetRecognitionType;
  completionPercentage?: number;
}
