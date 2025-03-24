
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type BudgetCurrency = 'EUR' | 'USD' | 'GBP';

interface Budget {
  id: string;
  code: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  remainingAmount: number;
  receivedAmount: number; // Added receivedAmount field
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

const BudgetDetails = () => {
  const { budgetId } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock data fetch - in a real app, this would be an API call
  useEffect(() => {
    // Mock budget data
    const mockBudgets: Budget[] = [
      {
        id: '1',
        code: 'PRJ-2023-001',
        name: 'Project Alpha Budget',
        currency: 'USD',
        initialAmount: 100000,
        remainingAmount: 45000,
        receivedAmount: 55000, // Added receivedAmount
        type: 'Project',
        poCount: 12,
        createdAt: new Date(),
      },
      {
        id: '2',
        code: 'GA-2023-002',
        name: 'G&A Expenses Q3',
        currency: 'EUR',
        initialAmount: 50000,
        remainingAmount: 23000,
        receivedAmount: 27000, // Added receivedAmount
        type: 'G&A',
        poCount: 8,
        createdAt: new Date(),
      },
      {
        id: '3',
        code: 'PRJ-2023-003',
        name: 'Project Beta Budget',
        currency: 'GBP',
        initialAmount: 75000,
        remainingAmount: 60000,
        receivedAmount: 15000, // Added receivedAmount
        type: 'Project',
        poCount: 5,
        createdAt: new Date(),
      },
    ];

    // Mock purchase orders
    const mockPurchaseOrders: PurchaseOrder[] = [
      {
        id: '101',
        poNumber: 'PRJ-2023-001-001',
        budgetId: '1',
        vendor: 'Dell Technologies',
        currency: 'USD',
        amount: 15000,
        invoicedAmount: 15000,
        invoiceDate: new Date(),
        createdAt: new Date(),
      },
      {
        id: '102',
        poNumber: 'PRJ-2023-001-002',
        budgetId: '1',
        vendor: 'Amazon Business',
        currency: 'USD',
        amount: 20000,
        invoicedAmount: 5000,
        invoiceDate: null,
        createdAt: new Date(),
      },
      {
        id: '103',
        poNumber: 'GA-2023-002-001',
        budgetId: '2',
        vendor: 'Software Inc.',
        currency: 'EUR',
        amount: 10000,
        invoicedAmount: 10000,
        invoiceDate: new Date(),
        createdAt: new Date(),
      },
    ];

    // Find the selected budget
    const selectedBudget = mockBudgets.find(b => b.id === budgetId) || null;
    
    // Filter POs for this budget
    const budgetPOs = mockPurchaseOrders.filter(po => po.budgetId === budgetId);
    
    setBudget(selectedBudget);
    setPurchaseOrders(budgetPOs);
    setLoading(false);
  }, [budgetId]);

  // Currency display helper
  const formatCurrency = (currency: BudgetCurrency, amount: number) => {
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };
  
  // Calculate totals
  const totalPoAmount = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);
  const totalInvoicedAmount = purchaseOrders.reduce((sum, po) => sum + po.invoicedAmount, 0);

  if (loading) {
    return <div className="p-8 text-center">Loading budget details...</div>;
  }

  if (!budget) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate('/budgets')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Budgets
        </Button>
        <div className="text-center mt-8">
          <p className="text-lg text-gray-500">Budget not found</p>
        </div>
      </div>
    );
  }

  // Handler for creating a new PO from this budget
  const handleCreatePO = () => {
    navigate('/purchase-orders/create', { 
      state: { 
        budgetId: budget.id,
        budgetName: budget.name,
        budgetCode: budget.code 
      } 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/budgets')} className="mr-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Budgets
          </Button>
          <h1 className="text-2xl font-bold">Budget Details</h1>
        </div>
        <Button 
          onClick={handleCreatePO}
          className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">{budget.name}</CardTitle>
              <CardDescription className="mt-1">
                Code: {budget.code} | Type: <span className="inline-block"><Badge variant="secondary">{budget.type}</Badge></span>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="font-medium">
                Initial Amount: {formatCurrency(budget.currency, budget.initialAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Received: {formatCurrency(budget.currency, budget.receivedAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Remaining: {formatCurrency(budget.currency, budget.remainingAmount)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">Purchase Orders</h2>
            <div className="text-sm">
              <span className="text-gray-500">Total PO Amount: </span>
              <span className="font-medium">{formatCurrency(budget.currency, totalPoAmount)}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-500">Invoiced: </span>
              <span className="font-medium">{formatCurrency(budget.currency, totalInvoicedAmount)}</span>
            </div>
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
                    <TableRow 
                      key={po.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                    >
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
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetDetails;
