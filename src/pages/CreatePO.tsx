
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  Calendar,
  AlertCircle,
  CircleCheck,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  validateBudgetActive, 
  BudgetCurrency, 
  BudgetRecognitionType, 
  calculateRecognizedAmount,
  defaultCurrency
} from '@/services/budgetService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BudgetNavState {
  budgetId?: string;
  budgetName?: string;
  budgetCode?: string;
  budgetStartDate?: Date | null;
  budgetEndDate?: Date | null;
  budgetCurrency?: BudgetCurrency;
  budgetRecognitionType?: BudgetRecognitionType;
  budgetCompletionPercentage?: number;
}

const CreatePO = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const budgetInfo: BudgetNavState = location.state || {};
  const { 
    budgetId, 
    budgetName, 
    budgetCode,
    budgetStartDate,
    budgetEndDate,
    budgetCurrency,
    budgetRecognitionType,
    budgetCompletionPercentage
  } = budgetInfo;

  const [isFromBudget, setIsFromBudget] = useState<boolean>(!!budgetId);
  const [budgetStatus, setBudgetStatus] = useState<{ active: boolean; message?: string }>({ active: true });
  const [selectedBudget, setSelectedBudget] = useState<string>(budgetId || "");

  // Mock budget list for selector
  const budgetList = [
    { id: '1', name: 'Budget Projet Alpha', code: 'PRJ-2023-001', currency: 'EUR' },
    { id: '2', name: 'Frais G&A Q3', code: 'GA-2023-002', currency: 'EUR' },
    { id: '3', name: 'Budget Projet Beta', code: 'PRJ-2023-003', currency: 'GBP' },
  ];

  useEffect(() => {
    if (budgetId && (budgetStartDate || budgetEndDate)) {
      const status = validateBudgetActive(
        budgetStartDate ? new Date(budgetStartDate) : null,
        budgetEndDate ? new Date(budgetEndDate) : null
      );
      setBudgetStatus(status);
    }
  }, [budgetId, budgetStartDate, budgetEndDate]);

  const vendorList = [
    { id: '1', name: 'Apple Inc.' },
    { id: '2', name: 'Microsoft Corp' },
    { id: '3', name: 'Dell Technologies' },
    { id: '4', name: 'Amazon Business' },
    { id: '5', name: 'Samsung Electronics' },
  ];

  const exampleItems = [
    {
      description: 'MacBook Pro 14"',
      quantity: 2,
      unitPrice: 1999.99,
      total: 3999.98
    },
    {
      description: 'Souris sans fil',
      quantity: 5,
      unitPrice: 99.99,
      total: 499.95
    },
    {
      description: 'Adaptateur USB-C',
      quantity: 10,
      unitPrice: 49.99,
      total: 499.90
    }
  ];

  const recognitionData = budgetId && budgetRecognitionType && budgetStartDate && budgetEndDate ? 
    calculateRecognizedAmount(
      100, // Using 100 as a percent value for visualization
      budgetRecognitionType,
      new Date(budgetStartDate),
      new Date(budgetEndDate),
      budgetCompletionPercentage
    ) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (budgetId && !budgetStatus.active) {
      toast({
        variant: "destructive",
        title: "Impossible de créer le Bon de Commande",
        description: budgetStatus.message,
      });
      return;
    }
    
    toast({
      title: "Bon de Commande Créé",
      description: "Le bon de commande a été créé avec succès.",
    });
    
    if (budgetId) {
      navigate(`/budgets/${budgetId}`);
    } else if (selectedBudget) {
      navigate(`/budgets/${selectedBudget}`);
    } else {
      navigate('/purchase-orders');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => budgetId ? navigate(`/budgets/${budgetId}`) : navigate('/purchase-orders')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Créer un Bon de Commande</h1>
          {budgetName && (
            <p className="text-muted-foreground">Pour le budget: {budgetName}</p>
          )}
        </div>
      </div>

      {budgetId && !budgetStatus.active && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Budget inactif</AlertTitle>
          <AlertDescription>
            {budgetStatus.message} Vous ne pouvez pas créer de bons de commande pour ce budget.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations du Bon de Commande</CardTitle>
              <CardDescription>
                Entrez les détails pour ce bon de commande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!budgetId && (
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Select 
                      value={selectedBudget} 
                      onValueChange={(value) => setSelectedBudget(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un budget" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetList.map(budget => (
                          <SelectItem key={budget.id} value={budget.id}>
                            {budget.name} ({budget.code}) - {budget.currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="poNumberFormat">Format du N° BC</Label>
                  <Input 
                    id="poNumberFormat" 
                    placeholder="PR-{YYYY}-{000}" 
                    defaultValue={budgetCode ? `${budgetCode}-` : "BC-2023-"} 
                  />
                </div>
              </div>

              {budgetId && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Ce BC sera associé au budget : {budgetName}</p>
                      {(budgetStartDate || budgetEndDate) && (
                        <p className="text-xs text-blue-600 mt-1">
                          Période du budget : {budgetStartDate ? new Date(budgetStartDate).toLocaleDateString() : 'Pas de date de début'} - {budgetEndDate ? new Date(budgetEndDate).toLocaleDateString() : 'Pas de date de fin'}
                        </p>
                      )}
                    </div>
                    {budgetRecognitionType && (
                      <Badge variant="outline" className="capitalize">
                        {budgetRecognitionType === 'linear' ? 'Reconnaissance linéaire' : 'Reconnaissance par complétion'}
                      </Badge>
                    )}
                  </div>
                  
                  {recognitionData && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-700">Progression de la reconnaissance</span>
                        <span className="text-blue-700">{recognitionData.recognitionPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={recognitionData.recognitionPercentage} className="h-1.5" />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="vendor">Fournisseur</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorList.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select defaultValue={(budgetCurrency || defaultCurrency).toLowerCase()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                      <SelectItem value="usd">USD - Dollar Américain</SelectItem>
                      <SelectItem value="gbp">GBP - Livre Sterling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedDate">Date de livraison prévue</Label>
                  <div className="relative">
                    <Input 
                      id="expectedDate" 
                      type="date"
                      className="pl-10"
                    />
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Entrez des notes ou exigences supplémentaires"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flux d'Approbation</CardTitle>
              <CardDescription>
                Sélectionnez le flux d'approbation pour ce bon de commande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow">Modèle de Workflow</Label>
                <Select defaultValue="standard">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Approbation Standard</SelectItem>
                    <SelectItem value="express">Approbation Express</SelectItem>
                    <SelectItem value="extended">Révision Étendue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Étapes d'Approbation</Label>
                </div>
                <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                  <div className="text-sm text-gray-500">
                    1. Responsable de Département
                  </div>
                  <div className="text-sm text-gray-500">
                    2. Approbation Financière
                  </div>
                  <div className="text-sm text-gray-500">
                    3. Approbation Finale
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Articles</CardTitle>
                  <CardDescription>
                    Ajoutez des articles à ce bon de commande
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter Article
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantité</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Prix Unitaire</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {exampleItems.map(item => (
                      <tr key={item.description}>
                        <td className="px-4 py-3">
                          <Input placeholder="Description de l'article" defaultValue={item.description} />
                        </td>
                        <td className="px-4 py-3">
                          <Input type="number" defaultValue={item.quantity} min="1" className="w-20" />
                        </td>
                        <td className="px-4 py-3">
                          <Input type="number" defaultValue={item.unitPrice} min="0" step="0.01" className="w-32" />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          €{item.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        €{exampleItems.reduce((total, item) => total + item.total, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => budgetId ? navigate(`/budgets/${budgetId}`) : navigate('/purchase-orders')}
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            className="bg-po-blue hover:bg-blue-600"
            disabled={budgetId && !budgetStatus.active}
          >
            Créer Bon de Commande
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePO;
