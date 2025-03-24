
import React from 'react';
import PurchaseOrderCard from '@/components/PurchaseOrderCard';
import { PurchaseOrder } from '@/pages/PurchaseOrders';

interface PurchaseOrdersCardViewProps {
  purchaseOrders: PurchaseOrder[];
}

export const PurchaseOrdersCardView: React.FC<PurchaseOrdersCardViewProps> = ({ 
  purchaseOrders 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {purchaseOrders.map((po) => (
        <PurchaseOrderCard key={po.id} {...po} />
      ))}
    </div>
  );
};
