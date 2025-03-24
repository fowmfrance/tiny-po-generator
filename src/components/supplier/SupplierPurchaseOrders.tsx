
import React from 'react';
import { mockPurchaseOrders, PurchaseOrder } from '@/pages/PurchaseOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/purchase-orders/StatusBadge';
import { Upload, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/services/budgetService';

interface SupplierPurchaseOrdersProps {
  vendorId: string;
}

const SupplierPurchaseOrders: React.FC<SupplierPurchaseOrdersProps> = ({ vendorId }) => {
  // Filter purchase orders for this vendor
  const vendorPOs = mockPurchaseOrders.filter(po => po.vendorId === vendorId);

  if (vendorPOs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className="text-gray-500">No purchase orders found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendorPOs.map(po => (
              <TableRow key={po.id}>
                <TableCell className="font-medium">{po.poNumber}</TableCell>
                <TableCell>{po.date}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(po.currency as any, po.amount)}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={po.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <PODetailsDialog po={po} />
                    {po.status === 'approved' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => window.location.href = `/supplier/invoices/create?po=${po.id}`}
                      >
                        <Upload className="h-4 w-4" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Dialog component for viewing PO details
const PODetailsDialog = ({ po }: { po: PurchaseOrder }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Order #{po.poNumber}</DialogTitle>
          <DialogDescription>
            Details for the selected purchase order.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Vendor:</div>
            <div className="text-sm">{po.vendor}</div>
            
            <div className="text-sm font-medium">Amount:</div>
            <div className="text-sm">{formatCurrency(po.currency as any, po.amount)}</div>
            
            <div className="text-sm font-medium">Date:</div>
            <div className="text-sm">{po.date}</div>
            
            <div className="text-sm font-medium">Status:</div>
            <div className="text-sm">
              <StatusBadge status={po.status} />
            </div>
            
            {po.paymentProgress !== undefined && (
              <>
                <div className="text-sm font-medium">Payment Progress:</div>
                <div className="text-sm">
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-po-blue h-2 rounded-full" 
                      style={{ width: `${po.paymentProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{po.paymentProgress}% complete</span>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierPurchaseOrders;
