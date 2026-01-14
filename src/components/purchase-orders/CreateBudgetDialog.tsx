import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Calendar, Lock, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BudgetCurrency, BudgetRecognitionType } from '@/services/budgetService';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types de budget avec leur format de numérotation (mock - sera chargé depuis la DB)
interface BudgetTypeConfig {
  id: string;
  name: string;
  poFormat: string;
  currentSequence: number;
}

// Méthodes de reconnaissance (stockées en paramètres - mode lecture)
interface RecognitionMethod {
  id: BudgetRecognitionType;
  name: string;
  description: string;
  helpText: string;
}

const BUDGET_TYPES: BudgetTypeConfig[] = [
  { id: 'ga', name: 'Frais généraux (G&A)', poFormat: 'GA-{YYYY}-{SEQ}', currentSequence: 42 },
  { id: 'project', name: 'Projet', poFormat: 'PRJ-{YYYY}-{SEQ}', currentSequence: 156 },
];

const RECOGNITION_METHODS: RecognitionMethod[] = [
  { 
    id: 'linear', 
    name: 'Reconnaissance linéaire',
    description: 'Charges réparties uniformément sur la durée',
    helpText: 'Les charges sont reconnues au prorata du temps écoulé. Idéal pour les abonnements, loyers, contrats de maintenance.'
  },
  { 
    id: 'completion', 
    name: 'Reconnaissance à l\'avancement',
    description: 'Selon le % d\'avancement renseigné',
    helpText: 'Vous définissez manuellement le % d\'avancement. Idéal pour les projets avec des jalons ou livrables.'
  },
];

interface FormValues {
  budgetTypeId: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  startDate: string;
  endDate: string;
  recognitionType: BudgetRecognitionType;
  completionPercentage?: number;
}

interface CreatedBudget {
  id: string;
  name: string;
  code: string;
  currency: BudgetCurrency;
  startDate: string;
  endDate: string;
  recognitionType: BudgetRecognitionType;
  completionPercentage?: number;
}

interface CreateBudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBudgetCreated: (budget: CreatedBudget) => void;
}

// Helper pour générer l'aperçu du code
const formatBudgetCode = (format: string, seq: number): string => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  return format
    .replace('{YYYY}', String(year))
    .replace('{YY}', String(year).slice(-2))
    .replace('{MM}', month)
    .replace('{SEQ}', String(seq).padStart(4, '0'));
};

const CreateBudgetDialog: React.FC<CreateBudgetDialogProps> = ({
  isOpen,
  onOpenChange,
  onBudgetCreated,
}) => {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    defaultValues: {
      budgetTypeId: '',
      name: '',
      currency: 'EUR',
      initialAmount: 0,
      startDate: '',
      endDate: '',
      recognitionType: 'linear',
      completionPercentage: 0,
    },
  });

  // Watch le type de budget et la méthode de reconnaissance
  const selectedBudgetTypeId = useWatch({ control: form.control, name: 'budgetTypeId' });
  const selectedRecognitionType = useWatch({ control: form.control, name: 'recognitionType' });

  // Calcul du code auto-généré
  const generatedCode = useMemo(() => {
    if (!selectedBudgetTypeId) return '';
    const budgetType = BUDGET_TYPES.find(t => t.id === selectedBudgetTypeId);
    if (!budgetType) return '';
    return formatBudgetCode(budgetType.poFormat, budgetType.currentSequence + 1);
  }, [selectedBudgetTypeId]);

  // Info sur la méthode de reconnaissance sélectionnée
  const selectedMethod = useMemo(() => {
    return RECOGNITION_METHODS.find(m => m.id === selectedRecognitionType);
  }, [selectedRecognitionType]);

  const onSubmit = (data: FormValues) => {
    const newBudget: CreatedBudget = {
      id: `budget-${Date.now()}`,
      name: data.name,
      code: generatedCode,
      currency: data.currency,
      startDate: data.startDate,
      endDate: data.endDate,
      recognitionType: data.recognitionType,
      completionPercentage: data.completionPercentage,
    };

    toast({
      title: "Budget créé",
      description: `Le budget "${data.name}" (${generatedCode}) a été créé avec succès.`,
    });

    form.reset();
    onBudgetCreated(newBudget);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau budget</DialogTitle>
          <DialogDescription>
            Configurez un nouveau budget pour vos projets ou dépenses
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Type de budget (PREMIER - pilote le code) */}
            <FormField
              control={form.control}
              name="budgetTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de budget *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisissez d'abord le type de budget" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUDGET_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Le type détermine le format de numérotation automatique
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code du budget - LECTURE SEULE, auto-généré */}
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Code du budget
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </FormLabel>
                <div className="relative">
                  <Input 
                    value={generatedCode || 'Sélectionnez un type de budget'} 
                    readOnly 
                    disabled={!selectedBudgetTypeId}
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <FormDescription>
                  Généré automatiquement selon le type de budget
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

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type="date" className="pl-10" {...field} />
                      </FormControl>
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                        <Input type="date" className="pl-10" {...field} />
                      </FormControl>
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 3: Méthode de reconnaissance - SÉLECTEUR SIMPLE */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="recognitionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Méthode de reconnaissance
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Détermine comment les charges sont réparties dans le temps à des fins comptables.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisissez une méthode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RECOGNITION_METHODS.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex flex-col">
                              <span>{method.name}</span>
                              <span className="text-xs text-muted-foreground">{method.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Aide contextuelle sur la méthode sélectionnée */}
              {selectedMethod && (
                <div className="bg-muted/50 p-3 rounded-md border text-sm">
                  <p className="text-muted-foreground">{selectedMethod.helpText}</p>
                </div>
              )}

              {/* Champ conditionnel pour le % d'avancement */}
              {selectedRecognitionType === 'completion' && (
                <FormField
                  control={form.control}
                  name="completionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pourcentage d'avancement actuel</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Le pourcentage actuel d'avancement de la prestation (0-100%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedBudgetTypeId}
              >
                Créer le budget
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBudgetDialog;
