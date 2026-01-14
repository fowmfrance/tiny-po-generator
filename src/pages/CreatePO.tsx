
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  Lock
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
import CreateBudgetDialog from '@/components/purchase-orders/CreateBudgetDialog';
import InviteVendorQuickDialog from '@/components/purchase-orders/InviteVendorQuickDialog';

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

interface BudgetOption {
  id: string;
  name: string;
  code: string;
  currency: string;
}

interface VendorOption {
  id: string;
  name: string;
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
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  
  // Dialog states
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [isInviteVendorOpen, setIsInviteVendorOpen] = useState(false);
  
  // Mock: in production, this would come from user context
  const isAdmin = true; // TODO: Get from auth context

  // Budgets et fournisseurs depuis la base de données
  const [budgetList, setBudgetList] = useState<BudgetOption[]>([]);
  const [vendorList, setVendorList] = useState<VendorOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Charger les budgets et fournisseurs depuis la base
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingData(false);
          return;
        }

        // Charger les budgets
        const { data: budgets, error: budgetsError } = await supabase
          .from('budgets')
          .select('id, name, code, currency')
          .eq('status', 'active')
          .order('name');
        
        if (budgetsError) {
          console.error('Error loading budgets:', budgetsError);
        } else if (budgets) {
          setBudgetList(budgets.map(b => ({
            id: b.id,
            name: b.name,
            code: b.code,
            currency: b.currency
          })));
        }

        // Charger les fournisseurs
        const { data: suppliers, error: suppliersError } = await supabase
          .from('suppliers')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
        
        if (suppliersError) {
          console.error('Error loading suppliers:', suppliersError);
        } else if (suppliers) {
          setVendorList(suppliers.map(s => ({
            id: s.id,
            name: s.name
          })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Note: Les dates du budget sont les dates de réalisation du projet
  // Un bon de commande peut être émis avant la date de début pour lancer les travaux

  // Gestion des articles du bon de commande
  interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }
  ]);

  const addItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const recognitionData = budgetId && budgetRecognitionType && budgetStartDate && budgetEndDate ? 
    calculateRecognizedAmount(
      100, // Using 100 as a percent value for visualization
      budgetRecognitionType,
      new Date(budgetStartDate),
      new Date(budgetEndDate),
      budgetCompletionPercentage
    ) : null;

  const handleBudgetSelectChange = (value: string) => {
    if (value === 'create-new') {
      if (isAdmin) {
        setIsCreateBudgetOpen(true);
      }
      return;
    }
    setSelectedBudget(value);
  };

  const handleVendorSelectChange = (value: string) => {
    if (value === 'invite-new') {
      setIsInviteVendorOpen(true);
      return;
    }
    setSelectedVendor(value);
  };

  const handleBudgetCreated = (budget: { id: string; name: string; code: string; currency: string }) => {
    // Add the new budget to the list
    setBudgetList(prev => [...prev, { 
      id: budget.id, 
      name: budget.name, 
      code: budget.code, 
      currency: budget.currency 
    }]);
    // Select the new budget
    setSelectedBudget(budget.id);
    setIsCreateBudgetOpen(false);
  };

  const handleVendorInvited = (vendor: { id: string; name: string; email: string }) => {
    // Add the new vendor to the list with a pending status indication
    setVendorList(prev => [...prev, { 
      id: vendor.id, 
      name: `${vendor.name} (KYC en attente)` 
    }]);
    // Select the new vendor
    setSelectedVendor(vendor.id);
    setIsInviteVendorOpen(false);
    
    toast({
      title: "Bon de commande en brouillon",
      description: "Ce bon de commande sera conservé en brouillon jusqu'à validation du KYC du fournisseur.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
              {!budgetId && (
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Select 
                    value={selectedBudget} 
                    onValueChange={handleBudgetSelectChange}
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
                      <SelectItem 
                        value="create-new" 
                        disabled={!isAdmin}
                        className={!isAdmin ? "opacity-50" : "text-primary font-medium"}
                      >
                        <span className="flex items-center gap-2">
                          {!isAdmin && <Lock className="h-3 w-3" />}
                          <Plus className="h-3 w-3" />
                          Créer un budget
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                <Select value={selectedVendor} onValueChange={handleVendorSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorList.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="invite-new" className="text-primary font-medium">
                      <span className="flex items-center gap-2">
                        <Plus className="h-3 w-3" />
                        Inviter un fournisseur
                      </span>
                    </SelectItem>
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
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                <div className="space-y-2 border rounded-md p-3 bg-muted/50">
                  <div className="text-sm text-muted-foreground">
                    1. Responsable de Département
                  </div>
                  <div className="text-sm text-muted-foreground">
                    2. Approbation Financière
                  </div>
                  <div className="text-sm text-muted-foreground">
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
                <Button type="button" variant="outline" className="flex items-center gap-2" onClick={addItem}>
                  <Plus className="w-4 h-4" />
                  Ajouter Article
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Quantité</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Prix Unitaire</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Total</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <Input 
                            placeholder="Description de l'article" 
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            min="1" 
                            className="w-20"
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input 
                            type="number" 
                            value={item.unitPrice} 
                            min="0" 
                            step="0.01" 
                            className="w-32"
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          €{(item.quantity * item.unitPrice).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        €{calculateTotal().toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            className="bg-primary hover:bg-primary/90"
            disabled={budgetId && !budgetStatus.active}
          >
            Créer Bon de Commande
          </Button>
        </div>
      </form>

      {/* Dialogs */}
      <CreateBudgetDialog
        isOpen={isCreateBudgetOpen}
        onOpenChange={setIsCreateBudgetOpen}
        onBudgetCreated={handleBudgetCreated}
      />

      <InviteVendorQuickDialog
        isOpen={isInviteVendorOpen}
        onOpenChange={setIsInviteVendorOpen}
        onVendorInvited={handleVendorInvited}
      />
    </div>
  );
};

export default CreatePO;
