import React, { useEffect, useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/paymentUtils';
import {
  derivePaymentMethod,
  paymentMethodBadgeClass,
  type BankPaymentMethod,
} from '@/utils/bankPaymentMethod';

interface Tx {
  id: string;
  qonto_label: string | null;
  qonto_amount: number;
  qonto_currency: string | null;
  qonto_side: string | null;
  qonto_operation_type: string | null;
  qonto_settled_at: string | null;
  qonto_emitted_at: string | null;
}

type PeriodKey = '12M' | 'YTD' | 'ALL' | 'CUSTOM';

const PRESETS: { key: PeriodKey; label: string }[] = [
  { key: '12M', label: '12 mois' },
  { key: 'YTD', label: 'Année en cours' },
  { key: 'ALL', label: 'Tout' },
  { key: 'CUSTOM', label: 'Personnalisé' },
];

function periodStart(key: PeriodKey, customFrom: string): Date | null {
  const now = new Date();
  switch (key) {
    case '12M': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    case 'YTD':
      return new Date(now.getFullYear(), 0, 1);
    case 'CUSTOM':
      return customFrom ? new Date(customFrom) : null;
    case 'ALL':
    default:
      return null;
  }
}

const txDate = (t: Tx) => t.qonto_settled_at || t.qonto_emitted_at || null;

export default function SupplierBankTransactions({
  supplierId,
  refreshToken = 0,
}: {
  supplierId: string;
  refreshToken?: number;
}) {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('12M');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select(
          'id, qonto_label, qonto_amount, qonto_currency, qonto_side, qonto_operation_type, qonto_settled_at, qonto_emitted_at'
        )
        .eq('supplier_id', supplierId)
        .order('qonto_settled_at', { ascending: false });
      if (active) {
        setTransactions((data as Tx[]) || []);
        setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [supplierId, refreshToken]);

  const filtered = useMemo(() => {
    const from = periodStart(period, customFrom);
    const to = period === 'CUSTOM' && customTo ? new Date(customTo) : null;
    return transactions.filter((t) => {
      const d = txDate(t);
      if (!d) return true;
      const dt = new Date(d);
      if (from && dt < from) return false;
      if (to && dt > to) return false;
      return true;
    });
  }, [transactions, period, customFrom, customTo]);

  const breakdown = useMemo(() => {
    const map = new Map<BankPaymentMethod, { total: number; count: number }>();
    for (const t of filtered) {
      const method = derivePaymentMethod(t.qonto_operation_type);
      const entry = map.get(method) || { total: 0, count: 0 };
      entry.total += Math.abs(Number(t.qonto_amount) || 0);
      entry.count += 1;
      map.set(method, entry);
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [filtered]);

  const grandTotal = useMemo(
    () => filtered.reduce((s, t) => s + Math.abs(Number(t.qonto_amount) || 0), 0),
    [filtered]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-brand" />
            Transactions bancaires
          </CardTitle>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors ' +
                  (period === key
                    ? 'bg-brand text-brand-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {period === 'CUSTOM' && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-muted-foreground">Du</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2"
            />
            <span className="text-muted-foreground">au</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Chargement…</p>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Aucune transaction bancaire rattachée à ce fournisseur sur la période.
            <br />
            <span className="text-xs">
              Rattachez des transactions depuis la page Banques.
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Récap par mode de paiement */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground mr-1">
                {formatCurrency(grandTotal)} au total
              </span>
              {breakdown.map(([method, { total, count }]) => (
                <span
                  key={method}
                  className={
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ' +
                    paymentMethodBadgeClass[method]
                  }
                >
                  {method} · {formatCurrency(total)} ({count})
                </span>
              ))}
            </div>

            {/* Liste */}
            <div className="divide-y divide-border rounded-lg border border-border">
              {filtered.map((t) => {
                const method = derivePaymentMethod(t.qonto_operation_type);
                const d = txDate(t);
                return (
                  <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm text-foreground truncate">
                        {t.qonto_label || 'Transaction'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d ? new Date(d).toLocaleDateString('fr-FR') : '—'}
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
                        {formatCurrency(Math.abs(Number(t.qonto_amount) || 0))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
