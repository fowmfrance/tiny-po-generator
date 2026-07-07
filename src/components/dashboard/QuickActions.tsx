import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Receipt, TrendingUp } from 'lucide-react';

const QuickActions = () => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to="/budgets/create"
        className="inline-flex items-center gap-2 rounded-[10px] bg-brand text-brand-foreground px-4 py-2 text-sm font-medium hover:bg-brand/90 transition-colors"
      >
        <FileText className="h-4 w-4" />
        Créer un Budget
      </Link>
      <Link
        to="/vendors?add=1"
        className="inline-flex items-center gap-2 rounded-[10px] bg-card border border-border px-3.5 py-2 text-sm font-medium text-foreground hover:border-slate-300 hover:bg-muted/50 transition-colors"
      >
        <Users className="h-4 w-4 text-muted-foreground" />
        Ajouter un Fournisseur
      </Link>
      <Link
        to="/payments"
        className="inline-flex items-center gap-2 rounded-[10px] bg-card border border-border px-3.5 py-2 text-sm font-medium text-foreground hover:border-slate-300 hover:bg-muted/50 transition-colors"
      >
        <Receipt className="h-4 w-4 text-muted-foreground" />
        Vérifier les Factures
      </Link>
      <Link
        to="/reports"
        className="inline-flex items-center gap-2 rounded-[10px] bg-card border border-border px-3.5 py-2 text-sm font-medium text-foreground hover:border-slate-300 hover:bg-muted/50 transition-colors"
      >
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        Voir les Rapports
      </Link>
    </div>
  );
};

export default QuickActions;
