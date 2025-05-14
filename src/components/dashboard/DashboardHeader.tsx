
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
        <p className="text-muted-foreground">
          Bienvenue sur Sapajoo, votre système de gestion de bons de commande
        </p>
      </div>
      <Link to="/purchase-orders/create">
        <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Créer un Bon de Commande
        </Button>
      </Link>
    </div>
  );
};

export default DashboardHeader;
