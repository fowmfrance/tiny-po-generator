
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Receipt, TrendingUp } from 'lucide-react';

const QuickActions = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Actions Rapides</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/purchase-orders/create">
          <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <FileText className="h-10 w-10 text-po-blue mb-2" />
              <span className="text-sm font-medium">Créer un BC</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/vendors/new">
          <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Users className="h-10 w-10 text-po-blue mb-2" />
              <span className="text-sm font-medium">Ajouter un Fournisseur</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/invoices">
          <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Receipt className="h-10 w-10 text-po-blue mb-2" />
              <span className="text-sm font-medium">Vérifier les Factures</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/reports">
          <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <TrendingUp className="h-10 w-10 text-po-blue mb-2" />
              <span className="text-sm font-medium">Voir les Rapports</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default QuickActions;
