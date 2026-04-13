import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PurchaseOrder, PurchaseOrderStatus } from '@/pages/PurchaseOrders';
import { StatusBadge } from '@/components/purchase-orders/StatusBadge';
import { FolderOpen } from 'lucide-react';

interface PurchaseOrdersTableViewProps {
  purchaseOrders: PurchaseOrder[];
}

export const PurchaseOrdersTableView: React.FC<PurchaseOrdersTableViewProps> = ({ 
  purchaseOrders 
}) => {
  const navigate = useNavigate();

  // Group by budget
  const grouped = useMemo(() => {
    const groups: Record<string, { name: string; pos: PurchaseOrder[] }> = {};
    purchaseOrders.forEach(po => {
      const key = po.budgetId || '__none__';
      if (!groups[key]) {
        groups[key] = {
          name: key === '__none__' ? 'Sans projet' : (po.budgetName || 'Projet inconnu'),
          pos: [],
        };
      }
      groups[key].pos.push(po);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      return 0;
    });
  }, [purchaseOrders]);

  return (
    <div className="space-y-6">
      {grouped.map(([key, group]) => (
        <div key={key}>
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {group.name}
            </h3>
            <span className="text-xs text-muted-foreground">({group.pos.length})</span>
          </div>
          <div className="rounded-md border overflow-hidden mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° BC</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.pos.map((po) => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link
                        to={`/purchase-orders/${po.id}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {po.poNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/vendors/${po.vendorId}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {po.vendor}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {po.currency} {po.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">{po.date}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={po.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
};
