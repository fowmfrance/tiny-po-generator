
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';

const ApprovalStatus = () => {
  const { purchaseOrders } = usePurchaseOrders();
  const { invoices } = useSupplierInvoices();

  const pendingApproval = purchaseOrders.filter(po => po.status === 'pending' || po.status === 'draft').length;
  
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    return new Date(inv.due_date) < new Date();
  }).length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = purchaseOrders.filter(po => 
    po.status === 'paid' && 
    new Date(po.updated_at) >= startOfMonth
  ).length;

  return (
    <div className="grid gap-4 grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            En Attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">{pendingApproval}</div>
          <div className="text-xs text-muted-foreground">
            BC en attente d'approbation
          </div>
          <Link 
            to="/purchase-orders?status=pending" 
            className="text-primary hover:text-primary/80 text-xs flex items-center mt-2"
          >
            Voir Tout
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
            Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">{overdueInvoices}</div>
          <div className="text-xs text-muted-foreground">
            Factures en retard
          </div>
          <Link 
            to="/payments" 
            className="text-primary hover:text-primary/80 text-xs flex items-center mt-2"
          >
            Voir les Alertes
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Complétés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">{completedThisMonth}</div>
          <div className="text-xs text-muted-foreground">
            BC exécutés ce mois-ci
          </div>
          <Link 
            to="/purchase-orders?status=completed" 
            className="text-primary hover:text-primary/80 text-xs flex items-center mt-2"
          >
            Voir Tout
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalStatus;
