import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  display_order: number;
}

export interface PaymentModality {
  id: string;
  payment_method_id: string;
  name: string;
  code: string;
  is_active: boolean;
  display_order: number;
}

export function usePaymentMethods() {
  const methodsQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async (): Promise<PaymentMethod[]> => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const modalitiesQuery = useQuery({
    queryKey: ['payment-modalities'],
    queryFn: async (): Promise<PaymentModality[]> => {
      const { data, error } = await supabase
        .from('payment_modalities')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const getModalitiesForMethod = (methodId: string) =>
    (modalitiesQuery.data || []).filter(m => m.payment_method_id === methodId);

  return {
    methods: methodsQuery.data || [],
    modalities: modalitiesQuery.data || [],
    getModalitiesForMethod,
    isLoading: methodsQuery.isLoading || modalitiesQuery.isLoading,
  };
}
