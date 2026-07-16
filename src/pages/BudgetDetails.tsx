import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BudgetWaterfallChart } from '@/components/budget/BudgetWaterfallChart';
import { BudgetRecognitionSection } from '@/components/budget/BudgetRecognitionSection';
import { BudgetAmountsSection } from '@/components/budget/BudgetAmountsSection';
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

  const { data: isAdmin = false } = useQuery({
    queryKey: ['current-user-is-admin'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return false;
      const { data: isAdm } = await supabase.rpc('has_role', {
        _user_id: userData.user.id,
        _role: 'admin',
      });
      return !!isAdm;
    },
  });

  const { data: recognitionStarted = false } = useQuery({
    queryKey: ['budget-recognition-started', id],
    enabled: !!id,
    queryFn: async () => {
      // RPC absente tant que la migration 20260716210000 n'a pas été exécutée
      // (Lovable Cloud, SQL manuel) : dans ce cas, pas de verrou (comportement actuel).
      const { data: started, error } = await (supabase.rpc as any)(
        'budget_recognition_started',
        { _budget_id: id },
      );
      if (error) return false;
      return !!started;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['budget-details', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;

      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select(`
          id, code, name, currency, initial_amount, budget_type_id, 
          start_date, end_date, recognition_method_id, milestone_mode, resale_price, status,
          recognition_methods (
            id, code, name_expense, name_revenue, description, trigger_type
          )
        `)
        .eq('id', id)
        .single();

      if (budgetError || !budget) return null;

      const [poRes, milestonesRes] = await Promise.all([
        supabase
          .from('purchase_orders')
          .select('id, po_number, supplier_id, total_amount, currency, status, created_at, supplier:suppliers(name, is_active)')
          .eq('budget_id', budget.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('budget_milestones')
          .select('*')
          .eq('budget_id', budget.id)
          .order('order_index', { ascending: true }),
      ]);

      if (poRes.error) throw poRes.error;

      const poList = (poRes.data || []) as any[];
      const poIds = poList.map((po) => po.id);
      const milestones = milestonesRes.data || [];

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
        milestones,
        recognitionMethod: (budget as any).recognition_methods || null,
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

  const { budget, purchaseOrders, metrics, recognitionMethod, milestones } = data;

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
          <div>
            <CardTitle className="text-xl">{budget.name}</CardTitle>
            <CardDescription className="mt-1">
              Code: {budget.code} | Type: <Badge variant="secondary">{budget.budget_type_id}</Badge>
            </CardDescription>
          </div>
          <div className="pt-2">
            {/* Lecture claire de l'enveloppe de dépenses (provision de charges) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {budget.resale_price ? (
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">CA initial (prix de vente)</p>
                  <p className="text-sm font-medium">{formatMoney(budget.currency, Number(budget.resale_price))}</p>
                </div>
              ) : null}
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Provision de charges</p>
                <p className="text-sm font-medium">{formatMoney(budget.currency, metrics.initialAmount)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Engagé (BdC)</p>
                <p className="text-sm font-medium">{formatMoney(budget.currency, metrics.sentAmount)}</p>
              </div>
              <div className="rounded-lg bg-brand/10 border border-brand/30 px-3 py-2">
                <p className="text-[11px] text-brand">Disponible pour dépenses</p>
                <p className={`text-sm font-semibold ${metrics.availableAmount < 0 ? 'text-red-600' : 'text-brand'}`}>
                  {formatMoney(budget.currency, metrics.availableAmount)}
                </p>
              </div>
            </div>
            <BudgetWaterfallChart
              currency={budget.currency}
              initialAmount={metrics.initialAmount}
              sentAmount={metrics.sentAmount}
              receivedAmount={metrics.receivedAmount}
              availableAmount={metrics.availableAmount}
              resalePrice={budget.resale_price ?? undefined}
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
                      <TableCell>
                        <Link to={`/vendors/${po.supplier_id}`} className="hover:text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                          {po.supplier?.name || 'Fournisseur inconnu'}
                        </Link>
                        {po.supplier?.is_active === false && (
                          <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0">
                            KYC en attente
                          </Badge>
                        )}
                      </TableCell>
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

      {/* Montants du budget (CA initial / provision de charges) + historique */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Montants du budget & historique</CardTitle>
          <CardDescription>Évolution du CA initial et de la provision de charges (journalisée).</CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetAmountsSection
            budgetId={budget.id}
            currency={budget.currency}
            initialAmount={metrics.initialAmount}
            resalePrice={budget.resale_price ?? null}
          />
        </CardContent>
      </Card>

      {/* Recognition method & milestones section */}
      <BudgetRecognitionSection
        budgetId={budget.id}
        recognitionMethod={recognitionMethod}
        milestones={milestones}
        milestoneMode={budget.milestone_mode}
        budgetStartDate={budget.start_date}
        budgetEndDate={budget.end_date}
        recognitionStarted={recognitionStarted}
        isAdmin={isAdmin}
        onMilestonesUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['budget-details', id] });
        }}
        onMethodChanged={() => {
          queryClient.invalidateQueries({ queryKey: ['budget-details', id] });
          queryClient.invalidateQueries({ queryKey: ['budget-recognition-started', id] });
          queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }}
      />

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
