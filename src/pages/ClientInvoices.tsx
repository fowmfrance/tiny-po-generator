import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, RefreshCw, ExternalLink, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientInvoices } from '@/hooks/useClientInvoices';
import { useClients } from '@/hooks/useClients';
import { useBudgetsData } from '@/hooks/useBudgetsData';
import { VAT_REGIMES, VAT_REGIME_KEYS, isVatRegime, htMatchesRegime, type VatRegime } from '@/utils/vatRegimes';

/**
 * POC facturation Qonto : factures clients (et avoirs) importées via la
 * connexion bancaire existante, rattachables à un budget — alimente le volet
 * CA du bloc Reconnaissance des budgets.
 */
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Payée', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  unpaid: { label: 'À payer', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  draft: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  canceled: { label: 'Annulée', cls: 'bg-red-50 text-red-700 border-red-100' },
  credit_note: { label: 'Avoir', cls: 'bg-brand-subtle text-brand border-brand/20' },
};

const ClientInvoices = () => {
  const {
    invoices, isLoading, syncInvoices, assignBudget,
    assignClient, setVatOverride, createMissingClients,
  } = useClientInvoices();
  const { clients } = useClients();
  const { budgets } = useBudgetsData();
  const [syncing, setSyncing] = useState(false);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const orphanCount = invoices.filter((i) => !i.client_id).length;

  // Régime effectif d'une facture : override posé sur la ligne, sinon régime
  // du compte client rattaché ; sans compte, pas de contrôle possible.
  const effectiveRegime = (inv: (typeof invoices)[number]): VatRegime | null => {
    if (isVatRegime(inv.vat_regime_override)) return inv.vat_regime_override;
    const c = inv.client_id ? clientById.get(inv.client_id) : null;
    return c && isVatRegime(c.vat_regime) ? c.vat_regime : null;
  };

  const { data: connection } = useQuery({
    queryKey: ['active-bank-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_connections')
        .select('id, organization_name, bank_name')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleSync = async () => {
    if (!connection) return;
    setSyncing(true);
    try {
      await syncInvoices.mutateAsync(connection.id);
    } finally {
      setSyncing(false);
    }
  };

  const fmt = (n: number | null, currency: string | null) =>
    n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Factures clients</h1>
          <p className="text-gray-500">
            Importées depuis la facturation Qonto{connection ? ` (${connection.organization_name})` : ''} —
            rattachez-les à un budget pour alimenter la reconnaissance du CA.
          </p>
        </div>
        <Button onClick={handleSync} disabled={!connection || syncing}>
          {syncing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
          Synchroniser
        </Button>
      </div>

      {/* Factures sans compte client : proposer la création en masse depuis
          l'identité Qonto (SIREN, n° TVA, pays → régime). Action explicite. */}
      {orphanCount > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
          <span className="text-sm text-amber-800">
            {orphanCount} facture{orphanCount > 1 ? 's' : ''} sans compte client — le CA par client
            et le contrôle TVA ne les couvrent pas.
          </span>
          <Button
            size="sm" variant="outline"
            onClick={() => createMissingClients.mutate()}
            disabled={createMissingClients.isPending}
          >
            {createMissingClients.isPending
              ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              : <UserPlus className="h-4 w-4 mr-1.5" />}
            Créer les comptes depuis Qonto
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Toutes les factures</CardTitle>
          <CardDescription>
            Les avoirs apparaissent en montants négatifs. Le rattachement budget survit aux resynchronisations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Chargement…</p>
          ) : invoices.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Aucune facture importée. Lancez une synchronisation
              {connection ? '' : ' (aucune connexion bancaire active)'}.
            </p>
          ) : (
            <Table containerClassName="max-h-[65vh]">
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">HT</TableHead>
                  <TableHead className="text-right">TTC</TableHead>
                  <TableHead className="text-center">TVA</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => {
                  const st = STATUS_LABELS[inv.status ?? ''] ?? { label: inv.status ?? '—', cls: 'bg-muted text-muted-foreground' };
                  const regime = effectiveRegime(inv);
                  // Contrôle de cohérence : le HT Qonto (vérité comptable)
                  // colle-t-il au régime du compte ? On alerte, on ne corrige pas.
                  const htSuspect = regime != null
                    && inv.amount_ttc != null && inv.amount_ht != null
                    && !htMatchesRegime(inv.amount_ttc, inv.amount_ht, regime);
                  return (
                    <TableRow key={inv.id} className={inv.is_credit_note ? 'bg-muted/30' : undefined}>
                      <TableCell className="font-medium">{inv.number ?? '—'}</TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[190px]">
                          <div className="text-xs text-muted-foreground truncate max-w-[190px]" title={inv.client_name ?? undefined}>
                            {inv.client_name ?? 'Client inconnu'}
                          </div>
                          <Select
                            value={inv.client_id ?? 'none'}
                            onValueChange={(v) => assignClient.mutate({ invoiceId: inv.id, clientId: v === 'none' ? null : v })}
                          >
                            <SelectTrigger className="h-8 text-xs w-[190px] [&>span]:truncate">
                              <SelectValue placeholder="Rattacher un compte…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucun compte client</SelectItem>
                              {clients.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}{c.siren ? ` · ${c.siren}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('fr-FR') : '—'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${inv.is_credit_note ? 'text-destructive' : ''}`}>
                        <span className="inline-flex items-center gap-1 justify-end">
                          {htSuspect && (
                            <AlertTriangle
                              className="h-3.5 w-3.5 text-amber-600 shrink-0"
                              aria-label="HT incohérent avec le régime TVA"
                            />
                          )}
                          {fmt(inv.amount_ht, inv.currency)}
                        </span>
                        {htSuspect && regime && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            incohérent avec {VAT_REGIMES[regime].label}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {fmt(inv.amount_ttc, inv.currency)}
                      </TableCell>
                      <TableCell className="text-center">
                        {inv.client_id ? (
                          <Select
                            value={inv.vat_regime_override ?? 'default'}
                            onValueChange={(v) => setVatOverride.mutate({
                              invoiceId: inv.id,
                              vatRegimeOverride: v === 'default' ? null : v,
                            })}
                          >
                            <SelectTrigger className="h-7 w-auto gap-1 border-0 shadow-none p-0 [&>svg]:h-3 [&>svg]:w-3 justify-center">
                              {regime ? (
                                <Badge variant="outline" className={`${VAT_REGIMES[regime].badgeClass} font-normal`}>
                                  {VAT_REGIMES[regime].label}
                                  {inv.vat_regime_override && ' *'}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Régime du compte</SelectItem>
                              {VAT_REGIME_KEYS.map((k) => (
                                <SelectItem key={k} value={k}>{VAT_REGIMES[k].label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={inv.budget_id ?? 'none'}
                          onValueChange={(v) => assignBudget.mutate({ invoiceId: inv.id, budgetId: v === 'none' ? null : v })}
                        >
                          <SelectTrigger className="w-[190px] h-8 [&>span]:truncate">
                            <SelectValue placeholder="Aucun" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun</SelectItem>
                            {[...budgets].sort((a, b) => a.code.localeCompare(b.code)).map(b => (
                              <SelectItem key={b.id} value={b.id}>{b.code} — {b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {inv.invoice_url && (
                          <a
                            href={inv.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            title="Ouvrir dans Qonto"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientInvoices;
