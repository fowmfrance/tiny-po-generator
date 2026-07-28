import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentOrganizationId } from '@/utils/organization';
import { useToast } from '@/hooks/use-toast';

/**
 * Factures clients Qonto (POC facturation) — miroir local `client_invoices`.
 *
 * La synchro passe par l'edge function qonto-proxy (passthrough générique,
 * identifiants de la connexion bancaire) sur /v2/client_invoices et
 * /v2/credit_notes. Les avoirs sont stockés en lignes négatives
 * (is_credit_note=true) : le CA facturé = somme simple des amount_ht.
 * Le rattachement budget_id est manuel et PRÉSERVÉ à la resynchro.
 */

export interface ClientInvoice {
  id: string;
  qonto_invoice_id: string;
  number: string | null;
  status: string | null;
  is_credit_note: boolean;
  client_name: string | null;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  currency: string | null;
  amount_ttc: number | null;
  vat_amount: number | null;
  amount_ht: number | null;
  invoice_url: string | null;
  budget_id: string | null;
}

const num = (v: unknown): number => {
  const n = Number((v as { value?: string })?.value ?? v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function useClientInvoices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['client-invoices'],
    queryFn: async (): Promise<ClientInvoice[]> => {
      const { data, error } = await supabase
        .from('client_invoices')
        .select('id, qonto_invoice_id, number, status, is_credit_note, client_name, issue_date, due_date, paid_at, currency, amount_ttc, vat_amount, amount_ht, invoice_url, budget_id')
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return (data || []) as ClientInvoice[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['client-invoices'] });

  const syncInvoices = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');

      const fetchPages = async (endpoint: string, listKey: string) => {
        const rows: Record<string, unknown>[] = [];
        let page = 1;
        const MAX_PAGES = 50;
        while (page && page <= MAX_PAGES) {
          const { data, error } = await supabase.functions.invoke('qonto-proxy', {
            body: {
              action: 'qonto_api',
              connectionId,
              endpoint,
              params: { per_page: 100, page, exclude_imported: 'false' },
            },
          });
          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);
          rows.push(...((data?.[listKey] || []) as Record<string, unknown>[]));
          const next = data?.meta?.next_page;
          page = typeof next === 'number' ? next : 0;
        }
        return rows;
      };

      const [invoices, creditNotes] = await Promise.all([
        fetchPages('client_invoices', 'client_invoices'),
        fetchPages('credit_notes', 'credit_notes'),
      ]);

      const invoiceRows = invoices.map((inv: any) => {
        const ttc = num(inv.total_amount);
        const vat = num(inv.vat_amount);
        return {
          organization_id: organizationId,
          user_id: user.id,
          qonto_invoice_id: String(inv.id),
          number: inv.number ?? null,
          status: inv.status ?? null,
          invoice_type: inv.invoice_type ?? null,
          is_credit_note: false,
          client_name: inv.client?.name || null,
          issue_date: inv.issue_date || null,
          due_date: inv.due_date || null,
          paid_at: inv.paid_at || null,
          currency: inv.currency || 'EUR',
          amount_ttc: ttc,
          vat_amount: vat,
          amount_ht: ttc - vat,
          invoice_url: inv.invoice_url ?? null,
          raw: inv,
          updated_at: new Date().toISOString(),
        };
      });

      // Avoirs : montants NÉGATIFS, liés à la facture d'origine
      const creditRows = creditNotes.map((cn: any) => {
        const ttc = num(cn.total_amount);
        const vat = num(cn.vat_amount);
        return {
          organization_id: organizationId,
          user_id: user.id,
          qonto_invoice_id: String(cn.id),
          number: cn.number ?? null,
          status: 'credit_note',
          invoice_type: 'credit_note',
          is_credit_note: true,
          linked_qonto_invoice_id: cn.invoice_id ? String(cn.invoice_id) : null,
          client_name: cn.client?.name || null,
          issue_date: cn.issue_date || null,
          currency: cn.currency || 'EUR',
          amount_ttc: -Math.abs(ttc),
          vat_amount: -Math.abs(vat),
          amount_ht: -Math.abs(ttc) + Math.abs(vat),
          raw: cn,
          updated_at: new Date().toISOString(),
        };
      });

      const all = [...invoiceRows, ...creditRows];
      const BATCH = 200;
      for (let i = 0; i < all.length; i += BATCH) {
        // budget_id absent du payload → préservé pour les lignes existantes
        const { error } = await supabase
          .from('client_invoices')
          .upsert(all.slice(i, i + BATCH), { onConflict: 'organization_id,qonto_invoice_id' });
        if (error) throw error;
      }

      return { invoices: invoiceRows.length, creditNotes: creditRows.length };
    },
    onSuccess: (r) => {
      invalidate();
      toast({
        title: 'Factures synchronisées',
        description: `${r.invoices} facture(s) et ${r.creditNotes} avoir(s) importés depuis Qonto.`,
      });
    },
    onError: (e: Error) => toast({
      title: 'Synchronisation impossible',
      description: e.message.includes('404')
        ? 'La facturation Qonto ne semble pas activée sur ce compte.'
        : e.message,
      variant: 'destructive',
    }),
  });

  const assignBudget = useMutation({
    mutationFn: async (input: { invoiceId: string; budgetId: string | null }) => {
      const { error } = await supabase
        .from('client_invoices')
        .update({ budget_id: input.budgetId, updated_at: new Date().toISOString() })
        .eq('id', input.invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['budget-reco-ca'] });
    },
    onError: (e: Error) => toast({ title: 'Impossible de rattacher', description: e.message, variant: 'destructive' }),
  });

  return { invoices: query.data ?? [], isLoading: query.isLoading, syncInvoices, assignBudget };
}
