
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
import { validateBudgetActive } from '@/services/budgetService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarRange } from 'lucide-react';

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
  startDate: Date | null;
  endDate: Date | null;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  budgetId: string;
  vendor: string;
  vendorId: string;
  currency: BudgetCurrency;
  amount: number;
  invoicedAmount: number;
  invoiceDate: Date | null;
  createdAt: Date;
}

interface BudgetPurchaseOrdersProps {
  purchaseOrders: PurchaseOrder[];
  budget: Budget;
}

const BudgetPurchaseOrders: React.FC<BudgetPurchaseOrdersProps> = ({ 
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

  // Check if budget is active
  const budgetStatus = validateBudgetActive(budget.startDate, budget.endDate);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Purchase Orders for {budget.name}</h3>
        <div className="text-sm">
          <span className="text-gray-500">Total PO Amount: </span>
          <span className="font-medium">{formatCurrency(budget.currency, totalPoAmount)}</span>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-gray-500">Invoiced: </span>
          <span className="font-medium">{formatCurrency(budget.currency, totalInvoicedAmount)}</span>
        </div>
      </div>

      <div className="flex items-center mb-4">
        <div className="mr-4 flex items-center">
          <CalendarRange className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm text-gray-500">
            {budget.startDate ? budget.startDate.toLocaleDateString() : 'No start date'} - {budget.endDate ? budget.endDate.toLocaleDateString() : 'No end date'}
          </span>
        </div>
        {!budgetStatus.active && (
          <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
            {budgetStatus.message}
          </Badge>
        )}
      </div>

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
    </div>
  );
};

export default BudgetPurchaseOrders;
