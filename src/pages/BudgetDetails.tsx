
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
        name: 'Budget Projet Alpha',
        currency: 'EUR',
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
        name: 'Frais généraux T3',
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
        name: 'Budget Projet Beta',
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
        currency: 'EUR',
        amount: 15000,
        amountInEUR: 15000,
        exchangeRate: 1.0,
        invoiceExchangeRate: 1.0,
        fxGainLoss: 0,
        invoicedAmount: 15000,
        invoiceDate: new Date(),
        createdAt: new Date(),
      },
      {
        id: '102',
        poNumber: 'PRJ-2023-001-002',
        budgetId: '1',
        vendor: 'Amazon Business',
        currency: 'EUR',
        amount: 20000,
        amountInEUR: 20000,
        exchangeRate: 1.0,
        invoiceExchangeRate: null,
        fxGainLoss: null, // Pas encore de facture
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
        amountInEUR: 10000,
        exchangeRate: 1.0,
        invoiceExchangeRate: 1.0,
        fxGainLoss: 0,
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
    return <div className="p-8 text-center">Chargement des détails du budget...</div>;
  }

  if (!budget) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate('/budgets')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux budgets
        </Button>
        <div className="text-center mt-8">
          <p className="text-lg text-gray-500">Budget introuvable</p>
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
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux budgets
          </Button>
          <h1 className="text-2xl font-bold">Détails du budget</h1>
        </div>
        <Button 
          onClick={handleCreatePO}
          className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Créer un bon de commande
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
                Montant initial : {formatCurrency(budget.currency, budget.initialAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Envoyé : {formatCurrency(budget.currency, budget.sentAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Reçu : {formatCurrency(budget.currency, budget.receivedAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Restant : {formatCurrency(budget.currency, budget.remainingAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Disponible : {formatCurrency(budget.currency, budget.availableAmount)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">Bons de commande</h2>
            <div className="text-sm space-x-4">
              <span>
                <span className="text-gray-500">Total BC : </span>
                <span className="font-medium">{formatCurrency(budget.currency, totalPoAmount)}</span>
              </span>
              <span>
                <span className="text-gray-500">Total en EUR : </span>
                <span className="font-medium">{formatCurrency('EUR', totalPoAmountInEUR)}</span>
              </span>
              <span>
                <span className="text-gray-500">Facturé : </span>
                <span className="font-medium">{formatCurrency(budget.currency, totalInvoicedAmount)}</span>
              </span>
              <span>
                <span className="text-gray-500">Gain/Perte de change : </span>
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
                    <TableHead>N° BC</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead className="text-center">Devise</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Montant (EUR)</TableHead>
                    <TableHead className="text-right">Montant facturé</TableHead>
                    <TableHead className="text-right">Taux de change</TableHead>
                    <TableHead className="text-right">
                      Gain/Perte de change
                    </TableHead>
                    <TableHead className="text-right">Date facture</TableHead>
                    <TableHead className="text-right">Créé le</TableHead>
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
                        {po.invoiceDate ? po.invoiceDate.toLocaleDateString('fr-FR') : 'Non facturé'}
                      </TableCell>
                      <TableCell className="text-right">
                        {po.createdAt.toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-md border text-center">
              <p className="text-gray-500">Aucun bon de commande trouvé pour ce budget.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetDetails;
