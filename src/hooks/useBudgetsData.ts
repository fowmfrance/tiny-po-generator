import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Budget, BudgetMilestone } from '@/models/Budget';
import { BudgetCurrency } from '@/services/budgetService';

export function useBudgetsData() {
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user ?? null;
    },
    staleTime: 60_000,
  });

  const {
    data: budgets = [],
    isLoading: isBudgetsLoading,
    error: budgetsError,
    refetch,
  } = useQuery({
    queryKey: ['budgets', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('budgets')
        .select(
          `
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
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validateCurrency = (currency: string): BudgetCurrency => {
        if (currency === 'EUR' || currency === 'USD' || currency === 'GBP') return currency;
        return 'EUR';
      };

      const transformedBudgets: Budget[] = (data || []).map((budget) => {
        const milestones: BudgetMilestone[] = (budget.budget_milestones || []).map(
          (m: {
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
          })
        );

        return {
          id: budget.id,
          code: budget.code,
          name: budget.name,
          currency: validateCurrency(budget.currency),
          initialAmount: Number(budget.initial_amount),
          sentAmount: 0,
          remainingAmount: Number(budget.initial_amount),
          receivedAmount: 0,
          availableAmount: Number(budget.initial_amount),
          type:
            budget.budget_type_id === 'project'
              ? 'Project'
              : budget.budget_type_id === 'ga'
                ? 'G&A'
                : budget.budget_type_id,
          poCount: 0,
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

  return {
    budgets,
    isLoading: isUserLoading || isBudgetsLoading,
    error: userError || budgetsError,
    user,
    refetch,
  };
}

