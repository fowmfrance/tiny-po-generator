import React, { useMemo } from 'react';
import PurchaseOrderCard from '@/components/PurchaseOrderCard';
import { PurchaseOrder } from '@/pages/PurchaseOrders';
import { FolderOpen } from 'lucide-react';

interface PurchaseOrdersCardViewProps {
  purchaseOrders: PurchaseOrder[];
  budgetMap?: Record<string, string>; // budgetId -> budgetName
}

export const PurchaseOrdersCardView: React.FC<PurchaseOrdersCardViewProps> = ({ 
  purchaseOrders,
  budgetMap = {},
}) => {
  // Group POs by budget
  const grouped = useMemo(() => {
    const groups: Record<string, { name: string; pos: PurchaseOrder[] }> = {};

    purchaseOrders.forEach(po => {
      const key = (po as any).budgetId || '__none__';
      if (!groups[key]) {
        groups[key] = {
          name: key === '__none__' ? 'Sans projet' : (budgetMap[key] || 'Projet inconnu'),
          pos: [],
        };
      }
      groups[key].pos.push(po);
    });

    // Sort: named projects first, then "Sans projet"
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      return 0;
    });
  }, [purchaseOrders, budgetMap]);

  return (
    <div className="space-y-6">
      {grouped.map(([key, group]) => (
        <div key={key}>
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {group.name}
            </h3>
            <span className="text-xs text-muted-foreground">({group.pos.length})</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {group.pos.map((po) => (
              <PurchaseOrderCard key={po.id} {...po} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
