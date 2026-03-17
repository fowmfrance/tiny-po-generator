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

      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, name, is_active')
        .eq('id', params.supplier_id)
        .eq('user_id', user.id)
        .single();

      if (supplierError || !supplier) {
        throw new Error('Fournisseur introuvable.');
      }

      const isKycPending = supplier.is_active === false;

      if (params.budget_id) {
        const { data: budget, error: budgetError } = await supabase
          .from('budgets')
          .select('id, name, initial_amount, currency')
          .eq('id', params.budget_id)
          .eq('user_id', user.id)
          .single();

        if (budgetError || !budget) {
          throw new Error('Budget introuvable.');
        }

        if (budget.currency !== params.currency) {
          throw new Error(`La devise du BC doit correspondre à celle du budget (${budget.currency}).`);
        }

        const { data: committedPOs, error: committedError } = await supabase
          .from('purchase_orders')
          .select('total_amount, status')
          .eq('budget_id', params.budget_id)
          .eq('user_id', user.id)
          .neq('status', 'rejected');

        if (committedError) throw committedError;

        const alreadyCommitted = (committedPOs || []).reduce(
          (sum, po) => sum + Number(po.total_amount || 0),
          0
        );
        const availableBudget = Number(budget.initial_amount) - alreadyCommitted;

        if (total_amount > availableBudget) {
          throw new Error(
            `Montant insuffisant sur le budget "${budget.name}". Disponible: ${availableBudget.toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${budget.currency}.`
          );
        }
      }

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

      return { ...po, isKycPending };
    },
    onSuccess: (po) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });

      if ((po as any)?.isKycPending) {
        toast({
          title: 'Bon de commande créé en brouillon',
          description: 'Le fournisseur n’a pas finalisé son KYC. Le BC reste en brouillon.',
        });
        return;
      }

      toast({ title: 'Bon de commande créé', description: 'Le bon de commande a été créé avec succès.' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updatePOStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: POStatus }) => {
      if (status !== 'draft') {
        const { data: poRef, error: poRefError } = await supabase
          .from('purchase_orders')
          .select('supplier_id')
          .eq('id', id)
          .single();

        if (poRefError || !poRef) throw new Error('Bon de commande introuvable.');

        const { data: supplier, error: supplierError } = await supabase
          .from('suppliers')
          .select('is_active')
          .eq('id', poRef.supplier_id)
          .single();

        if (supplierError || !supplier) throw new Error('Fournisseur introuvable.');
        if (!supplier.is_active) {
          throw new Error('KYC fournisseur incomplet: le bon de commande doit rester en brouillon.');
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Statut mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deletePO = useMutation({
    mutationFn: async (id: string) => {
      // Verify PO is deletable (not sent/matched/paid)
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .select('status')
        .eq('id', id)
        .single();

      if (poError || !po) throw new Error('Bon de commande introuvable.');
      if (['sent', 'matched', 'paid'].includes(po.status)) {
        throw new Error('Impossible d\'annuler un bon de commande déjà envoyé.');
      }

      // Delete items first
      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', id);

      if (itemsError) throw itemsError;

      // Delete PO
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Bon de commande annulé', description: 'Le budget a été libéré.' });
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
    deletePO,
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
