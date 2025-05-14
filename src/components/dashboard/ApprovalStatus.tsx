
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const ApprovalStatus = () => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Clock className="mr-2 h-5 w-5 text-amber-500" />
            En Attente d'Approbation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">3</div>
          <div className="text-sm text-muted-foreground">
            Bons de commande en attente d'approbation
          </div>
          <Link 
            to="/purchase-orders?status=pending" 
            className="text-po-blue hover:text-blue-700 text-sm flex items-center mt-4"
          >
            Voir Tout
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            Attention Requise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">2</div>
          <div className="text-sm text-muted-foreground">
            Éléments nécessitant votre attention
          </div>
          <Link 
            to="/alerts" 
            className="text-po-blue hover:text-blue-700 text-sm flex items-center mt-4"
          >
            Voir les Alertes
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Récemment Complétés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">5</div>
          <div className="text-sm text-muted-foreground">
            Bons de commande exécutés ce mois-ci
          </div>
          <Link 
            to="/purchase-orders?status=completed" 
            className="text-po-blue hover:text-blue-700 text-sm flex items-center mt-4"
          >
            Voir Tout
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalStatus;
