import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Calendar, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { defaultCurrency } from '@/services/budgetService';
import { Badge } from '@/components/ui/badge';
import CreateBudgetDialog from '@/components/purchase-orders/CreateBudgetDialog';
import InviteVendorQuickDialog from '@/components/purchase-orders/InviteVendorQuickDialog';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';

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

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const CreatePO = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { createPO } = usePurchaseOrders();
  
  const budgetInfo: any = location.state || {};
  const { budgetId, budgetName, budgetCode, budgetCurrency } = budgetInfo;

  const [selectedBudget, setSelectedBudget] = useState<string>(budgetId || "");
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [currency, setCurrency] = useState<string>((budgetCurrency || defaultCurrency).toUpperCase());
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [isInviteVendorOpen, setIsInviteVendorOpen] = useState(false);
  const isAdmin = true;

  const [budgetList, setBudgetList] = useState<BudgetOption[]>([]);
  const [vendorList, setVendorList] = useState<VendorOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLoadingData(false); return; }

        const [budgetsRes, suppliersRes] = await Promise.all([
          supabase.from('budgets').select('id, name, code, currency').eq('status', 'active').order('name'),
          supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
        ]);

        if (budgetsRes.data) setBudgetList(budgetsRes.data);
        if (suppliersRes.data) setVendorList(suppliersRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const addItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleBudgetSelectChange = (value: string) => {
    if (value === 'create-new') { if (isAdmin) setIsCreateBudgetOpen(true); return; }
    setSelectedBudget(value);
    // Update currency from budget
    const budget = budgetList.find(b => b.id === value);
    if (budget) setCurrency(budget.currency.toUpperCase());
  };

  const handleVendorSelectChange = (value: string) => {
    if (value === 'invite-new') { setIsInviteVendorOpen(true); return; }
    setSelectedVendor(value);
  };

  const handleBudgetCreated = (budget: { id: string; name: string; code: string; currency: string }) => {
    setBudgetList(prev => [...prev, budget]);
    setSelectedBudget(budget.id);
    setCurrency(budget.currency.toUpperCase());
    setIsCreateBudgetOpen(false);
  };

  const handleVendorInvited = (vendor: { id: string; name: string; email: string }) => {
    setVendorList(prev => [...prev, { id: vendor.id, name: vendor.name }]);
    setSelectedVendor(vendor.id);
    setIsInviteVendorOpen(false);
  };

  // Generate PO number
  const generatePONumber = () => {
    const budget = budgetList.find(b => b.id === selectedBudget);
    const prefix = budget ? budget.code : 'PO';
    const date = new Date();
    const seq = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${date.getFullYear()}-${seq}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVendor) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un fournisseur.', variant: 'destructive' });
      return;
    }

    if (items.some(i => !i.description || i.unitPrice <= 0)) {
      toast({ title: 'Erreur', description: 'Veuillez compléter tous les articles.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const po_number = generatePONumber();
      
      await createPO.mutateAsync({
        budget_id: selectedBudget || undefined,
        supplier_id: selectedVendor,
        po_number,
        currency,
        notes: notes || undefined,
        expected_delivery_date: expectedDate || undefined,
        items: items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unitPrice,
        })),
      });

      if (budgetId) {
        navigate(`/budgets/${budgetId}`);
      } else if (selectedBudget) {
        navigate(`/budgets/${selectedBudget}`);
      } else {
        navigate('/purchase-orders');
      }
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => budgetId ? navigate(`/budgets/${budgetId}`) : navigate('/purchase-orders')} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Créer un Bon de Commande</h1>
          {budgetName && <p className="text-muted-foreground">Pour le budget: {budgetName}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations du Bon de Commande</CardTitle>
              <CardDescription>Entrez les détails pour ce bon de commande</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!budgetId && (
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Select value={selectedBudget} onValueChange={handleBudgetSelectChange}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un budget" /></SelectTrigger>
                    <SelectContent>
                      {budgetList.map(budget => (
                        <SelectItem key={budget.id} value={budget.id}>
                          {budget.name} ({budget.code}) - {budget.currency}
                        </SelectItem>
                      ))}
                      <SelectItem value="create-new" disabled={!isAdmin} className={!isAdmin ? "opacity-50" : "text-primary font-medium"}>
                        <span className="flex items-center gap-2">
                          {!isAdmin && <Lock className="h-3 w-3" />}
                          <Plus className="h-3 w-3" /> Créer un budget
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {budgetId && (
                <div className="p-4 bg-muted/50 border rounded-md">
                  <p className="text-sm font-medium">Ce BC sera associé au budget : {budgetName}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="vendor">Fournisseur *</Label>
                <Select value={selectedVendor} onValueChange={handleVendorSelectChange}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un fournisseur" /></SelectTrigger>
                  <SelectContent>
                    {vendorList.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                    ))}
                    <SelectItem value="invite-new" className="text-primary font-medium">
                      <span className="flex items-center gap-2"><Plus className="h-3 w-3" /> Inviter un fournisseur</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={currency.toLowerCase()} onValueChange={(v) => setCurrency(v.toUpperCase())}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner une devise" /></SelectTrigger>
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
                    <Input id="expectedDate" type="date" className="pl-10" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Entrez des notes ou exigences supplémentaires" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Articles</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Devise</span>
                <span>{currency}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total</span>
                <span>{currency} {calculateTotal().toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Articles</CardTitle>
                  <CardDescription>Ajoutez des articles à ce bon de commande</CardDescription>
                </div>
                <Button type="button" variant="outline" className="flex items-center gap-2" onClick={addItem}>
                  <Plus className="w-4 h-4" /> Ajouter Article
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
                          <Input placeholder="Description de l'article" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} />
                        </td>
                        <td className="px-4 py-3">
                          <Input type="number" value={item.quantity} min="1" className="w-20" onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
                        </td>
                        <td className="px-4 py-3">
                          <Input type="number" value={item.unitPrice} min="0" step="0.01" className="w-32" onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {currency} {(item.quantity * item.unitPrice).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">Total:</td>
                      <td className="px-4 py-3 text-sm font-bold">
                        {currency} {calculateTotal().toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
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
          <Button type="button" variant="outline" onClick={() => budgetId ? navigate(`/budgets/${budgetId}`) : navigate('/purchase-orders')}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Création en cours...' : 'Créer Bon de Commande'}
          </Button>
        </div>
      </form>

      <CreateBudgetDialog isOpen={isCreateBudgetOpen} onOpenChange={setIsCreateBudgetOpen} onBudgetCreated={handleBudgetCreated} />
      <InviteVendorQuickDialog isOpen={isInviteVendorOpen} onOpenChange={setIsInviteVendorOpen} onVendorInvited={handleVendorInvited} />
    </div>
  );
};

export default CreatePO;
