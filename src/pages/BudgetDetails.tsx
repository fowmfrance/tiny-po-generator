import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BudgetWaterfallChart } from '@/components/budget/BudgetWaterfallChart';
import { useQueryClient } from '@tanstack/react-query';
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
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import EditBudgetDialog from '@/components/budget/EditBudgetDialog';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const formatMoney = (currency: string, amount: number) => {
  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  return `${symbol}${amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const BudgetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['budget-details', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;

      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('id, code, name, currency, initial_amount, budget_type_id, start_date, end_date')
        .eq('id', id)
        .single();

      if (budgetError || !budget) return null;

      const { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select('id, po_number, supplier_id, total_amount, currency, status, created_at, supplier:suppliers(name)')
        .eq('budget_id', budget.id)
        .order('created_at', { ascending: false });

      if (poError) throw poError;

      const poList = (purchaseOrders || []) as any[];
      const poIds = poList.map((po) => po.id);

      let receivedAmount = 0;
      if (poIds.length > 0) {
        const { data: invoices, error: invoicesError } = await supabase
          .from('supplier_invoices')
          .select('purchase_order_id, amount, status')
          .in('purchase_order_id', poIds)
          .neq('status', 'rejected');

        if (invoicesError) throw invoicesError;

        receivedAmount = (invoices || []).reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
      }

      const sentAmount = poList
        .filter((po) => po.status !== 'rejected')
        .reduce((sum, po) => sum + Number(po.total_amount || 0), 0);

      const initial = Number(budget.initial_amount || 0);
      const availableAmount = initial - sentAmount;

      return {
        budget,
        purchaseOrders: poList,
        metrics: {
          initialAmount: initial,
          sentAmount,
          receivedAmount,
          availableAmount,
          poCount: poList.length,
        },
      };
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">Chargement des détails du budget...</div>;
  }

  if (!data?.budget) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate('/budgets')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux budgets
        </Button>
        <div className="text-center mt-8">
          <p className="text-lg text-muted-foreground">Budget introuvable</p>
        </div>
      </div>
    );
  }

  const { budget, purchaseOrders, metrics } = data;

  const handleCreatePO = () => {
    navigate('/purchase-orders/create', {
      state: {
        budgetId: budget.id,
        budgetName: budget.name,
        budgetCode: budget.code,
        budgetCurrency: budget.currency,
      },
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)} className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Modifier
          </Button>
          <Button onClick={handleCreatePO} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Créer un bon de commande
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4">
            <div>
              <CardTitle className="text-xl">{budget.name}</CardTitle>
              <CardDescription className="mt-1">
                Code: {budget.code} | Type: <Badge variant="secondary">{budget.budget_type_id}</Badge>
              </CardDescription>
            </div>
            <BudgetWaterfallChart
              currency={budget.currency}
              initialAmount={metrics.initialAmount}
              sentAmount={metrics.sentAmount}
              receivedAmount={metrics.receivedAmount}
              availableAmount={metrics.availableAmount}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex justify-between items-center gap-4">
            <h2 className="text-lg font-medium">Bons de commande</h2>
            <div className="text-sm space-x-4">
              <span>
                <span className="text-muted-foreground">Nombre de BC : </span>
                <span className="font-medium">{metrics.poCount}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Montant provisionné : </span>
                <span className="font-medium">{formatMoney(budget.currency, metrics.sentAmount)}</span>
              </span>
            </div>
          </div>

          {purchaseOrders.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° BC</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po: any) => (
                    <TableRow
                      key={po.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                    >
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.supplier?.name || 'Fournisseur inconnu'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{po.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(po.currency || budget.currency, Number(po.total_amount || 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(po.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 rounded-md border text-center">
              <p className="text-muted-foreground">Aucun bon de commande trouvé pour ce budget.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditBudgetDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        budget={{
          id: budget.id,
          name: budget.name,
          code: budget.code,
          currency: budget.currency,
          initial_amount: metrics.initialAmount,
          start_date: budget.start_date,
          end_date: budget.end_date,
        }}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['budget-details', id] });
          queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }}
      />
    </div>
  );
};

export default BudgetDetails;
