import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentOrganizationId } from '@/utils/organization';
import { useToast } from '@/hooks/use-toast';

export type PartialPaymentStatus = 'prepared' | 'ordered' | 'paid' | 'cancelled';

export interface InvoicePartialPayment {
  id: string;
  batch_id: string;
  invoice_id: string;
  amount_paid: number;
  status: PartialPaymentStatus;
  bank_payment_date: string | null;
  value_date: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  note: string | null;
  created_at: string;
}

export const MAX_PARTIAL_PAYMENTS = 5;

/**
 * Paiements partiels d'une facture (adossés à payment_batch_invoices).
 * `invoiceTtc` = montant TTC de la facture (supplier_invoices.amount, convention app).
 */
export function useInvoicePayments(invoiceId: string | undefined, invoiceTtc: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['invoice-payments', invoiceId],
    enabled: !!invoiceId,
    queryFn: async (): Promise<InvoicePartialPayment[]> => {
      const { data, error } = await supabase
        .from('payment_batch_invoices')
        .select('id, batch_id, invoice_id, amount_paid, status, bank_payment_date, value_date, payment_method, transaction_id, note, created_at')
        .eq('invoice_id', invoiceId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as InvoicePartialPayment[];
    },
  });

  const payments = (query.data || []).filter(p => p.status !== 'cancelled');
  const paid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount_paid || 0), 0);
  const pending = payments.filter(p => p.status === 'prepared' || p.status === 'ordered').reduce((s, p) => s + Number(p.amount_paid || 0), 0);
  const balance = Math.max(0, Number(invoiceTtc || 0) - paid - pending);
  const remainingToPay = Math.max(0, Number(invoiceTtc || 0) - paid);
  const canAdd = payments.length < MAX_PARTIAL_PAYMENTS && remainingToPay > 0.005;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoiceId] });
    queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  /** Enregistre un paiement partiel. Un lot (payment_batch) = un événement de paiement. */
  const addPayment = useMutation({
    mutationFn: async (input: {
      amount: number;
      status: PartialPaymentStatus; // 'paid' (déjà réglé) ou 'prepared' (à ordonner)
      bankPaymentDate?: string | null;
      valueDate?: string | null;
      paymentMethod?: string | null;
      transactionId?: string | null;
      note?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');
      if (input.amount <= 0) throw new Error('Le montant doit être positif.');
      if (input.amount > remainingToPay + 0.005) {
        throw new Error(`Montant supérieur au reste à régler (${remainingToPay.toFixed(2)}).`);
      }

      const ts = new Date().toISOString();
      const ref = `PAY-${ts.slice(0, 10)}-${Math.floor(Number(ts.slice(11, 13) + ts.slice(14, 16) + ts.slice(17, 19)))}`;

      const { data: batch, error: batchErr } = await supabase
        .from('payment_batches')
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          batch_reference: ref,
          currency: 'EUR',
          total_amount: input.amount,
          invoice_count: 1,
          status: input.status === 'paid' ? 'executed' : 'draft',
        })
        .select('id')
        .single();
      if (batchErr) throw batchErr;

      const { error: lineErr } = await supabase
        .from('payment_batch_invoices')
        .insert({
          batch_id: batch.id,
          invoice_id: invoiceId,
          organization_id: organizationId,
          amount_paid: input.amount,
          status: input.status,
          bank_payment_date: input.status === 'paid' ? (input.bankPaymentDate || null) : null,
          value_date: input.valueDate || null,
          payment_method: input.paymentMethod || null,
          transaction_id: input.transactionId || null,
          note: input.note || null,
        });
      if (lineErr) throw lineErr;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Paiement enregistré' });
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  /** Rapprochement : passe un paiement préparé/ordonné à 'payé' avec sa date banque. */
  const settlePayment = useMutation({
    mutationFn: async (input: { id: string; bankPaymentDate: string; transactionId?: string | null }) => {
      const { error } = await supabase
        .from('payment_batch_invoices')
        .update({ status: 'paid', bank_payment_date: input.bankPaymentDate, transaction_id: input.transactionId || null })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Paiement rapproché' }); },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const cancelPayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_batch_invoices')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Paiement annulé' }); },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return {
    payments,
    isLoading: query.isLoading,
    paid,
    pending,
    balance,
    remainingToPay,
    canAdd,
    count: payments.length,
    addPayment,
    settlePayment,
    cancelPayment,
  };
}
