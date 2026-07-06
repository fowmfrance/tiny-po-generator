import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useOrganization() {
  return useQuery({
    queryKey: ['current-organization'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data?.organization_id ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
