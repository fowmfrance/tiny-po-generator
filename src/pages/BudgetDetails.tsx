
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
import { BudgetCurrency, formatCurrency } from '@/services/budgetService';

interface Budget {
  id: string;
  code: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  remainingAmount: number;
  receivedAmount: number;
  sentAmount: number;
  availableAmount: number;
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
  amountInEUR: number; // EUR equivalent amount
  fxGainLoss: number | null; // FX gain/loss at booking date
  invoicedAmount: number;
  invoiceDate: Date | null;
  createdAt: Date;
  exchangeRate: number; // Exchange rate at PO emission date
  invoiceExchangeRate: number | null; // Exchange rate at invoice booking date
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
        sentAmount: 75000,
        remainingAmount: 20000,
        receivedAmount: 55000,
        availableAmount: 25000,
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
        sentAmount: 35000,
        remainingAmount: 8000,
        receivedAmount: 27000,
        availableAmount: 15000,
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
        sentAmount: 15000,
        remainingAmount: 0,
        receivedAmount: 15000,
        availableAmount: 60000,
        type: 'Project',
        poCount: 5,
        createdAt: new Date(),
      },
    ];

    // Mock purchase orders with EUR equivalents and FX gain/loss
    const mockPurchaseOrders: PurchaseOrder[] = [
      {
        id: '101',
        poNumber: 'PRJ-2023-001-001',
        budgetId: '1',
        vendor: 'Dell Technologies',
        currency: 'USD',
        amount: 15000,
        amountInEUR: 13800, // USD to EUR at 0.92 exchange rate
        exchangeRate: 0.92,
        invoiceExchangeRate: 0.91,
        fxGainLoss: -150, // (0.92 - 0.91) * 15000 = -150 EUR loss
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
        amountInEUR: 18400, // USD to EUR at 0.92 exchange rate
        exchangeRate: 0.92,
        invoiceExchangeRate: null,
        fxGainLoss: null, // No invoice yet
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
        amountInEUR: 10000, // Already in EUR
        exchangeRate: 1.0,
        invoiceExchangeRate: 1.0,
        fxGainLoss: 0, // No FX difference for EUR
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

  // Calculate totals
  const totalPoAmount = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);
  const totalInvoicedAmount = purchaseOrders.reduce((sum, po) => sum + po.invoicedAmount, 0);
  const totalPoAmountInEUR = purchaseOrders.reduce((sum, po) => sum + po.amountInEUR, 0);
  const totalFxGainLoss = purchaseOrders.reduce((sum, po) => sum + (po.fxGainLoss || 0), 0);

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
                Sent: {formatCurrency(budget.currency, budget.sentAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Received: {formatCurrency(budget.currency, budget.receivedAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Remaining: {formatCurrency(budget.currency, budget.remainingAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Available: {formatCurrency(budget.currency, budget.availableAmount)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">Purchase Orders</h2>
            <div className="text-sm space-x-4">
              <span>
                <span className="text-gray-500">Total PO Amount: </span>
                <span className="font-medium">{formatCurrency(budget.currency, totalPoAmount)}</span>
              </span>
              <span>
                <span className="text-gray-500">Total in EUR: </span>
                <span className="font-medium">{formatCurrency('EUR', totalPoAmountInEUR)}</span>
              </span>
              <span>
                <span className="text-gray-500">Invoiced: </span>
                <span className="font-medium">{formatCurrency(budget.currency, totalInvoicedAmount)}</span>
              </span>
              <span>
                <span className="text-gray-500">FX Gain/Loss: </span>
                <span className={`font-medium ${totalFxGainLoss > 0 ? 'text-green-600' : totalFxGainLoss < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency('EUR', totalFxGainLoss)}
                </span>
              </span>
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
                    <TableHead className="text-right">Amount (EUR)</TableHead>
                    <TableHead className="text-right">Invoiced Amount</TableHead>
                    <TableHead className="text-right">Exchange Rate</TableHead>
                    <TableHead className="text-right">
                      FX Gain/Loss at booking
                    </TableHead>
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
                        {formatCurrency('EUR', po.amountInEUR)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(po.currency, po.invoicedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {po.exchangeRate.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        {po.fxGainLoss !== null ? (
                          <span className={po.fxGainLoss > 0 ? 'text-green-600' : po.fxGainLoss < 0 ? 'text-red-600' : ''}>
                            {formatCurrency('EUR', po.fxGainLoss)}
                          </span>
                        ) : 'N/A'}
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
