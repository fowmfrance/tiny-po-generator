
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Calendar, HelpCircle, Lock, TrendingUp, TrendingDown, Flag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BudgetCurrency } from '@/services/budgetService';
import { supabase } from '@/integrations/supabase/client';
import { MilestoneTimelineDialog, Milestone } from '@/components/budget/MilestoneTimelineDialog';

// Types de dépenses disponibles
const EXPENSE_TYPES = [
  { 
    id: 'supplier_invoices', 
    label: 'FACTURES FOURNISSEURS', 
    description: 'Prestations de services avec bon de commande et paiement différé' 
  },
  { 
    id: 'card_purchases', 
    label: 'ACHATS CARTE BANCAIRE', 
    description: 'Dépenses immédiates par CB professionnelle avec justificatif direct' 
  },
  { 
    id: 'recurring_debits', 
    label: 'PRÉLÈVEMENTS RÉCURRENTS', 
    description: 'Abonnements et charges automatiques avec mandat SEPA' 
  },
];

interface FormValues {
  budgetTypeId: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  resalePrice: number;
  startDate: string;
  endDate: string;
  recognitionMethodId: string;
  expenseTypes: string[];
}

// Code de la méthode milestone
const MILESTONE_METHOD_CODE = 'poc_milestone';

// Mock budget types (sera remplacé par DB)
const BUDGET_TYPES = [
  { id: 'project', name: 'Projet', poFormat: 'PRJ-{YYYY}-{NNN}', currentSequence: 42 },
  { id: 'ga', name: 'Frais généraux', poFormat: 'GA-{YYYY}-{NNN}', currentSequence: 15 },
  { id: 'capex', name: 'CAPEX', poFormat: 'CPX-{YYYY}-{NNN}', currentSequence: 8 },
];

const formatBudgetCode = (format: string, sequence: number): string => {
  const year = new Date().getFullYear().toString();
  const paddedSequence = (sequence + 1).toString().padStart(3, '0');
  return format
    .replace('{YYYY}', year)
    .replace('{NNN}', paddedSequence);
};

const CreateBudget = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State pour les milestones
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);

  // Fetch recognition methods from DB
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

  // Watch budget type to auto-generate code
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

  // Déterminer si la méthode sélectionnée est "Milestone"
  const isMilestoneMethod = selectedMethod?.code === MILESTONE_METHOD_CODE;

  // Calcul de la marge pour les projets
  const margin = useMemo(() => {
    if (!isProjectType) return null;
    return resalePrice - initialAmount;
  }, [isProjectType, resalePrice, initialAmount]);

  const marginPercentage = useMemo(() => {
    if (!isProjectType || resalePrice === 0) return null;
    return ((margin || 0) / resalePrice) * 100;
  }, [isProjectType, resalePrice, margin]);

  // Mutation pour sauvegarder le budget
  const createBudgetMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log('[CreateBudget] Starting mutation with data:', data);
      
      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[CreateBudget] Auth check:', { userId: user?.id, authError });
      if (!user) {
        console.error('[CreateBudget] No user found!');
        throw new Error('Non authentifié');
      }

      const insertData = {
        user_id: user.id,
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
      };
      
      console.log('[CreateBudget] Inserting budget:', insertData);

      // 1. Créer le budget
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert(insertData)
        .select()
        .single();

      console.log('[CreateBudget] Insert result:', { budget, budgetError });

      if (budgetError) {
        console.error('[CreateBudget] Budget insert error:', budgetError);
        throw budgetError;
      }

      // 2. Si méthode milestone, créer les milestones
      if (isMilestoneMethod && milestones.length > 0) {
        const milestonesData = milestones.map((m, index) => ({
          budget_id: budget.id,
          title: m.title,
          description: m.description || null,
          target_date: m.targetDate.toISOString().split('T')[0],
          completion_percentage: m.completionPercentage,
          is_completed: false,
          order_index: index,
        }));

        const { error: milestonesError } = await supabase
          .from('budget_milestones')
          .insert(milestonesData);

        if (milestonesError) throw milestonesError;
      }

      return budget;
    },
    onSuccess: (budget) => {
      toast({
        title: "Budget créé",
        description: `Le budget ${generatedCode} a été créé avec succès.`,
      });
      navigate(`/budgets/${budget.id}`);
    },
    onError: (error) => {
      console.error('Error creating budget:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le budget. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log('[CreateBudget] Form submitted with data:', data);
    console.log('[CreateBudget] Generated code:', generatedCode);
    console.log('[CreateBudget] Milestones:', milestones);
    // Validation
    if (!data.budgetTypeId) {
      toast({
        title: "Champ requis",
        description: "Veuillez sélectionner un type de budget.",
        variant: "destructive",
      });
      return;
    }

    if (!data.name.trim()) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir un nom pour le budget.",
        variant: "destructive",
      });
      return;
    }

    if (isMilestoneMethod && milestones.length === 0) {
      toast({
        title: "Jalons requis",
        description: "Veuillez définir au moins un jalon pour la méthode Milestone.",
        variant: "destructive",
      });
      return;
    }

    createBudgetMutation.mutate(data);
  };

  const isSubmitting = createBudgetMutation.isPending;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/budgets')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Créer un budget</h1>
          <p className="text-muted-foreground">Configurez un nouveau budget pour vos projets ou dépenses</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
                <CardDescription>
                  Saisissez les informations de base pour ce budget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 1. Type de budget EN PREMIER - pilote le format du code */}
                <FormField
                  control={form.control}
                  name="budgetTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de budget</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type de budget" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BUDGET_TYPES.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Détermine le format de numérotation du code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 2. Code du budget AUTO-GÉNÉRÉ (lecture seule) */}
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Code du budget
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </FormLabel>
                  <div className="relative">
                    <Input 
                      value={generatedCode} 
                      readOnly 
                      disabled
                      placeholder="Sélectionnez un type de budget"
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <FormDescription>
                    Auto-généré selon le type de budget sélectionné
                  </FormDescription>
                </FormItem>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du budget</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Budget Projet Alpha" {...field} />
                      </FormControl>
                      <FormDescription>
                        Un nom descriptif pour ce budget
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Détails financiers</CardTitle>
                <CardDescription>
                  Définissez les paramètres financiers de ce budget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Devise</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une devise" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="USD">USD - Dollar Américain</SelectItem>
                          <SelectItem value="GBP">GBP - Livre Sterling</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="initialAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isProjectType ? 'Budget des coûts' : 'Montant initial'}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                        />
                      </FormControl>
                      <FormDescription>
                        {isProjectType ? 'Somme des coûts prévisionnels du projet' : 'Le montant de départ de ce budget'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Prix de revente - uniquement pour les projets */}
                {isProjectType && (
                  <>
                    <FormField
                      control={form.control}
                      name="resalePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix de revente extérieur</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0,00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                            />
                          </FormControl>
                          <FormDescription>
                            Montant facturé au client final
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Affichage de la marge */}
                    {(resalePrice > 0 || initialAmount > 0) && (
                      <div className={`p-4 rounded-md border ${
                        margin && margin >= 0 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                          : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-2">
                            {margin && margin >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            Marge prévisionnelle
                          </span>
                          <div className="text-right">
                            <span className={`font-bold ${
                              margin && margin >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {new Intl.NumberFormat('fr-FR', { 
                                style: 'currency', 
                                currency: form.watch('currency') || 'EUR' 
                              }).format(margin || 0)}
                            </span>
                            {marginPercentage !== null && (
                              <span className={`ml-2 text-sm ${
                                marginPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ({marginPercentage.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de début</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type="date" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type="date" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Types de dépenses */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Types de dépenses autorisées</CardTitle>
                <CardDescription>
                  Sélectionnez les types de dépenses acceptés pour ce budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="expenseTypes"
                  render={() => (
                    <FormItem>
                      <div className="grid gap-4">
                        {EXPENSE_TYPES.map((type) => (
                          <FormField
                            key={type.id}
                            control={form.control}
                            name="expenseTypes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={type.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, type.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== type.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-semibold cursor-pointer">
                                      {type.label}
                                    </FormLabel>
                                    <FormDescription className="text-sm">
                                      {type.description}
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Reconnaissance des charges</CardTitle>
                <CardDescription>
                  Définissez comment les charges seront reconnues à des fins comptables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 3. Méthode de reconnaissance en SÉLECTEUR SIMPLE */}
                <FormField
                  control={form.control}
                  name="recognitionMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Méthode de reconnaissance
                        {selectedMethod && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p className="font-medium mb-1">{selectedMethod.name_expense}</p>
                                <p className="text-sm">{selectedMethod.description}</p>
                                {selectedMethod.example && (
                                  <p className="text-sm mt-2 text-muted-foreground italic">
                                    Ex: {selectedMethod.example}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une méthode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recognitionMethods.map(method => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name_expense}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Détermine comment les charges sont réparties dans le temps
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedMethod && (
                  <div className="bg-muted/50 p-4 rounded-md border">
                    <h4 className="text-sm font-medium mb-2">{selectedMethod.name_expense}</h4>
                    <p className="text-sm text-muted-foreground">{selectedMethod.description}</p>
                    {selectedMethod.use_cases && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Cas d'usage :</strong> {selectedMethod.use_cases}
                      </p>
                    )}
                  </div>
                )}

                {/* Section Milestones - uniquement pour méthode PoC Milestone */}
                {isMilestoneMethod && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Flag className="h-4 w-4 text-primary" />
                          Jalons du projet (Milestones)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Définissez les livrables attendus pour calculer l'avancement
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMilestoneDialogOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Flag className="h-4 w-4" />
                        {milestones.length > 0 
                          ? `Modifier (${milestones.length} jalons)` 
                          : 'Définir les jalons'
                        }
                      </Button>
                    </div>

                    {milestones.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Jalons définis</span>
                          <span className="font-medium">{milestones.length} livrable(s)</span>
                        </div>
                        <div className="space-y-1">
                          {milestones.slice(0, 3).map((m, i) => (
                            <div 
                              key={m.id}
                              className="flex items-center gap-2 text-sm p-2 bg-background rounded border"
                            >
                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                #{i + 1}
                              </span>
                              <span className="truncate flex-1">{m.title}</span>
                              <span className="text-muted-foreground text-xs">
                                {m.targetDate.toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          ))}
                          {milestones.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center py-1">
                              + {milestones.length - 3} autre(s) jalon(s)
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {milestones.length === 0 && (
                      <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                        <Flag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucun jalon défini</p>
                        <p className="text-xs">Cliquez sur le bouton ci-dessus pour ajouter des livrables</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/budgets')}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="bg-po-blue hover:bg-blue-600"
              disabled={isSubmitting}
            >
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

      {/* Modale de définition des milestones */}
      <MilestoneTimelineDialog
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        milestones={milestones}
        onMilestonesChange={setMilestones}
        projectStartDate={startDate ? new Date(startDate) : undefined}
        projectEndDate={endDate ? new Date(endDate) : undefined}
      />
    </div>
  );
};

export default CreateBudget;
