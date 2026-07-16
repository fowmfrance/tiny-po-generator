import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type BudgetAmountField = 'initial_amount' | 'resale_price';

export interface BudgetAmountChange {
  id: string;
  budget_id: string;
  field: BudgetAmountField;
  old_value: number | null;
  new_value: number | null;
  delta: number | null;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
}

export function useBudgetAmountHistory(budgetId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const history = useQuery({
    queryKey: ['budget-amount-history', budgetId],
    enabled: !!budgetId,
    queryFn: async (): Promise<BudgetAmountChange[]> => {
      // budget_amount_changes pas encore dans les types générés (migration SQL manuelle)
      const { data, error } = await (supabase as any)
        .from('budget_amount_changes')
        .select('id, budget_id, field, old_value, new_value, delta, reason, changed_by, created_at')
        .eq('budget_id', budgetId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BudgetAmountChange[];
    },
  });

  const change = useMutation({
    mutationFn: async (input: { field: BudgetAmountField; newValue: number; reason: string }) => {
      const { error } = await (supabase.rpc as any)('change_budget_amount', {
        _budget_id: budgetId,
        _field: input.field,
        _new_value: input.newValue,
        _reason: input.reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-amount-history', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budget-details', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Montant mis à jour' });
    },
    onError: (e: Error) => toast({ title: 'Refusé', description: e.message, variant: 'destructive' }),
  });

  return { history: history.data || [], isLoading: history.isLoading, change };
}
