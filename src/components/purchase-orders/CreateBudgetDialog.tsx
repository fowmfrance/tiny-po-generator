import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BudgetCurrency, BudgetRecognitionType } from '@/services/budgetService';

interface FormValues {
  code: string;
  name: string;
  type: 'Project' | 'G&A';
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

const CreateBudgetDialog: React.FC<CreateBudgetDialogProps> = ({
  isOpen,
  onOpenChange,
  onBudgetCreated,
}) => {
  const { toast } = useToast();
  const [recognitionType, setRecognitionType] = useState<BudgetRecognitionType>('linear');

  const form = useForm<FormValues>({
    defaultValues: {
      code: '',
      name: '',
      type: 'Project',
      currency: 'EUR',
      initialAmount: 0,
      startDate: '',
      endDate: '',
      recognitionType: 'linear',
      completionPercentage: 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    // Generate a mock ID - in production this would come from the backend
    const newBudget: CreatedBudget = {
      id: `budget-${Date.now()}`,
      name: data.name,
      code: data.code,
      currency: data.currency,
      startDate: data.startDate,
      endDate: data.endDate,
      recognitionType: data.recognitionType,
      completionPercentage: data.completionPercentage,
    };

    toast({
      title: "Budget créé",
      description: `Le budget "${data.name}" a été créé avec succès.`,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code du budget</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: PRJ-2023-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Un identifiant unique pour ce budget
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de budget</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Project">Projet</SelectItem>
                        <SelectItem value="G&A">Frais généraux</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <div className="grid grid-cols-2 gap-2">
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
            </div>

            <FormField
              control={form.control}
              name="recognitionType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Méthode de reconnaissance</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value: BudgetRecognitionType) => {
                        field.onChange(value);
                        setRecognitionType(value);
                      }}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="linear" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Reconnaissance linéaire (basée sur le temps écoulé)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="completion" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Reconnaissance à l'avancement
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {recognitionType === 'completion' && (
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
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
