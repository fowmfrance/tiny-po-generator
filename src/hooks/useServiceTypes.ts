import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrentOrganizationId } from '@/utils/organization';

// Tables pas encore dans les types générés (migration manuelle Lovable Cloud)
const db = supabase as any;

export interface ExpenseFamily {
  id: string;
  name: string;
  description: string | null;
  is_pnl: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  accounting_code: string | null;
  default_expense_family_id: string | null;
  is_active: boolean;
  expense_family?: { id: string; name: string } | null;
}

export function useServiceTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const familiesQuery = useQuery({
    queryKey: ['expense-families'],
    queryFn: async (): Promise<ExpenseFamily[]> => {
      const { data, error } = await db
        .from('expense_families')
        .select('*')
        .order('sort_order')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const serviceTypesQuery = useQuery({
    queryKey: ['service-types'],
    queryFn: async (): Promise<ServiceType[]> => {
      const { data, error } = await db
        .from('service_types')
        .select('*, expense_family:expense_families(id, name)')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['expense-families'] });
    queryClient.invalidateQueries({ queryKey: ['service-types'] });
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  };

  const onError = (error: Error) =>
    toast({ title: 'Erreur', description: error.message, variant: 'destructive' });

  // RLS org : toujours fournir organization_id + user_id à l'insert
  const withOwner = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) throw new Error('Aucune organisation associée au profil.');
    return { user_id: user.id, organization_id: organizationId };
  };

  const createServiceType = useMutation({
    mutationFn: async (input: { name: string; description?: string; default_expense_family_id?: string | null; accounting_code?: string }) => {
      const owner = await withOwner();
      const { error } = await db.from('service_types').insert({ ...input, ...owner });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Type de prestation créé' }); },
    onError,
  });

  const updateServiceType = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceType> & { id: string }) => {
      delete (updates as any).expense_family;
      const { error } = await db.from('service_types').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Type de prestation mis à jour' }); },
    onError,
  });

  const createFamily = useMutation({
    mutationFn: async (input: { name: string; description?: string; is_pnl?: boolean }) => {
      const owner = await withOwner();
      const maxOrder = Math.max(0, ...(familiesQuery.data || []).map(f => f.sort_order));
      const { error } = await db.from('expense_families').insert({ ...input, sort_order: maxOrder + 1, ...owner });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Famille de dépenses créée' }); },
    onError,
  });

  const updateFamily = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExpenseFamily> & { id: string }) => {
      const { error } = await db.from('expense_families').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Famille de dépenses mise à jour' }); },
    onError,
  });

  return {
    families: familiesQuery.data || [],
    serviceTypes: serviceTypesQuery.data || [],
    isLoading: familiesQuery.isLoading || serviceTypesQuery.isLoading,
    createServiceType,
    updateServiceType,
    createFamily,
    updateFamily,
  };
}
