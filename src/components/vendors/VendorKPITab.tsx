import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { InvoiceWithPaymentStatus } from '@/types/payment';
import { formatCurrency } from '@/utils/paymentUtils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, ShoppingCart, CalendarClock, Timer, Package,
} from 'lucide-react';

// Cast recharts components for JSX compat
const RBar = Bar as unknown as React.ComponentType<any>;
const RXAxis = XAxis as unknown as React.ComponentType<any>;
const RYAxis = YAxis as unknown as React.ComponentType<any>;
const RTooltip = Tooltip as unknown as React.ComponentType<any>;
const RCartesianGrid = CartesianGrid as unknown as React.ComponentType<any>;

interface BankTx {
  qonto_amount: number;
  qonto_side: string | null;
  qonto_settled_at: string | null;
  qonto_emitted_at: string | null;
}

interface VendorKPITabProps {
  supplierPOs: PurchaseOrder[];
  supplierInvoices: InvoiceWithPaymentStatus[];
  bankTransactions?: BankTx[];
  currency?: string;
}

function VendorKPITab({ supplierPOs, supplierInvoices, bankTransactions = [], currency = 'EUR' }: VendorKPITabProps) {
  const kpis = useMemo(() => {
    // Revenue by year (commandé, via BdC)
    const revenueByYear = new Map<number, number>();
    supplierPOs.forEach(po => {
      if (po.status === 'rejected') return;
      const year = new Date(po.created_at).getFullYear();
      revenueByYear.set(year, (revenueByYear.get(year) || 0) + Number(po.total_amount));
    });
    const revenueData = Array.from(revenueByYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, total]) => ({ year: String(year), total }));

    // Versé par année (via transactions bancaires réellement rattachées).
    // C'est la donnée « connectée » : disponible même sans BdC ni facture saisis.
    const spendByYear = new Map<number, number>();
    let bankTotal = 0;
    bankTransactions.forEach(t => {
      if (t.qonto_side !== 'debit') return;
      const d = t.qonto_settled_at || t.qonto_emitted_at;
      if (!d) return;
      const amount = Math.abs(Number(t.qonto_amount) || 0);
      bankTotal += amount;
      const year = new Date(d).getFullYear();
      spendByYear.set(year, (spendByYear.get(year) || 0) + amount);
    });
    const paidData = Array.from(spendByYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, total]) => ({ year: String(year), total }));

    // Average order
    const validPOs = supplierPOs.filter(po => po.status !== 'rejected');
    const avgOrder = validPOs.length > 0
      ? validPOs.reduce((s, po) => s + Number(po.total_amount), 0) / validPOs.length
      : 0;

    // Order frequency (avg days between orders)
    let avgFrequency = 0;
    if (validPOs.length >= 2) {
      const sorted = [...validPOs].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      let totalDays = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalDays += (new Date(sorted[i].created_at).getTime() - new Date(sorted[i - 1].created_at).getTime()) / 86400000;
      }
      avgFrequency = Math.round(totalDays / (sorted.length - 1));
    }

    // Average payment delay (days between invoice_date and paid_date)
    const paidInvoices = supplierInvoices.filter(inv => inv.paid_date);
    let avgPaymentDelay = 0;
    if (paidInvoices.length > 0) {
      const totalDelay = paidInvoices.reduce((s, inv) => {
        const issued = new Date(inv.invoice_date).getTime();
        const paid = new Date(inv.paid_date!).getTime();
        return s + (paid - issued) / 86400000;
      }, 0);
      avgPaymentDelay = Math.round(totalDelay / paidInvoices.length);
    }

    // Average price per deliverable (from PO items)
    const allItems = validPOs.flatMap(po => po.items || []);
    const avgPricePerItem = allItems.length > 0
      ? allItems.reduce((s, item) => s + Number(item.unit_price), 0) / allItems.length
      : 0;

    // Items breakdown by description
    const itemsByType = new Map<string, { count: number; totalSpend: number }>();
    allItems.forEach(item => {
      const key = item.description || 'Autre';
      const existing = itemsByType.get(key) || { count: 0, totalSpend: 0 };
      existing.count += Number(item.quantity);
      existing.totalSpend += Number(item.total || item.quantity * item.unit_price);
      itemsByType.set(key, existing);
    });
    const itemsBreakdown = Array.from(itemsByType.entries())
      .map(([name, data]) => ({ name, ...data, avgPrice: data.totalSpend / data.count }))
      .sort((a, b) => b.totalSpend - a.totalSpend);

    return { revenueData, paidData, bankTotal, avgOrder, avgFrequency, avgPaymentDelay, avgPricePerItem, itemsBreakdown };
  }, [supplierPOs, supplierInvoices, bankTransactions]);

  // Le graphe s'appuie sur les paiements bancaires réels si disponibles,
  // sinon retombe sur le montant commandé (BdC).
  const usingBank = kpis.paidData.length > 0;
  const chartData = usingBank ? kpis.paidData : kpis.revenueData;
  const chartTitle = usingBank ? 'Versé par année (banque)' : 'Commandé par année (BdC)';

  const statCards = [
    ...(usingBank
      ? [{ label: 'Total versé (banque)', value: formatCurrency(kpis.bankTotal, currency), icon: TrendingUp }]
      : []),
    { label: 'Commande moyenne', value: formatCurrency(kpis.avgOrder, currency), icon: ShoppingCart },
    { label: 'Fréquence commandes', value: kpis.avgFrequency > 0 ? `${kpis.avgFrequency} jours` : '—', icon: CalendarClock },
    { label: 'Délai paiement moyen', value: kpis.avgPaymentDelay > 0 ? `${kpis.avgPaymentDelay} jours` : '—', icon: Timer },
    { label: 'Prix moyen / livrable', value: kpis.avgPricePerItem > 0 ? formatCurrency(kpis.avgPricePerItem, currency) : '—', icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <p className="text-lg font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue by year chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <RCartesianGrid strokeDasharray="3 3" vertical={false} />
                <RXAxis dataKey="year" />
                <RYAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <RTooltip formatter={(v: number) => formatCurrency(v, currency)} />
                <RBar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucune donnée disponible.</p>
          )}
        </CardContent>
      </Card>

      {/* Items breakdown table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Prix moyen par livrable
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kpis.itemsBreakdown.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Livrable</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Quantité</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total dépensé</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Prix moyen</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kpis.itemsBreakdown.map(item => (
                    <tr key={item.name}>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-right">{item.count}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.totalSpend, currency)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.avgPrice, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucun article de commande trouvé. Les prix par livrable seront disponibles lorsque le catalogue sera complété.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VendorKPITab;
