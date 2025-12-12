
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Calendar } from 'lucide-react';
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

const CreateBudget = () => {
  const navigate = useNavigate();
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
    // In a real app, this would save to the backend
    console.log('Form data:', data);
    
    toast({
      title: "Budget créé",
      description: "Le budget a été créé avec succès.",
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type de budget" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Project">Projet</SelectItem>
                          <SelectItem value="G&A">Frais généraux</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Le type de dépenses couvert par ce budget
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
                      <FormDescription>
                        Linéaire : Les charges sont reconnues uniformément sur la durée du budget.
                        <br />
                        Avancement : Les charges sont reconnues en fonction du pourcentage d'avancement.
                      </FormDescription>
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
                            onChange={(e) => field.onChange(parseFloat(e.target.value))} 
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
                
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Fonctionnement de la reconnaissance des charges</h4>
                  <p className="text-sm text-blue-700">
                    <strong>Reconnaissance linéaire :</strong> Les charges sont réparties uniformément sur la période du budget. Par exemple, si votre budget couvre 10 mois et que 5 mois se sont écoulés, 50% du budget est considéré comme reconnu.
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>À l'avancement :</strong> Les charges sont reconnues en fonction du pourcentage d'avancement que vous spécifiez. Vous devrez mettre à jour manuellement ce pourcentage au fur et à mesure de l'avancement du projet.
                  </p>
                </div>
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
