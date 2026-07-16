import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentOrganizationId } from '@/utils/organization';
import { useToast } from '@/hooks/use-toast';

/**
 * Agrégats facturation & paiement par bon de commande.
 * Convention app : supplier_invoices.amount = TTC ; amount_ht / amount_ttc explicites.
 * Un BdC peut recevoir plusieurs factures (acompte, intermédiaire, solde) :
 * on cumule les HT et TTC soumis pour contrôle face au montant commandé.
 */

export interface POInvoiceTotals {
  invoiceCount: number;
  invoicedHt: number;
  invoicedTtc: number;
  paidTtc: number; // paiements réglés (status='paid')
  pendingTtc: number; // paiements préparés / ordonnés
}

export interface POInvoiceLine {
  id: string;
  invoiceNumber: string;
  ht: number;
  ttc: number;
  paid: number;
  pending: number;
  remaining: number; // TTC restant à régler (payé + en cours déduits)
}

const EMPTY_TOTALS: POInvoiceTotals = {
  invoiceCount: 0,
  invoicedHt: 0,
  invoicedTtc: 0,
  paidTtc: 0,
  pendingTtc: 0,
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const ttcOf = (inv: any) => Number(inv.amount_ttc ?? inv.amount ?? 0);
const htOf = (inv: any) =>
  Number(inv.amount_ht ?? round2(Number(inv.amount ?? 0) - Number(inv.vat_amount ?? 0)));

interface RawData {
  invoices: any[];
  paymentsByInvoice: Map<string, { paid: number; pending: number }>;
}

function usePOInvoicingData() {
  return useQuery({
    queryKey: ['po-invoicing-summaries'],
    queryFn: async (): Promise<RawData> => {
      const { data: invoices, error: invErr } = await supabase
        .from('supplier_invoices')
        .select('id, purchase_order_id, amount, amount_ht, amount_ttc, vat_amount, invoice_number, status')
        .not('purchase_order_id', 'is', null)
        .neq('status', 'cancelled');
      if (invErr) throw invErr;

      const ids = (invoices || []).map((i) => i.id);
      const paymentsByInvoice = new Map<string, { paid: number; pending: number }>();
      if (ids.length > 0) {
        const { data: payments, error: payErr } = await supabase
          .from('payment_batch_invoices')
          .select('invoice_id, amount_paid, status')
          .in('invoice_id', ids)
          .neq('status', 'cancelled');
        if (payErr) throw payErr;
        for (const p of (payments || []) as any[]) {
          const entry = paymentsByInvoice.get(p.invoice_id) || { paid: 0, pending: 0 };
          if (p.status === 'paid') entry.paid += Number(p.amount_paid || 0);
          else entry.pending += Number(p.amount_paid || 0);
          paymentsByInvoice.set(p.invoice_id, entry);
        }
      }
      return { invoices: invoices || [], paymentsByInvoice };
    },
  });
}

/** Agrégats pour la liste des BdC : Map<purchase_order_id, POInvoiceTotals>. */
export function usePOInvoicingSummaries() {
  const query = usePOInvoicingData();

  const summaries = new Map<string, POInvoiceTotals>();
  if (query.data) {
    for (const inv of query.data.invoices) {
      const poId = inv.purchase_order_id as string;
      const totals = summaries.get(poId) || { ...EMPTY_TOTALS };
      const pay = query.data.paymentsByInvoice.get(inv.id) || { paid: 0, pending: 0 };
      totals.invoiceCount += 1;
      totals.invoicedHt = round2(totals.invoicedHt + htOf(inv));
      totals.invoicedTtc = round2(totals.invoicedTtc + ttcOf(inv));
      totals.paidTtc = round2(totals.paidTtc + pay.paid);
      totals.pendingTtc = round2(totals.pendingTtc + pay.pending);
      summaries.set(poId, totals);
    }
  }

  return { summaries, isLoading: query.isLoading };
}

/** Détail par facture d'un BdC (pour le paiement groupé) + agrégats. */
export function usePOInvoiceLines(poId: string | undefined) {
  const query = usePOInvoicingData();

  const lines: POInvoiceLine[] = [];
  if (query.data && poId) {
    for (const inv of query.data.invoices) {
      if (inv.purchase_order_id !== poId) continue;
      const pay = query.data.paymentsByInvoice.get(inv.id) || { paid: 0, pending: 0 };
      const ttc = ttcOf(inv);
      lines.push({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        ht: htOf(inv),
        ttc,
        paid: pay.paid,
        pending: pay.pending,
        remaining: Math.max(0, round2(ttc - pay.paid - pay.pending)),
      });
    }
  }

  return { lines, isLoading: query.isLoading };
}

/**
 * Répartition d'un montant global sur les factures, au prorata du reste à régler.
 * « Régler 40 % de la somme de 2 factures » = 40 % de chacune quand rien n'est payé.
 */
export function allocateProRata(
  lines: { id: string; remaining: number }[],
  target: number
): { invoiceId: string; amount: number }[] {
  const pool = lines.filter((l) => l.remaining > 0.005);
  const total = pool.reduce((s, l) => s + l.remaining, 0);
  if (total <= 0) return [];
  const t = Math.min(target, total);

  let allocated = 0;
  return pool
    .map((l, i) => {
      const raw =
        i === pool.length - 1
          ? round2(Math.min(t - allocated, l.remaining))
          : round2((l.remaining * t) / total);
      allocated = round2(allocated + raw);
      return { invoiceId: l.id, amount: raw };
    })
    .filter((a) => a.amount > 0.004);
}

/** Paiement groupé : un lot (payment_batch) + une ligne par facture réglée. */
export function usePOGroupPayment(poId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['po-invoicing-summaries'] });
    queryClient.invalidateQueries({ queryKey: ['invoice-payments'] });
    queryClient.invalidateQueries({ queryKey: ['po-invoices', poId] });
    queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  const addGroupPayment = useMutation({
    mutationFn: async (input: {
      allocations: { invoiceId: string; amount: number }[];
      status: 'paid' | 'prepared';
      bankPaymentDate?: string | null;
      valueDate?: string | null;
      paymentMethod?: string | null;
      note?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');
      if (input.allocations.length === 0) throw new Error('Aucune facture à régler.');

      const total = round2(input.allocations.reduce((s, a) => s + a.amount, 0));
      if (total <= 0) throw new Error('Le montant doit être positif.');

      const ts = new Date().toISOString();
      const ref = `PAY-${ts.slice(0, 10)}-${Math.floor(
        Number(ts.slice(11, 13) + ts.slice(14, 16) + ts.slice(17, 19))
      )}`;

      const { data: batch, error: batchErr } = await supabase
        .from('payment_batches')
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          batch_reference: ref,
          currency: 'EUR',
          total_amount: total,
          invoice_count: input.allocations.length,
          status: input.status === 'paid' ? 'processed' : 'draft',
        })
        .select('id')
        .single();
      if (batchErr) throw batchErr;

      const { error: linesErr } = await supabase.from('payment_batch_invoices').insert(
        input.allocations.map((a) => ({
          batch_id: batch.id,
          invoice_id: a.invoiceId,
          organization_id: organizationId,
          amount_paid: a.amount,
          status: input.status,
          bank_payment_date: input.status === 'paid' ? input.bankPaymentDate || null : null,
          value_date: input.valueDate || null,
          payment_method: input.paymentMethod || null,
          note: input.note || null,
        })) as any
      );
      if (linesErr) throw linesErr;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Paiement groupé enregistré' });
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return { addGroupPayment, invalidate };
}
