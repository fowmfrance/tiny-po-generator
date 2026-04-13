import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_id: string | null;
  specialty: string | null;
  supplier_type_id: string | null;
  has_negotiated_rates: boolean;
  business_volume: number;
  is_active: boolean;
  kyc_level_id: string | null;
  kyc_status: string;
  created_at: string;
  updated_at: string;
  // Joined
  supplier_type?: { id: string; name: string; color: string | null; icon: string | null } | null;
  // Computed
  average_rating?: number;
  total_ratings?: number;
  po_count?: number;
}

export function useSuppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get suppliers with type
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select(`
          *,
          supplier_type:supplier_types(id, name, color, icon)
        `)
        .order('name');

      if (error) throw error;

      // Get ratings aggregated
      const { data: ratings } = await supabase
        .from('supplier_ratings')
        .select('supplier_id, rating');

      // Get PO counts
      const { data: pos } = await supabase
        .from('purchase_orders')
        .select('supplier_id');

      const ratingMap = new Map<string, { sum: number; count: number }>();
      (ratings || []).forEach((r: any) => {
        const existing = ratingMap.get(r.supplier_id) || { sum: 0, count: 0 };
        existing.sum += r.rating;
        existing.count += 1;
        ratingMap.set(r.supplier_id, existing);
      });

      const poCountMap = new Map<string, number>();
      (pos || []).forEach((p: any) => {
        poCountMap.set(p.supplier_id, (poCountMap.get(p.supplier_id) || 0) + 1);
      });

      return (suppliers || []).map((s: any) => ({
        ...s,
        has_negotiated_rates: s.has_negotiated_rates || false,
        business_volume: Number(s.business_volume) || 0,
        average_rating: ratingMap.has(s.id) 
          ? ratingMap.get(s.id)!.sum / ratingMap.get(s.id)!.count 
          : 0,
        total_ratings: ratingMap.get(s.id)?.count || 0,
        po_count: poCountMap.get(s.id) || 0,
      }));
    },
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: {
      name: string;
      email: string;
      phone?: string;
      address?: string;
      city?: string;
      country?: string;
      specialty?: string;
      supplier_type_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('suppliers')
        .insert({ ...supplier, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Send welcome email (best-effort)
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'supplier-welcome',
            recipientEmail: data.email,
            idempotencyKey: `supplier-welcome-${data.id}`,
            templateData: { supplierName: data.name },
          },
        });
      } catch {
        // Non-blocking
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Fournisseur créé', description: 'Le fournisseur a été ajouté avec succès.' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Fournisseur mis à jour', description: 'Les modifications ont été enregistrées.' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    suppliers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createSupplier,
    updateSupplier,
  };
}
