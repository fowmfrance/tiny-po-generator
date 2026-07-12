import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Link2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/paymentUtils';
import { findTransactionSuggestions } from '@/utils/fuzzyMatch';
import {
  derivePaymentMethod,
  paymentMethodBadgeClass,
} from '@/utils/bankPaymentMethod';

interface CandidateTx {
  id: string;
  qonto_label: string | null;
  qonto_amount: number;
  qonto_currency: string | null;
  qonto_operation_type: string | null;
  qonto_settled_at: string | null;
  qonto_emitted_at: string | null;
}

const txDate = (t: CandidateTx) => t.qonto_settled_at || t.qonto_emitted_at || null;

/**
 * Suggère des transactions bancaires non affectées dont le libellé ressemble au
 * nom du tiers, et permet de les rattacher en un clic (ou en masse). C'est le
 * « crawl fuzzy » déclenché à l'ouverture de la fiche d'un tiers : rattraper le
 * retard d'affectation sans passer par l'écran Banque.
 */
export default function SupplierPaymentSuggestions({
  supplierId,
  supplierName,
  onAttached,
}: {
  supplierId: string;
  supplierName: string;
  onAttached: () => void;
}) {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<CandidateTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attaching, setAttaching] = useState<string | null>(null);
  const [attachingAll, setAttachingAll] = useState(false);

  const loadCandidates = React.useCallback(async () => {
    setIsLoading(true);
    // Décaissements non affectés à un tiers, sur toute l'organisation (RLS).
    const { data } = await supabase
      .from('transactions')
      .select(
        'id, qonto_label, qonto_amount, qonto_currency, qonto_operation_type, qonto_settled_at, qonto_emitted_at'
      )
      .is('supplier_id', null)
      .is('client_id', null)
      .eq('qonto_side', 'debit')
      .order('qonto_settled_at', { ascending: false })
      .limit(500);
    setCandidates((data as CandidateTx[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadCandidates();
    })();
    return () => {
      active = false;
    };
  }, [loadCandidates, supplierId]);

  const suggestions = useMemo(
    () => findTransactionSuggestions(supplierName, candidates),
    [supplierName, candidates]
  );

  const attach = async (txIds: string[]) => {
    const { error } = await supabase
      .from('transactions')
      .update({ supplier_id: supplierId, client_id: null })
      .in('id', txIds);
    if (error) {
      toast({
        title: 'Rattachement impossible',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
    // Optimiste : retirer localement les tx rattachées.
    setCandidates((prev) => prev.filter((t) => !txIds.includes(t.id)));
    onAttached();
    return true;
  };

  const attachOne = async (txId: string) => {
    setAttaching(txId);
    const ok = await attach([txId]);
    if (ok) toast({ title: 'Transaction rattachée', description: `Rattachée à « ${supplierName} ».` });
    setAttaching(null);
  };

  const attachAll = async () => {
    setAttachingAll(true);
    const ids = suggestions.map((s) => s.transaction.id);
    const ok = await attach(ids);
    if (ok)
      toast({
        title: 'Transactions rattachées',
        description: `${ids.length} transaction(s) rattachée(s) à « ${supplierName} ».`,
      });
    setAttachingAll(false);
  };

  if (isLoading) {
    return (
      <Card className="border-brand/30 bg-brand/[0.03]">
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Recherche de paiements non affectés…
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <Card className="border-brand/30 bg-brand/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            {suggestions.length} paiement{suggestions.length > 1 ? 's' : ''} non affecté
            {suggestions.length > 1 ? 's' : ''} à rattacher
          </CardTitle>
          <Button
            size="sm"
            onClick={attachAll}
            disabled={attachingAll}
            className="h-8"
          >
            {attachingAll ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-1.5 h-4 w-4" />
            )}
            Tout rattacher
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Transactions bancaires dont le libellé ressemble à « {supplierName} ». Vérifiez avant de rattacher.
        </p>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border rounded-lg border border-border bg-background">
          {suggestions.map(({ transaction: t, score }) => {
            const method = derivePaymentMethod(t.qonto_operation_type);
            const d = txDate(t);
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm text-foreground truncate">
                    {t.qonto_label || 'Transaction'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d ? new Date(d).toLocaleDateString('fr-FR') : '—'} · {Math.round(score * 100)}% de similarité
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ' +
                      paymentMethodBadgeClass[method]
                    }
                  >
                    {method}
                  </span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {formatCurrency(Math.abs(Number(t.qonto_amount) || 0), t.qonto_currency || 'EUR')}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    disabled={attaching === t.id || attachingAll}
                    onClick={() => attachOne(t.id)}
                  >
                    {attaching === t.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="mr-1 h-3.5 w-3.5" /> Rattacher
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
