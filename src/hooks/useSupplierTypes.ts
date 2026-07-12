import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierType {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

/**
 * Liste des activités / métiers fournisseurs (table `supplier_types`).
 * Org-scopé par la RLS (comme les autres écrans qui consomment supplier_types).
 * ⚠ Les types sont seedés par utilisateur à l'inscription → une org sans types
 * personnalisés n'affichera que les défauts (voir handoff / diag SQL).
 */
export function useSupplierTypes() {
  const query = useQuery({
    queryKey: ['supplier_types'],
    queryFn: async (): Promise<SupplierType[]> => {
      const { data, error } = await supabase
        .from('supplier_types')
        .select('id, name, color, icon')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as SupplierType[];
    },
  });

  return {
    supplierTypes: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
