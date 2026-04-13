import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/utils/paymentUtils';
import { cn } from '@/lib/utils';

interface PO {
  id: string;
  po_number: string;
  created_at: string;
  total_amount: number;
  currency: string;
  status: string;
  budget?: { name: string; code: string } | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  payment_status: string;
  purchase_order_id: string | null;
  po_number: string | null;
  paid_date?: string | null;
}

interface Props {
  purchaseOrders: PO[];
  invoices: Invoice[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted',
  pending: 'bg-amber-200',
  approved: 'bg-blue-200',
  sent: 'bg-indigo-200',
  paid: 'bg-emerald-300',
  closed: 'bg-slate-300',
  rejected: 'bg-red-200',
};

const INV_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-400',
  overdue: 'bg-red-400',
  due_soon: 'bg-amber-400',
  not_due: 'bg-slate-300',
};

// Group POs with their invoices, compute timeline positions
export default function SupplierTimeline({ purchaseOrders, invoices }: Props) {
  const navigate = useNavigate();

  const { groups, timeRange, isEmpty } = useMemo(() => {
    if (purchaseOrders.length === 0 && invoices.length === 0) {
      return { groups: [], timeRange: { min: new Date(), max: new Date() }, isEmpty: true };
    }

    // Build groups: each PO + its invoices
    const poMap = new Map<string, PO>();
    purchaseOrders.forEach(po => poMap.set(po.id, po));

    // Invoices linked to POs
    const invoicesByPO = new Map<string, Invoice[]>();
    const orphanInvoices: Invoice[] = [];
    invoices.forEach(inv => {
      if (inv.purchase_order_id && poMap.has(inv.purchase_order_id)) {
        const arr = invoicesByPO.get(inv.purchase_order_id) || [];
        arr.push(inv);
        invoicesByPO.set(inv.purchase_order_id, arr);
      } else {
        orphanInvoices.push(inv);
      }
    });

    const groups: {
      po: PO | null;
      invoices: Invoice[];
    }[] = [];

    // POs sorted by date
    const sortedPOs = [...purchaseOrders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    sortedPOs.forEach(po => {
      groups.push({
        po,
        invoices: (invoicesByPO.get(po.id) || []).sort((a, b) => new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime()),
      });
    });

    if (orphanInvoices.length > 0) {
      groups.push({ po: null, invoices: orphanInvoices });
    }

    // Compute time range
    const allDates: number[] = [];
    purchaseOrders.forEach(po => allDates.push(new Date(po.created_at).getTime()));
    invoices.forEach(inv => {
      allDates.push(new Date(inv.invoice_date).getTime());
      if (inv.due_date) allDates.push(new Date(inv.due_date).getTime());
      if (inv.paid_date) allDates.push(new Date(inv.paid_date).getTime());
    });

    const min = new Date(Math.min(...allDates));
    const max = new Date(Math.max(...allDates));
    // Add padding
    const padding = (max.getTime() - min.getTime()) * 0.05 || 30 * 24 * 60 * 60 * 1000;
    min.setTime(min.getTime() - padding);
    max.setTime(max.getTime() + padding);

    return { groups, timeRange: { min, max }, isEmpty: false };
  }, [purchaseOrders, invoices]);

  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">Aucun historique pour ce fournisseur.</p>
        </CardContent>
      </Card>
    );
  }

  const totalMs = timeRange.max.getTime() - timeRange.min.getTime();
  const toPercent = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return ((d.getTime() - timeRange.min.getTime()) / totalMs) * 100;
  };

  // Generate month ticks
  const monthTicks: { label: string; pct: number }[] = [];
  const tickDate = new Date(timeRange.min);
  tickDate.setDate(1);
  tickDate.setMonth(tickDate.getMonth() + 1);
  while (tickDate <= timeRange.max) {
    monthTicks.push({
      label: tickDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      pct: toPercent(tickDate),
    });
    tickDate.setMonth(tickDate.getMonth() + 1);
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Historique</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-200 border border-blue-300" />
              Bon de commande
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500" />
              Facture payée
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500" />
              Facture en attente
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 border border-red-500" />
              Facture échue
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month axis */}
        <div className="relative h-6 border-b mb-1">
          {monthTicks.map((tick, i) => (
            <div
              key={i}
              className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
              style={{ left: `${tick.pct}%`, top: 0 }}
            >
              {tick.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {groups.map((group, gi) => (
            <div key={gi} className="relative">
              {/* Label */}
              <div className="flex items-center gap-2 mb-0.5">
                {group.po ? (
                  <span
                    className="text-xs font-medium text-primary cursor-pointer hover:underline truncate max-w-[120px]"
                    onClick={() => navigate(`/purchase-orders/${group.po!.id}`)}
                  >
                    {group.po.po_number}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Sans BdC</span>
                )}
                {group.po && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatCurrency(Number(group.po.total_amount), group.po.currency)}
                  </span>
                )}
              </div>

              {/* Timeline bar */}
              <div className="relative h-8 bg-muted/30 rounded-md overflow-visible">
                {/* Month grid lines */}
                {monthTicks.map((tick, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-muted/50"
                    style={{ left: `${tick.pct}%` }}
                  />
                ))}

                {/* PO marker */}
                {group.po && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'absolute top-1 h-6 rounded-sm border cursor-pointer hover:opacity-80 transition-opacity min-w-[8px]',
                          STATUS_COLORS[group.po.status] || 'bg-muted',
                          group.po.status === 'approved' ? 'border-blue-300' : 'border-muted-foreground/20'
                        )}
                        style={{
                          left: `${toPercent(group.po.created_at)}%`,
                          width: group.invoices.length > 0
                            ? `${Math.max(2, toPercent(group.invoices[group.invoices.length - 1].due_date || group.invoices[group.invoices.length - 1].invoice_date) - toPercent(group.po.created_at))}%`
                            : '8px',
                        }}
                        onClick={() => navigate(`/purchase-orders/${group.po!.id}`)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-0.5">
                        <p className="font-semibold">{group.po.po_number}</p>
                        <p>{fmtDate(group.po.created_at)} · {formatCurrency(Number(group.po.total_amount), group.po.currency)}</p>
                        <p>Statut: {group.po.status}</p>
                        {group.po.budget && <p>Budget: {group.po.budget.name}</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Invoice dots */}
                {group.invoices.map((inv) => (
                  <Tooltip key={inv.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'absolute top-2.5 w-3 h-3 rounded-full border-2 border-background cursor-pointer hover:scale-125 transition-transform z-10',
                          INV_STATUS_COLORS[inv.payment_status] || 'bg-slate-300'
                        )}
                        style={{ left: `${toPercent(inv.invoice_date)}%`, transform: 'translateX(-50%)' }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-0.5">
                        <p className="font-semibold">{inv.invoice_number}</p>
                        <p>Date: {fmtDate(inv.invoice_date)}</p>
                        <p>Échéance: {fmtDate(inv.due_date)}</p>
                        <p>Montant: {formatCurrency(Number(inv.amount), inv.currency)}</p>
                        {inv.paid_date && <p>Payée le: {fmtDate(inv.paid_date)}</p>}
                        {inv.po_number && <p>Réf. BC: {inv.po_number}</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
