import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrentOrganizationId } from '@/utils/organization';

export interface Client {
  id: string;
  name: string;
  organization_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      // RLS scope déjà par organisation
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as Client[];
    },
  });

  const createClient = useMutation({
    mutationFn: async (client: { name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // ⚠ RLS : organization_id NOT NULL + policy organization_id = current_user_organization_id()
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');

      const { data, error } = await supabase
        .from('clients')
        .insert({ name: client.name, user_id: user.id, organization_id: organizationId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    clients: query.data ?? [],
    isLoading: query.isLoading,
    createClient,
    refetch: query.refetch,
  };
}
