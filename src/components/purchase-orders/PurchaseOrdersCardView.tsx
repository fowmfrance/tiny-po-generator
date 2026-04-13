
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {purchaseOrders.map((po) => (
        <PurchaseOrderCard key={po.id} {...po} />
      ))}
    </div>
  );
};
