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

      const [budgetsRes, purchaseOrdersRes] = await Promise.all([
        supabase
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
            ),
            clients (
              id,
              name
            )
          `
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('purchase_orders')
          .select('id, budget_id, total_amount, status')
          .eq('user_id', user.id)
          .not('budget_id', 'is', null),
      ]);

      if (budgetsRes.error) throw budgetsRes.error;
      if (purchaseOrdersRes.error) throw purchaseOrdersRes.error;

      const budgetsData = budgetsRes.data || [];
      const poData = purchaseOrdersRes.data || [];

      const poBudgetMap = new Map<string, string>();
      const poMetricsByBudget = new Map<string, { sent: number; poCount: number; poIds: string[] }>();

      for (const po of poData) {
        if (!po.budget_id) continue;
        const budgetId = po.budget_id;
        const existing = poMetricsByBudget.get(budgetId) || { sent: 0, poCount: 0, poIds: [] };

        existing.poCount += 1;
        existing.poIds.push(po.id);
        poBudgetMap.set(po.id, budgetId);

        if (po.status !== 'rejected') {
          existing.sent += Number(po.total_amount || 0);
        }

        poMetricsByBudget.set(budgetId, existing);
      }

      const allPoIds = Array.from(poBudgetMap.keys());
      const receivedByBudget = new Map<string, number>();

      if (allPoIds.length > 0) {
        const { data: invoices, error: invoicesError } = await supabase
          .from('supplier_invoices')
          .select('purchase_order_id, amount, status')
          .in('purchase_order_id', allPoIds)
          .neq('status', 'rejected');

        if (invoicesError) throw invoicesError;

        for (const invoice of invoices || []) {
          if (!invoice.purchase_order_id) continue;
          const budgetId = poBudgetMap.get(invoice.purchase_order_id);
          if (!budgetId) continue;

          receivedByBudget.set(
            budgetId,
            (receivedByBudget.get(budgetId) || 0) + Number(invoice.amount || 0)
          );
        }
      }

      const validateCurrency = (currency: string): BudgetCurrency => {
        if (currency === 'EUR' || currency === 'USD' || currency === 'GBP') return currency;
        return 'EUR';
      };

      const transformedBudgets: Budget[] = budgetsData.map((budget) => {
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

        const initialAmount = Number(budget.initial_amount || 0);
        const metrics = poMetricsByBudget.get(budget.id) || { sent: 0, poCount: 0, poIds: [] };
        const sentAmount = Number(metrics.sent || 0);
        const receivedAmount = Number(receivedByBudget.get(budget.id) || 0);
        const remainingAmount = Math.max(0, sentAmount - receivedAmount);
        const availableAmount = initialAmount - sentAmount;

        return {
          id: budget.id,
          code: budget.code,
          name: budget.name,
          currency: validateCurrency(budget.currency),
          initialAmount,
          sentAmount,
          remainingAmount,
          receivedAmount,
          availableAmount,
          type:
            budget.budget_type_id === 'project'
              ? 'Project'
              : budget.budget_type_id === 'ga'
                ? 'G&A'
                : budget.budget_type_id,
          poCount: metrics.poCount,
          createdAt: new Date(budget.created_at),
          startDate: budget.start_date ? new Date(budget.start_date) : null,
          endDate: budget.end_date ? new Date(budget.end_date) : null,
          recognitionType: budget.recognition_method_id || 'linear',
          resalePrice: budget.resale_price ? Number(budget.resale_price) : undefined,
          status: budget.status,
          milestones,
          completionPercentage: Number(budget.completion_percentage || 0),
          clientId: budget.client_id || null,
          clientName: (budget as any).clients?.name || null,
          projectManagerId: budget.project_manager_id || null,
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
