
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BudgetCurrency = 'EUR' | 'USD' | 'GBP';

interface Budget {
  id: string;
  code: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  remainingAmount: number;
  type: 'Project' | 'G&A';
  poCount: number;
  createdAt: Date;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  budgetId: string;
  vendor: string;
  currency: BudgetCurrency;
  amount: number;
  invoicedAmount: number;
  invoiceDate: Date | null;
  createdAt: Date;
}

interface BudgetPurchaseOrdersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrders: PurchaseOrder[];
  budget: Budget;
}

const BudgetPurchaseOrdersDialog: React.FC<BudgetPurchaseOrdersDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  purchaseOrders,
  budget
}) => {
  // Calculate total amount of POs
  const totalPoAmount = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);
  
  // Calculate total invoiced amount
  const totalInvoicedAmount = purchaseOrders.reduce((sum, po) => sum + po.invoicedAmount, 0);
  
  // Currency display helper
  const formatCurrency = (currency: BudgetCurrency, amount: number) => {
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Purchase Orders for {budget.name}</DialogTitle>
          <DialogDescription>
            <div className="flex justify-between items-center mt-2">
              <span>Total PO Amount: {formatCurrency(budget.currency, totalPoAmount)}</span>
              <span>Invoiced: {formatCurrency(budget.currency, totalInvoicedAmount)}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {purchaseOrders.length > 0 ? (
          <div className="rounded-md border overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-center">Currency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Invoiced Amount</TableHead>
                  <TableHead className="text-right">Invoice Date</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.vendor}</TableCell>
                    <TableCell className="text-center">{po.currency}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(po.currency, po.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(po.currency, po.invoicedAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {po.invoiceDate ? po.invoiceDate.toLocaleDateString() : 'Not invoiced'}
                    </TableCell>
                    <TableCell className="text-right">
                      {po.createdAt.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-md border text-center">
            <p className="text-gray-500">No purchase orders found for this budget.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BudgetPurchaseOrdersDialog;
