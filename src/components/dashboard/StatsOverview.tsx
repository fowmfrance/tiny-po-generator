import React from 'react';
import { FileText, Users, DollarSign, Receipt } from 'lucide-react';

const stats = [
  {
    title: 'Total Bons de Commande',
    value: '24',
    change: '+2 depuis le mois dernier',
    icon: FileText,
  },
  {
    title: 'Fournisseurs Actifs',
    value: '12',
    change: '+3 nouveaux ce trimestre',
    icon: Users,
  },
  {
    title: 'Utilisation du Budget',
    value: '68%',
    change: '68 000 € sur 100 000 €',
    icon: DollarSign,
  },
  {
    title: 'Factures en Attente',
    value: '8',
    change: 'Valeur totale de 24 500 €',
    icon: Receipt,
  },
];

const StatsOverview = () => {
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
