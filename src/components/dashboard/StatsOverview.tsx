import React from 'react';
import { FileText, Users, DollarSign, Receipt } from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { formatCurrency } from '@/utils/paymentUtils';

const StatsOverview = () => {
  const { purchaseOrders } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { invoices } = useSupplierInvoices();

  const activeSuppliers = suppliers.filter(s => s.is_active).length;
  const pendingInvoices = invoices.filter(inv => inv.payment_status !== 'paid');
  const totalPOAmount = purchaseOrders.reduce((sum, po) => sum + Number(po.total_amount), 0);

  const stats = [
    {
      title: 'Total Bons de Commande',
      value: String(purchaseOrders.length),
      change: `${purchaseOrders.filter(po => po.status === 'draft').length} brouillon(s)`,
      icon: FileText,
    },
    {
      title: 'Fournisseurs Actifs',
      value: String(activeSuppliers),
      change: `${suppliers.length} au total`,
      icon: Users,
    },
    {
      title: 'Volume Engagé',
      value: formatCurrency(totalPOAmount),
      change: `Sur ${purchaseOrders.length} BC`,
      icon: DollarSign,
    },
    {
      title: 'Factures en Attente',
      value: String(pendingInvoices.length),
      change: `${formatCurrency(pendingInvoices.reduce((s, i) => s + Number(i.amount), 0))} à payer`,
      icon: Receipt,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="bg-card rounded-xl border border-border p-6 hover:border-slate-400 transition-colors duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
            <stat.icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</div>
          <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
