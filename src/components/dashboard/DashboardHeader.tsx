import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Bons de Commande</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos achats et factures fournisseurs.
        </p>
      </div>
      <Link to="/purchase-orders/create">
        <button className="bg-primary hover:bg-slate-800 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau bon de commande
        </button>
      </Link>
    </div>
  );
};

export default DashboardHeader;
