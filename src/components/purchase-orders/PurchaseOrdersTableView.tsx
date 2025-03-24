
import React from 'react';
import { Link } from 'react-router-dom';
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

interface PurchaseOrdersTableViewProps {
  purchaseOrders: PurchaseOrder[];
}

export const PurchaseOrdersTableView: React.FC<PurchaseOrdersTableViewProps> = ({ 
  purchaseOrders 
}) => {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO Number</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">Date</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders.map((po) => (
            <TableRow key={po.id}>
              <TableCell className="font-medium">
                <Link to={`/purchase-orders/${po.id}`} className="text-po-blue hover:underline">
                  {po.poNumber}
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/vendors/${po.vendorId}`} className="text-po-blue hover:underline">
                  {po.vendor}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {po.currency} {po.amount.toLocaleString()}
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
  );
};
