import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentOrganizationId } from '@/utils/organization';
import { useToast } from '@/hooks/use-toast';
import { inferVatRegime } from '@/utils/vatRegimes';

// Colonnes client_id / vat_regime_override / clients enrichis hors types
// générés (migration 20261015120000 manuelle) — client non typé localement.
const dbx = supabase as any;

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
  client_id: string | null;
  vat_regime_override: string | null;
}

// Identité client côté Qonto (raw->client) : l'id est STABLE à travers les
// factures — c'est la meilleure clé de lookup, avant SIREN puis nom exact.
interface QontoClientIdentity {
  id?: string;
  name?: string;
  vat_number?: string;
  tax_identification_number?: string;
  country_code?: string;
  type?: string;
}

const normName = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();

const sirenOf = (c: QontoClientIdentity): string | null => {
  const tin = (c.tax_identification_number ?? '').replace(/\D/g, '');
  if (tin.length >= 9) return tin.slice(0, 9);
  // SIREN encodé dans le n° de TVA FR : FR + clé (2) + SIREN (9).
  const vat = (c.vat_number ?? '').replace(/\s/g, '').toUpperCase();
  if (/^FR[0-9A-Z]{2}\d{9}$/.test(vat)) return vat.slice(4);
  return null;
};

interface LookupClient {
  id: string;
  name: string;
  legal_name: string | null;
  siren: string | null;
  vat_number: string | null;
  crm_id: string | null;
  crm_source: string;
}

// Cascade de rattachement : id Qonto appris > SIREN > n° TVA > nom exact.
function matchClient(c: QontoClientIdentity, clients: LookupClient[]): LookupClient | null {
  if (c.id) {
    const byId = clients.find((x) => x.crm_source === 'qonto' && x.crm_id === c.id);
    if (byId) return byId;
  }
  const siren = sirenOf(c);
  if (siren) {
    const bySiren = clients.find((x) => x.siren === siren);
    if (bySiren) return bySiren;
  }
  const vat = (c.vat_number ?? '').replace(/\s/g, '').toUpperCase();
  if (vat) {
    const byVat = clients.find((x) => (x.vat_number ?? '').replace(/\s/g, '').toUpperCase() === vat);
    if (byVat) return byVat;
  }
  const n = normName(c.name ?? '');
  if (n) {
    const byName = clients.find((x) =>
      normName(x.name) === n || (x.legal_name && normName(x.legal_name) === n));
    if (byName) return byName;
  }
  return null;
}

/**
 * Rattache les factures orphelines aux comptes clients (cascade ci-dessus) et
 * APPREND : le client matché par SIREN/nom reçoit l'id Qonto en crm_id, le
 * prochain passage matche directement. Ne touche jamais un client_id déjà posé.
 */
async function autoLinkInvoices(organizationId: string): Promise<number> {
  const [{ data: orphans, error: e1 }, { data: clients, error: e2 }] = await Promise.all([
    dbx.from('client_invoices')
      .select('id, client:raw->client')
      .is('client_id', null)
      .eq('organization_id', organizationId),
    dbx.from('clients')
      .select('id, name, legal_name, siren, vat_number, crm_id, crm_source'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (!orphans?.length || !clients?.length) return 0;

  const byClient = new Map<string, { invoiceIds: string[]; qontoId: string | null; siren: string | null; vat: string | null }>();
  for (const o of orphans as { id: string; client: QontoClientIdentity | null }[]) {
    const identity = o.client;
    if (!identity) continue;
    const hit = matchClient(identity, clients as LookupClient[]);
    if (!hit) continue;
    const entry = byClient.get(hit.id) ?? {
      invoiceIds: [], qontoId: null, siren: null, vat: null,
    };
    entry.invoiceIds.push(o.id);
    entry.qontoId ??= identity.id ?? null;
    entry.siren ??= sirenOf(identity);
    entry.vat ??= identity.vat_number?.replace(/\s/g, '') || null;
    byClient.set(hit.id, entry);
  }

  let linked = 0;
  for (const [clientId, entry] of byClient) {
    const { error } = await dbx.from('client_invoices')
      .update({ client_id: clientId, updated_at: new Date().toISOString() })
      .in('id', entry.invoiceIds)
      .is('client_id', null); // course concurrente : ne jamais écraser
    if (error) throw error;
    linked += entry.invoiceIds.length;

    // Apprentissage : complète le compte sans écraser l'existant.
    const ref = (clients as LookupClient[]).find((x) => x.id === clientId);
    const patch: Record<string, unknown> = {};
    if (ref && !ref.crm_id && entry.qontoId) {
      patch.crm_id = entry.qontoId;
      patch.crm_source = 'qonto';
    }
    if (ref && !ref.siren && entry.siren) patch.siren = entry.siren;
    if (ref && !ref.vat_number && entry.vat) patch.vat_number = entry.vat;
    if (Object.keys(patch).length) {
      await dbx.from('clients').update(patch).eq('id', clientId);
    }
  }
  return linked;
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
      const { data, error } = await dbx
        .from('client_invoices')
        .select('id, qonto_invoice_id, number, status, is_credit_note, client_name, issue_date, due_date, paid_at, currency, amount_ttc, vat_amount, amount_ht, invoice_url, budget_id, client_id, vat_regime_override')
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

      // Lookup client post-import : rattache les orphelines (id Qonto appris,
      // puis SIREN/TVA, puis nom exact) sans toucher aux rattachements posés.
      const linked = await autoLinkInvoices(organizationId);

      return { invoices: invoiceRows.length, creditNotes: creditRows.length, linked };
    },
    onSuccess: (r) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Factures synchronisées',
        description: `${r.invoices} facture(s) et ${r.creditNotes} avoir(s) importés depuis Qonto`
          + (r.linked ? ` · ${r.linked} rattachée(s) à un compte client` : '') + '.',
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

  // Rattachement manuel au compte client (+ override de régime TVA éventuel).
  const assignClient = useMutation({
    mutationFn: async (input: { invoiceId: string; clientId: string | null; vatRegimeOverride?: string | null }) => {
      const patch: Record<string, unknown> = {
        client_id: input.clientId,
        updated_at: new Date().toISOString(),
      };
      if (input.vatRegimeOverride !== undefined) patch.vat_regime_override = input.vatRegimeOverride;
      const { error } = await dbx.from('client_invoices').update(patch).eq('id', input.invoiceId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast({ title: 'Impossible de rattacher', description: e.message, variant: 'destructive' }),
  });

  const setVatOverride = useMutation({
    mutationFn: async (input: { invoiceId: string; vatRegimeOverride: string | null }) => {
      const { error } = await dbx.from('client_invoices')
        .update({ vat_regime_override: input.vatRegimeOverride, updated_at: new Date().toISOString() })
        .eq('id', input.invoiceId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  // Crée les comptes clients manquants depuis l'identité Qonto des factures
  // orphelines (SIREN pivot, crm_id = id client Qonto, régime déduit du pays),
  // puis relance le rattachement. Action EXPLICITE (bouton), jamais implicite.
  const createMissingClients = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');

      const { data: orphans, error } = await dbx.from('client_invoices')
        .select('id, client:raw->client')
        .is('client_id', null)
        .eq('organization_id', organizationId);
      if (error) throw error;

      // Un compte par id client Qonto distinct.
      const identities = new Map<string, QontoClientIdentity>();
      for (const o of (orphans ?? []) as { client: QontoClientIdentity | null }[]) {
        if (o.client?.id && o.client.name) identities.set(o.client.id, o.client);
      }
      if (!identities.size) return { created: 0, linked: 0 };

      const rows = [...identities.values()].map((c) => ({
        organization_id: organizationId,
        user_id: user.id,
        // name part brut : le trigger proper_case_name normalise en base.
        name: c.name,
        siren: sirenOf(c),
        vat_number: c.vat_number?.replace(/\s/g, '') || null,
        crm_id: c.id,
        crm_source: 'qonto',
        vat_regime: inferVatRegime(c.country_code),
      }));
      const { error: insErr } = await dbx.from('clients').insert(rows);
      if (insErr) throw insErr;

      const linked = await autoLinkInvoices(organizationId);
      return { created: rows.length, linked };
    },
    onSuccess: (r) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Comptes clients créés',
        description: `${r.created} compte(s) créé(s) depuis Qonto, ${r.linked} facture(s) rattachée(s).`,
      });
    },
    onError: (e: Error) => toast({ title: 'Création impossible', description: e.message, variant: 'destructive' }),
  });

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    syncInvoices,
    assignBudget,
    assignClient,
    setVatOverride,
    createMissingClients,
  };
}
