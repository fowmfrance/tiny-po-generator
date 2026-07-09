import React from 'react';
import { FileText, Users, DollarSign, Receipt } from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { useBudgetsData } from '@/hooks/useBudgetsData';
import { formatCurrency } from '@/utils/paymentUtils';

const StatsOverview = () => {
  const { purchaseOrders } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { invoices } = useSupplierInvoices();
  const { budgets } = useBudgetsData();

  const activeSuppliers = suppliers.filter(s => s.is_active).length;
  const pendingInvoices = invoices.filter(inv => inv.payment_status !== 'paid');

  // Budget utilization: total committed (sentAmount) vs total budget (initialAmount)
  const totalBudget = budgets.reduce((sum, b) => sum + b.initialAmount, 0);
  const totalCommitted = budgets.reduce((sum, b) => sum + b.sentAmount, 0);
  const budgetUtilization = totalBudget > 0 ? Math.round((totalCommitted / totalBudget) * 100) : 0;

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
      title: 'Utilisation du Budget',
      value: `${budgetUtilization}%`,
      change: `${formatCurrency(totalCommitted)} sur ${formatCurrency(totalBudget)}`,
      icon: DollarSign,
      highlight: true,
      progress: budgetUtilization,
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
            <stat.icon className={`h-5 w-5 ${stat.highlight ? 'text-brand' : 'text-muted-foreground'}`} />
          </div>
          <div className={`num text-3xl font-bold tracking-tight ${stat.highlight ? 'text-brand' : 'text-foreground'}`}>
            {stat.value}
          </div>
          {stat.progress !== undefined && (
            <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${Math.min(stat.progress, 100)}%` }}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
