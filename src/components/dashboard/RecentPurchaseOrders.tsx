import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PurchaseOrderCard from '@/components/PurchaseOrderCard';

type PurchaseOrder = {
  id: string;
  poNumber: string;
  vendor: string;
  vendorId: string;
  amount: number;
  currency: string;
  date: string;
  status: 'pending' | 'approved' | 'matched';
  paymentProgress?: number;
};

const RecentPurchaseOrders = () => {
  const recentPOs: PurchaseOrder[] = [
    {
      id: '1',
      poNumber: '2023-001',
      vendor: 'KLP Design ✏️',
      vendorId: 'v1',
      amount: 5000,
      currency: 'EUR',
      date: '15/06/2023',
      status: 'matched',
      paymentProgress: 60
    },
    {
      id: '2',
      poNumber: '2023-002',
      vendor: 'DJ Bob 🎵',
      vendorId: 'v2',
      amount: 3500,
      currency: 'EUR',
      date: '18/06/2023',
      status: 'approved',
      paymentProgress: 0
    },
    {
      id: '3',
      poNumber: '2023-003',
      vendor: 'Orlando Traiteur 🍽️',
      vendorId: 'v3',
      amount: 2800,
      currency: 'EUR',
      date: '20/06/2023',
      status: 'pending'
    }
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentPOs.map((po) => (
          <PurchaseOrderCard key={po.id} {...po} />
        ))}
      </div>
    </div>
  );
};

export default RecentPurchaseOrders;
