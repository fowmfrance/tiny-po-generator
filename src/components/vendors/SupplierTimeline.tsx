import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/utils/paymentUtils';
import { cn } from '@/lib/utils';
import { SendHorizonal, PackageCheck } from 'lucide-react';

interface PO {
  id: string;
  po_number: string;
  created_at: string;
  sent_at?: string | null;
  expected_delivery_date?: string | null;
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

export default function SupplierTimeline({ purchaseOrders, invoices }: Props) {
  const navigate = useNavigate();

  const { groups, timeRange, isEmpty } = useMemo(() => {
    if (purchaseOrders.length === 0 && invoices.length === 0) {
      return { groups: [], timeRange: { min: new Date(), max: new Date() }, isEmpty: true };
    }

    const poMap = new Map<string, PO>();
    purchaseOrders.forEach(po => poMap.set(po.id, po));

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

    const groups: { po: PO | null; invoices: Invoice[] }[] = [];

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
    purchaseOrders.forEach(po => {
      allDates.push(new Date(po.created_at).getTime());
      if (po.sent_at) allDates.push(new Date(po.sent_at).getTime());
      if (po.expected_delivery_date) allDates.push(new Date(po.expected_delivery_date).getTime());
    });
    invoices.forEach(inv => {
      allDates.push(new Date(inv.invoice_date).getTime());
      if (inv.due_date) allDates.push(new Date(inv.due_date).getTime());
      if (inv.paid_date) allDates.push(new Date(inv.paid_date).getTime());
    });

    const min = new Date(Math.min(...allDates));
    const max = new Date(Math.max(...allDates));
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Historique</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-200/60 border border-indigo-300" />
              Période BdC (envoi → livraison)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 border border-indigo-600" />
              Envoi BdC
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 border-2 border-indigo-500 rounded-full bg-background" />
              Livraison prévue
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

                {/* PO zone: colored area between sent_at and expected_delivery_date */}
                {group.po && (() => {
                  const sentDate = group.po.sent_at;
                  const deliveryDate = group.po.expected_delivery_date;
                  const startDate = sentDate || group.po.created_at;
                  // End date: delivery date, or last invoice due date, or just a small bar
                  const endDate = deliveryDate
                    || (group.invoices.length > 0 ? group.invoices[group.invoices.length - 1].due_date : null);

                  const leftPct = toPercent(startDate);
                  const rightPct = endDate ? toPercent(endDate) : leftPct;
                  const widthPct = Math.max(0.5, rightPct - leftPct);

                  return (
                    <>
                      {/* Background zone between sent and delivery */}
                      <div
                        className="absolute top-0 bottom-0 bg-indigo-100/50 border-y border-indigo-200/40"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      />

                      {/* Sent date marker (filled dot) */}
                      {sentDate && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-1.5 w-5 h-5 rounded-full bg-indigo-500 border-2 border-background z-20 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                              style={{ left: `${toPercent(sentDate)}%`, transform: 'translateX(-50%)' }}
                            >
                              <SendHorizonal className="w-3 h-3 text-white" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs font-semibold">Envoyé le {fmtDate(sentDate)}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Expected delivery date marker (outline dot) */}
                      {deliveryDate && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-1.5 w-5 h-5 rounded-full bg-background border-2 border-indigo-500 z-20 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                              style={{ left: `${toPercent(deliveryDate)}%`, transform: 'translateX(-50%)' }}
                            >
                              <PackageCheck className="w-3 h-3 text-indigo-600" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs font-semibold">Livraison prévue le {fmtDate(deliveryDate)}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* PO creation marker (if different from sent) */}
                      {!sentDate && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-1 h-6 rounded-sm border cursor-pointer hover:opacity-80 transition-opacity min-w-[8px]',
                                STATUS_COLORS[group.po!.status] || 'bg-muted',
                                'border-muted-foreground/20'
                              )}
                              style={{
                                left: `${toPercent(group.po!.created_at)}%`,
                                width: '8px',
                              }}
                              onClick={() => navigate(`/purchase-orders/${group.po!.id}`)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-0.5">
                              <p className="font-semibold">{group.po!.po_number}</p>
                              <p>Créé le {fmtDate(group.po!.created_at)}</p>
                              <p>{formatCurrency(Number(group.po!.total_amount), group.po!.currency)}</p>
                              <p>Statut: {group.po!.status}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  );
                })()}

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
