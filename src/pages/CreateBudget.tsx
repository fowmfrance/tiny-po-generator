
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
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
import { ArrowLeft, Calendar, HelpCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BudgetCurrency } from '@/services/budgetService';
import { supabase } from '@/integrations/supabase/client';

interface FormValues {
  budgetTypeId: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  startDate: string;
  endDate: string;
  recognitionMethodId: string;
}

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
      startDate: '',
      endDate: '',
      recognitionMethodId: '',
    },
  });

  // Watch budget type to auto-generate code
  const selectedBudgetTypeId = useWatch({ control: form.control, name: 'budgetTypeId' });
  const selectedRecognitionMethodId = useWatch({ control: form.control, name: 'recognitionMethodId' });

  const generatedCode = useMemo(() => {
    const budgetType = BUDGET_TYPES.find(t => t.id === selectedBudgetTypeId);
    if (!budgetType) return '';
    return formatBudgetCode(budgetType.poFormat, budgetType.currentSequence);
  }, [selectedBudgetTypeId]);

  const selectedMethod = useMemo(() => {
    return recognitionMethods.find(m => m.id === selectedRecognitionMethodId);
  }, [recognitionMethods, selectedRecognitionMethodId]);

  const onSubmit = (data: FormValues) => {
    const budgetType = BUDGET_TYPES.find(t => t.id === data.budgetTypeId);
    console.log('Form data:', {
      ...data,
      code: generatedCode,
      type: budgetType?.name,
    });
    
    toast({
      title: "Budget créé",
      description: `Le budget ${generatedCode} a été créé avec succès.`,
    });
    
    navigate('/budgets');
  };
  
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
                      <FormLabel>Montant initial</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>
                        Le montant de départ de ce budget
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/budgets')}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="bg-po-blue hover:bg-blue-600"
            >
              Créer le budget
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateBudget;
