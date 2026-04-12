
import { BudgetCurrency, BudgetRecognitionType } from '@/services/budgetService';

export interface BudgetMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  completionPercentage: number;
  isCompleted: boolean;
  orderIndex: number;
  supplierId?: string | null;
  supplierName?: string;
  supplierTypeId?: string | null;
  supplierTypeIdOriginal?: string | null;
  articleTypeId?: string | null;
  assignmentStatus?: 'pending' | 'assigned' | 'confirmed';
}

export type MilestoneMode = 'global' | 'per_supplier';

export interface Budget {
  id: string;
  code: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  remainingAmount: number;  // BC envoyés mais factures en attente de réception
  receivedAmount: number;   // BC envoyés et factures reçues
  sentAmount: number;       // Somme des BC envoyés (all POs)
  availableAmount: number;  // initialAmount - sentAmount
  type: 'Project' | 'G&A' | string;
  poCount: number;
  createdAt: Date;
  startDate?: Date | null;
  endDate?: Date | null;
  recognitionType: BudgetRecognitionType | string;
  completionPercentage?: number;
  resalePrice?: number;
  status?: string;
  milestones?: BudgetMilestone[];
  milestoneMode?: MilestoneMode;
  clientId?: string | null;
  clientName?: string | null;
  projectManagerId?: string | null;
}
