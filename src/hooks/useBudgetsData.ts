import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Budget, BudgetMilestone } from '@/models/Budget';
import { BudgetCurrency } from '@/services/budgetService';

export function useBudgetsData() {
  const { data: budgets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('[useBudgetsData] Auth check:', { user: user?.id, authError });
      
      if (!user) {
        console.log('[useBudgetsData] No user found, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          budget_milestones (
            id,
            title,
            description,
            target_date,
            completed_date,
            completion_percentage,
            is_completed,
            order_index
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('[useBudgetsData] Query result:', { data, error, userId: user.id });

      if (error) {
        console.error('[useBudgetsData] Error fetching budgets:', error);
        throw error;
      }

      // Helper to validate currency
      const validateCurrency = (currency: string): BudgetCurrency => {
        if (currency === 'EUR' || currency === 'USD' || currency === 'GBP') {
          return currency;
        }
        return 'EUR'; // Default fallback
      };

      // Transform data to match Budget interface
      const transformedBudgets: Budget[] = (data || []).map((budget) => {
        const milestones: BudgetMilestone[] = (budget.budget_milestones || []).map((m: {
          id: string;
          title: string;
          description: string | null;
          target_date: string;
          completed_date: string | null;
          completion_percentage: number;
          is_completed: boolean;
          order_index: number;
        }) => ({
          id: m.id,
          title: m.title,
          description: m.description || '',
          targetDate: new Date(m.target_date),
          completedDate: m.completed_date ? new Date(m.completed_date) : undefined,
          completionPercentage: m.completion_percentage,
          isCompleted: m.is_completed,
          orderIndex: m.order_index,
        }));

        return {
          id: budget.id,
          code: budget.code,
          name: budget.name,
          currency: validateCurrency(budget.currency),
          initialAmount: Number(budget.initial_amount),
          sentAmount: 0, // TODO: Calculate from POs
          remainingAmount: Number(budget.initial_amount), // TODO: Calculate from POs
          receivedAmount: 0, // TODO: Calculate from invoices
          availableAmount: Number(budget.initial_amount), // TODO: Calculate from POs
          type: budget.budget_type_id === 'project' ? 'Project' : budget.budget_type_id === 'ga' ? 'G&A' : budget.budget_type_id,
          poCount: 0, // TODO: Calculate from POs
          createdAt: new Date(budget.created_at),
          startDate: budget.start_date ? new Date(budget.start_date) : null,
          endDate: budget.end_date ? new Date(budget.end_date) : null,
          recognitionType: budget.recognition_method_id || 'linear',
          resalePrice: budget.resale_price ? Number(budget.resale_price) : undefined,
          status: budget.status,
          milestones,
        };
      });

      return transformedBudgets;
    },
  });

  return { budgets, isLoading, error, refetch };
}
