import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MilestoneTimelineDialog, Milestone } from '@/components/budget/MilestoneTimelineDialog';
import { SupplierBlock } from '@/components/budget/PerSupplierMilestoneView';
import { MilestoneMode } from '@/models/Budget';

import { BasicInfoCard } from '@/components/create-budget/BasicInfoCard';
import { FinancialDetailsCard } from '@/components/create-budget/FinancialDetailsCard';
import { ExpenseTypesCard } from '@/components/create-budget/ExpenseTypesCard';
import { RecognitionMethodCard } from '@/components/create-budget/RecognitionMethodCard';
import { FormValues, BUDGET_TYPES, MILESTONE_METHOD_CODE, formatBudgetCode } from '@/components/create-budget/types';

interface CreateBudgetProps {
  embedded?: boolean;
  onCreated?: (budget: any) => void;
  onCancel?: () => void;
}

const CreateBudget = ({ embedded = false, onCreated, onCancel }: CreateBudgetProps = {}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [milestoneMode, setMilestoneMode] = useState<MilestoneMode>('global');
  const [supplierBlocks, setSupplierBlocks] = useState<SupplierBlock[]>([]);

  const { data: recognitionMethods = [] } = useQuery({
    queryKey: ['recognition-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recognition_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormValues>({
    defaultValues: {
      budgetTypeId: '',
      name: '',
      currency: 'EUR',
      initialAmount: 0,
      resalePrice: 0,
      startDate: '',
      endDate: '',
      recognitionMethodId: '',
      expenseTypes: [],
    },
  });

  const selectedBudgetTypeId = useWatch({ control: form.control, name: 'budgetTypeId' });
  const selectedRecognitionMethodId = useWatch({ control: form.control, name: 'recognitionMethodId' });
  const initialAmount = useWatch({ control: form.control, name: 'initialAmount' });
  const resalePrice = useWatch({ control: form.control, name: 'resalePrice' });
  const startDate = useWatch({ control: form.control, name: 'startDate' });
  const endDate = useWatch({ control: form.control, name: 'endDate' });

  const isProjectType = selectedBudgetTypeId === 'project';

  const generatedCode = useMemo(() => {
    const budgetType = BUDGET_TYPES.find(t => t.id === selectedBudgetTypeId);
    if (!budgetType) return '';
    return formatBudgetCode(budgetType.poFormat, budgetType.currentSequence);
  }, [selectedBudgetTypeId]);

  const selectedMethod = useMemo(() => {
    return recognitionMethods.find(m => m.id === selectedRecognitionMethodId);
  }, [recognitionMethods, selectedRecognitionMethodId]);

  const isMilestoneMethod = selectedMethod?.code === MILESTONE_METHOD_CODE;

  const margin = useMemo(() => {
    if (!isProjectType) return null;
    return resalePrice - initialAmount;
  }, [isProjectType, resalePrice, initialAmount]);

  const marginPercentage = useMemo(() => {
    if (!isProjectType || resalePrice === 0) return null;
    return ((margin || 0) / resalePrice) * 100;
  }, [isProjectType, resalePrice, margin]);

  const createBudgetMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { getCurrentOrganizationId } = await import('@/utils/organization');
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');

      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          code: generatedCode,
          name: data.name,
          budget_type_id: data.budgetTypeId,
          currency: data.currency,
          initial_amount: data.initialAmount,
          resale_price: isProjectType ? data.resalePrice : null,
          recognition_method_id: data.recognitionMethodId || null,
          expense_types: data.expenseTypes,
          start_date: data.startDate || null,
          end_date: data.endDate || null,
          status: 'active',
          milestone_mode: milestoneMode,
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      if (isMilestoneMethod) {
        let milestonesData: any[] = [];

        if (milestoneMode === 'global' && milestones.length > 0) {
          milestonesData = milestones.map((m, index) => ({
            budget_id: budget.id,
            organization_id: organizationId,
            title: m.title,
            description: m.description || null,
            target_date: m.targetDate.toISOString().split('T')[0],
            completion_percentage: m.completionPercentage,
            is_completed: false,
            order_index: index,
            supplier_id: m.supplierId || null,
            assignment_status: 'pending',
          }));
        } else if (milestoneMode === 'per_supplier') {
          let globalIndex = 0;
          supplierBlocks.forEach(block => {
            block.milestones.forEach(m => {
              milestonesData.push({
                budget_id: budget.id,
                organization_id: organizationId,
                title: m.title,
                description: m.description || null,
                target_date: m.targetDate.toISOString().split('T')[0],
                completion_percentage: m.completionPercentage,
                is_completed: false,
                order_index: globalIndex++,
                supplier_id: m.supplierId || null,
                supplier_type_id: m.supplierTypeId || null,
                supplier_type_id_original: m.supplierTypeIdOriginal || null,
                article_type_id: m.articleTypeId || null,
                assignment_status: m.assignmentStatus || 'pending',
              });
            });
          });
        }

        if (milestonesData.length > 0) {
          const { error: milestonesError } = await supabase
            .from('budget_milestones')
            .insert(milestonesData);
          if (milestonesError) {
            // Rollback : on ne laisse pas un budget orphelin (source des doublons)
            await supabase.from('budgets').delete().eq('id', budget.id);
            throw milestonesError;
          }
        }
      }

      return budget;
    },
    onSuccess: (budget) => {
      if (!budget?.id) {
        toast({
          title: "Erreur",
          description: "Le budget a été créé mais n'a pas été renvoyé par le backend.",
          variant: "destructive",
        });
        return;
      }
      // Mode encapsulé (modale) : on rend la main à l'appelant sans naviguer
      if (embedded) {
        toast({
          title: "Budget créé",
          description: `Le code projet ${budget.code} a été créé.`,
        });
        onCreated?.(budget);
        return;
      }
      toast({
        title: "Budget créé",
        description: `Le budget ${generatedCode} a été créé avec succès.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/purchase-orders/create', {
              state: {
                budgetId: budget.id,
                budgetName: budget.name,
                budgetCode: budget.code,
                budgetCurrency: budget.currency,
              }
            })}
          >
            Créer un BC
          </Button>
        ),
      });
      navigate(`/budgets/${budget.id}`);
    },
    onError: (error: any) => {
      console.error('[CreateBudget] Error:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de créer le budget.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!data.budgetTypeId) {
      toast({ title: "Champ requis", description: "Veuillez sélectionner un type de budget.", variant: "destructive" });
      return;
    }
    if (!data.name.trim()) {
      toast({ title: "Champ requis", description: "Veuillez saisir un nom pour le budget.", variant: "destructive" });
      return;
    }
    const hasMilestones = milestoneMode === 'global'
      ? milestones.length > 0
      : supplierBlocks.some(b => b.milestones.length > 0);
    if (isMilestoneMethod && !hasMilestones) {
      toast({ title: "Jalons requis", description: "Veuillez définir au moins un jalon.", variant: "destructive" });
      return;
    }
    createBudgetMutation.mutate(data);
  };

  const isSubmitting = createBudgetMutation.isPending;

  return (
    <div className={embedded ? "space-y-6" : "space-y-6 pb-24"}>
      {!embedded && (
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/budgets')} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Créer un budget</h1>
            <p className="text-muted-foreground">Configurez un nouveau budget pour vos projets ou dépenses</p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BasicInfoCard form={form} generatedCode={generatedCode} />

            <FinancialDetailsCard
              form={form}
              isProjectType={isProjectType}
              margin={margin}
              marginPercentage={marginPercentage}
              resalePrice={resalePrice}
              initialAmount={initialAmount}
            />

            <ExpenseTypesCard form={form} />

            <RecognitionMethodCard
              form={form}
              recognitionMethods={recognitionMethods}
              selectedMethod={selectedMethod}
              isMilestoneMethod={isMilestoneMethod}
              milestones={milestones}
              onOpenMilestoneDialog={() => setMilestoneDialogOpen(true)}
            />
          </div>

          <div className="sticky bottom-0 bg-background border-t border-border -mx-8 px-8 py-4 flex justify-end gap-4 z-10">
            <Button type="button" variant="outline" onClick={() => (embedded && onCancel ? onCancel() : navigate('/budgets'))} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" className="bg-po-blue hover:bg-blue-600" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer le budget'
              )}
            </Button>
          </div>
        </form>
      </Form>

      <MilestoneTimelineDialog
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        milestones={milestones}
        onMilestonesChange={setMilestones}
        projectStartDate={startDate ? new Date(startDate) : undefined}
        projectEndDate={endDate ? new Date(endDate) : undefined}
        milestoneMode={milestoneMode}
        onMilestoneModeChange={setMilestoneMode}
        supplierBlocks={supplierBlocks}
        onSupplierBlocksChange={setSupplierBlocks}
      />
    </div>
  );
};

export default CreateBudget;
