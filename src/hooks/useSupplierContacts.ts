import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierContact {
  id: string;
  supplier_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSupplierContacts(supplierId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['supplier-contacts', supplierId],
    enabled: !!supplierId,
    queryFn: async (): Promise<SupplierContact[]> => {
      const { data, error } = await supabase
        .from('supplier_contacts')
        .select('*')
        .eq('supplier_id', supplierId!)
        .order('is_primary', { ascending: false })
        .order('last_name');
      if (error) throw error;
      return (data || []) as SupplierContact[];
    },
  });

  const createContact = useMutation({
    mutationFn: async (contact: Omit<SupplierContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('supplier_contacts')
        .insert({ ...contact, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-contacts', supplierId] });
      toast({ title: 'Contact ajouté' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('supplier_contacts')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-contacts', supplierId] });
      toast({ title: 'Contact mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('supplier_contacts')
        .delete()
        .eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-contacts', supplierId] });
      toast({ title: 'Contact supprimé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    contacts: query.data || [],
    isLoading: query.isLoading,
    createContact,
    updateContact,
    deleteContact,
  };
}
