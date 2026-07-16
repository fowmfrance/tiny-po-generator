import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SupplierInvoice, InvoiceWithPaymentStatus } from '@/types/payment';
import { enrichInvoiceWithStatus } from '@/utils/paymentUtils';
import { useToast } from '@/hooks/use-toast';
import { getCurrentOrganizationId } from '@/utils/organization';

export function useSupplierInvoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['supplier-invoices'],
    queryFn: async (): Promise<InvoiceWithPaymentStatus[]> => {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .select(`
          *,
          supplier:suppliers(id, name, email),
          invoice_purchase_orders(
            amount_allocated,
            purchase_order:purchase_orders(id, po_number, total_amount)
          )
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return (data || []).map((invoice: any) => {
        const enriched = enrichInvoiceWithStatus(invoice);
        const links = invoice.invoice_purchase_orders || [];
        // Sum of linked PO totals (HT)
        const po_total_ht = links.reduce(
          (sum: number, l: any) => sum + Number(l.purchase_order?.total_amount || 0),
          0
        );
        return { ...enriched, po_total_ht, linked_pos: links };
      });
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: Omit<SupplierInvoice, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');

      const { data, error } = await supabase
        .from('supplier_invoices')
        .insert({
          ...invoice,
          user_id: user.id,
          organization_id: organizationId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      toast({
        title: 'Facture créée',
        description: 'La facture a été ajoutée avec succès.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de créer la facture: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierInvoice> & { id: string }) => {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      toast({
        title: 'Facture mise à jour',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de mettre à jour la facture: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      const { error } = await supabase
        .from('supplier_invoices')
        .update({ 
          paid_date: new Date().toISOString().split('T')[0],
          status: 'paid' 
        })
        .in('id', invoiceIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      toast({
        title: 'Factures payées',
        description: 'Les factures ont été marquées comme payées.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de marquer les factures comme payées: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    invoices: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createInvoice,
    updateInvoice,
    markAsPaid,
  };
}
