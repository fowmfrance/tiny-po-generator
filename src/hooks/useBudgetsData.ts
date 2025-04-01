
import { useState } from 'react';
import { Budget } from '@/models/Budget';

export function useBudgetsData() {
  // Mock budget list
  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: '1',
      code: 'PRJ-2023-001',
      name: 'Budget Projet Alpha',
      currency: 'EUR',
      initialAmount: 100000,
      sentAmount: 75000,     // New: Total BC sent
      remainingAmount: 20000, // Updated: BC sent without received invoices
      receivedAmount: 55000,  // BC sent with received invoices
      availableAmount: 25000, // New: initialAmount - sentAmount
      type: 'Project',
      poCount: 12,
      createdAt: new Date(),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      recognitionType: 'linear',
    },
    {
      id: '2',
      code: 'GA-2023-002',
      name: 'Frais G&A Q3',
      currency: 'EUR',
      initialAmount: 50000,
      sentAmount: 35000,      // New: Total BC sent
      remainingAmount: 8000,  // Updated: BC sent without received invoices
      receivedAmount: 27000,  // BC sent with received invoices
      availableAmount: 15000, // New: initialAmount - sentAmount
      type: 'G&A',
      poCount: 8,
      createdAt: new Date(),
      startDate: new Date('2023-07-01'),
      endDate: new Date('2023-09-30'),
      recognitionType: 'completion',
      completionPercentage: 65,
    },
    {
      id: '3',
      code: 'PRJ-2023-003',
      name: 'Budget Projet Beta',
      currency: 'GBP',
      initialAmount: 75000,
      sentAmount: 15000,      // New: Total BC sent
      remainingAmount: 0,     // Updated: BC sent without received invoices
      receivedAmount: 15000,  // BC sent with received invoices
      availableAmount: 60000, // New: initialAmount - sentAmount
      type: 'Project',
      poCount: 5,
      createdAt: new Date(),
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-05-31'),
      recognitionType: 'linear',
    },
  ]);

  return { budgets, setBudgets };
}
