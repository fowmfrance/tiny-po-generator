import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PurchaseOrderCard from '@/components/PurchaseOrderCard';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';

const RecentPurchaseOrders = () => {
  const { purchaseOrders, isLoading } = usePurchaseOrders();

  const recentPOs = purchaseOrders.slice(0, 6).map(po => ({
    id: po.id,
    poNumber: po.po_number,
    vendor: po.supplier?.name || 'Fournisseur inconnu',
    vendorId: po.supplier_id,
    amount: Number(po.total_amount),
    currency: po.currency,
    date: new Date(po.created_at).toLocaleDateString('fr-FR'),
    status: po.status as 'pending' | 'approved' | 'matched',
    paymentProgress: po.status === 'paid' ? 100 : po.status === 'matched' ? 60 : 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Bons de Commande Récents</h2>
        <Link 
          to="/purchase-orders" 
          className="text-sm font-medium text-foreground hover:text-accent flex items-center gap-1 transition-colors"
        >
          Voir Tout
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Chargement...</p>
      ) : recentPOs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPOs.map((po) => (
            <PurchaseOrderCard key={po.id} {...po} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">Aucun bon de commande pour le moment.</p>
          <Link to="/purchase-orders/create" className="text-primary text-sm hover:underline mt-2 inline-block">
            Créer votre premier bon de commande
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentPurchaseOrders;
