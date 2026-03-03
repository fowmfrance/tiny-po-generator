import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type POStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'sent' | 'matched' | 'paid';

export interface PurchaseOrder {
  id: string;
  user_id: string;
  budget_id: string | null;
  supplier_id: string;
  po_number: string;
  currency: string;
  total_amount: number;
  status: POStatus;
  notes: string | null;
  expected_delivery_date: string | null;
  sent_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  supplier?: { id: string; name: string; email: string } | null;
  budget?: { id: string; name: string; code: string } | null;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  article_type_id: string | null;
  created_at: string;
}

export function usePurchaseOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name, email),
          budget:budgets(id, name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PurchaseOrder[];
    },
  });

  const createPO = useMutation({
    mutationFn: async (params: {
      budget_id?: string;
      supplier_id: string;
      po_number: string;
      currency: string;
      notes?: string;
      expected_delivery_date?: string;
      items: { description: string; quantity: number; unit_price: number; article_type_id?: string }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const total_amount = params.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          user_id: user.id,
          budget_id: params.budget_id || null,
          supplier_id: params.supplier_id,
          po_number: params.po_number,
          currency: params.currency,
          total_amount,
          notes: params.notes || null,
          expected_delivery_date: params.expected_delivery_date || null,
          status: 'draft',
        })
        .select()
        .single();

      if (poError) throw poError;

      // Insert items
      if (params.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(
            params.items.map(item => ({
              purchase_order_id: po.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              article_type_id: item.article_type_id || null,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast({ title: 'Bon de commande créé', description: 'Le bon de commande a été créé avec succès.' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updatePOStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: POStatus }) => {
      const updates: any = { status };
      if (status === 'approved') {
        const { data: { user } } = await supabase.auth.getUser();
        updates.approved_at = new Date().toISOString();
        updates.approved_by = user?.id;
      }
      if (status === 'sent') {
        updates.sent_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast({ title: 'Statut mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    purchaseOrders: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createPO,
    updatePOStatus,
  };
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['purchase-order', id],
    enabled: !!id,
    queryFn: async (): Promise<PurchaseOrder | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name, email),
          budget:budgets(id, name, code)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get items
      const { data: items, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('purchase_order_id', id)
        .order('created_at');

      if (itemsError) throw itemsError;

      return { ...(data as unknown as PurchaseOrder), items: items || [] };
    },
  });
}
