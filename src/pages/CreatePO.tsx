import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Calendar, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { defaultCurrency } from '@/services/budgetService';
import CreateBudgetDialog from '@/components/purchase-orders/CreateBudgetDialog';
import InviteVendorQuickDialog from '@/components/purchase-orders/InviteVendorQuickDialog';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import BudgetConsumptionDonut from '@/components/purchase-orders/BudgetConsumptionDonut';

interface BudgetOption {
  id: string;
  name: string;
  code: string;
  currency: string;
  initial_amount: number;
}

interface VendorOption {
  id: string;
  name: string;
  is_active: boolean;
  supplier_type_id: string | null;
  supplier_type_name: string | null;
}

interface ArticleTypeOption {
  id: string;
  name: string;
  default_unit_price: number | null;
  unit: string | null;
}

interface LineItem {
  id: string;
  articleTypeId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

const CreatePO = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const { toast } = useToast();
  const { createPO } = usePurchaseOrders();

  const budgetInfo: any = location.state || {};
  const { budgetId, budgetName, budgetCurrency } = budgetInfo;

  const [selectedBudget, setSelectedBudget] = useState<string>(budgetId || '');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [currency, setCurrency] = useState<string>((budgetCurrency || defaultCurrency).toUpperCase());
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [isInviteVendorOpen, setIsInviteVendorOpen] = useState(false);
  const isAdmin = true;

  const [budgetList, setBudgetList] = useState<BudgetOption[]>([]);
  const [vendorList, setVendorList] = useState<VendorOption[]>([]);
  const [articleTypeList, setArticleTypeList] = useState<ArticleTypeOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetPOs, setBudgetPOs] = useState<{ id: string; total_amount: number; status: string }[]>([]);

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), articleTypeId: null, description: '', quantity: 1, unitPrice: 0 },
  ]);

  const selectedVendorData = vendorList.find((vendor) => vendor.id === selectedVendor) || null;
  const isSelectedVendorKycPending = selectedVendorData ? !selectedVendorData.is_active : false;
  const hasPrefilledBudget = !!budgetId && budgetList.some((budget) => budget.id === budgetId);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast({
            title: 'Session expirée',
            description: 'Reconnectez-vous pour charger les budgets et fournisseurs.',
            variant: 'destructive',
          });
          return;
        }

        const [budgetsRes, suppliersRes] = await Promise.all([
          supabase.from('budgets').select('id, name, code, currency, initial_amount').eq('user_id', user.id).order('name'),
          supabase
            .from('suppliers')
            .select('id, name, is_active, supplier_type_id, supplier_type:supplier_types(name)')
            .eq('user_id', user.id)
            .order('name'),
        ]);

        if (budgetsRes.error) throw budgetsRes.error;
        if (suppliersRes.error) throw suppliersRes.error;

        const loadedBudgets = (budgetsRes.data || []) as BudgetOption[];
        setBudgetList(loadedBudgets);

        if (budgetId && !loadedBudgets.some((budget) => budget.id === budgetId)) {
          setSelectedBudget('');
          toast({
            title: 'Budget non disponible',
            description: 'Le budget préselectionné est introuvable, choisissez un autre budget.',
            variant: 'destructive',
          });
        }

        const mappedSuppliers: VendorOption[] = (suppliersRes.data as any[]).map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          is_active: supplier.is_active !== false,
          supplier_type_id: supplier.supplier_type_id,
          supplier_type_name: supplier.supplier_type?.name || null,
        }));
        setVendorList(mappedSuppliers);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les budgets/fournisseurs.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [budgetId, toast]);

  // Load existing PO data in edit mode
  useEffect(() => {
    if (!isEditMode || !editId || isLoadingData) return;
    const loadPO = async () => {
      try {
        const { data: po, error } = await supabase
          .from('purchase_orders')
          .select('*, items:purchase_order_items(*)')
          .eq('id', editId)
          .single();
        if (error || !po) {
          toast({ title: 'Erreur', description: 'Bon de commande introuvable.', variant: 'destructive' });
          navigate('/purchase-orders');
          return;
        }
        setSelectedBudget(po.budget_id || '');
        setSelectedVendor(po.supplier_id);
        setCurrency((po.currency || 'EUR').toUpperCase());
        setExpectedDate(po.expected_delivery_date || '');
        setNotes(po.notes || '');
        if (po.items && po.items.length > 0) {
          setItems(
            (po.items as any[]).map((item: any) => ({
              id: item.id,
              articleTypeId: item.article_type_id || null,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unit_price),
            }))
          );
        }
      } catch (e) {
        console.error('Error loading PO for edit:', e);
      }
    };
    loadPO();
  }, [isEditMode, editId, isLoadingData]);

  useEffect(() => {
    const loadArticleTypes = async () => {
      if (!selectedVendorData?.supplier_type_id) {
        setArticleTypeList([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('article_types')
          .select('id, name, default_unit_price, unit')
          .eq('supplier_type_id', selectedVendorData.supplier_type_id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setArticleTypeList((data || []) as ArticleTypeOption[]);
      } catch (error) {
        console.error('Error loading article types:', error);
        setArticleTypeList([]);
      }
    };

    loadArticleTypes();
  }, [selectedVendorData?.supplier_type_id]);

  // Load existing POs for the selected budget
  useEffect(() => {
    const loadBudgetPOs = async () => {
      if (!selectedBudget) {
        setBudgetPOs([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('purchase_orders')
          .select('id, total_amount, status')
          .eq('budget_id', selectedBudget)
          .neq('status', 'rejected');
        if (error) throw error;
        setBudgetPOs((data || []) as { id: string; total_amount: number; status: string }[]);
      } catch (e) {
        console.error('Error loading budget POs:', e);
        setBudgetPOs([]);
      }
    };
    loadBudgetPOs();
  }, [selectedBudget]);

  const selectedBudgetData = budgetList.find((b) => b.id === selectedBudget);
  const currentTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const isOverBudget = useMemo(() => {
    if (!selectedBudgetData) return false;
    const committed = budgetPOs.reduce((s, po) => s + Number(po.total_amount || 0), 0);
    return currentTotal > selectedBudgetData.initial_amount - committed;
  }, [selectedBudgetData, budgetPOs, currentTotal]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), articleTypeId: null, description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const updateItem = (
    id: string,
    field: keyof Omit<LineItem, 'id'>,
    value: string | number | null
  ) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleArticleTypeSelect = (itemId: string, value: string) => {
    if (value === 'other') {
      updateItem(itemId, 'articleTypeId', null);
      return;
    }

    const preset = articleTypeList.find((article) => article.id === value);

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        return {
          ...item,
          articleTypeId: value,
          description: preset?.name || item.description,
          unitPrice:
            item.unitPrice > 0
              ? item.unitPrice
              : preset?.default_unit_price !== null && preset?.default_unit_price !== undefined
                ? Number(preset.default_unit_price)
                : item.unitPrice,
        };
      })
    );
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleBudgetSelectChange = (value: string) => {
    if (value === 'create-new') {
      if (isAdmin) setIsCreateBudgetOpen(true);
      return;
    }

    setSelectedBudget(value);
    const budget = budgetList.find((b) => b.id === value);
    if (budget) setCurrency(budget.currency.toUpperCase());
  };

  const handleVendorSelectChange = (value: string) => {
    if (value === 'invite-new') {
      setIsInviteVendorOpen(true);
      return;
    }

    setSelectedVendor(value);
    const vendor = vendorList.find((v) => v.id === value);
    if (vendor && !vendor.is_active) {
      toast({
        title: 'KYC fournisseur en attente',
        description: 'Le bon de commande sera créé en brouillon tant que le KYC n’est pas finalisé.',
      });
    }
  };

  const handleBudgetCreated = (budget: { id: string; name: string; code: string; currency: string; initial_amount?: number }) => {
    setBudgetList((prev) => [...prev, { ...budget, initial_amount: budget.initial_amount || 0 }]);
    setSelectedBudget(budget.id);
    setCurrency(budget.currency.toUpperCase());
    setIsCreateBudgetOpen(false);
  };

  const handleVendorInvited = (vendor: {
    id: string;
    name: string;
    email: string;
    supplier_type_id?: string | null;
    is_active?: boolean;
  }) => {
    setVendorList((prev) => [
      ...prev,
      {
        id: vendor.id,
        name: vendor.name,
        is_active: vendor.is_active !== false,
        supplier_type_id: vendor.supplier_type_id || null,
        supplier_type_name: null,
      },
    ]);
    setSelectedVendor(vendor.id);
    setIsInviteVendorOpen(false);
  };

  const generatePONumber = () => {
    const budget = budgetList.find((b) => b.id === selectedBudget);
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

    if (items.some((i) => !i.description.trim() || i.unitPrice <= 0 || i.quantity <= 0)) {
      toast({ title: 'Erreur', description: 'Veuillez compléter tous les articles.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && editId) {
        // Update existing PO
        const total_amount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
        const { error: updateError } = await supabase
          .from('purchase_orders')
          .update({
            budget_id: selectedBudget || null,
            supplier_id: selectedVendor,
            currency,
            total_amount,
            notes: notes || null,
            expected_delivery_date: expectedDate || null,
          })
          .eq('id', editId);

        if (updateError) throw updateError;

        // Delete old items and re-insert
        await supabase.from('purchase_order_items').delete().eq('purchase_order_id', editId);

        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(
              items.map((i) => ({
                purchase_order_id: editId,
                description: i.description,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                article_type_id: i.articleTypeId || null,
              }))
            );
          if (itemsError) throw itemsError;
        }

        toast({ title: 'Bon de commande modifié', description: 'Les modifications ont été enregistrées.' });
        navigate(`/purchase-orders/${editId}`);
      } else {
        // Create new PO
        const po_number = generatePONumber();

        await createPO.mutateAsync({
          budget_id: selectedBudget || undefined,
          supplier_id: selectedVendor,
          po_number,
          currency,
          notes: notes || undefined,
          expected_delivery_date: expectedDate || undefined,
          items: items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            article_type_id: i.articleTypeId || undefined,
          })),
        });

        if (selectedBudget) {
          navigate(`/budgets/${selectedBudget}`);
        } else {
          navigate('/purchase-orders');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => (selectedBudget ? navigate(`/budgets/${selectedBudget}`) : navigate('/purchase-orders'))}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Créer un Bon de Commande</h1>
          {budgetName && <p className="text-muted-foreground">Pour le budget: {budgetName}</p>}
        </div>
      </div>

      {isLoadingData ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Chargement des données...</CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations du Bon de Commande</CardTitle>
                <CardDescription>Entrez les détails pour ce bon de commande</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasPrefilledBudget && (
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Select value={selectedBudget} onValueChange={handleBudgetSelectChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un budget" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetList.map((budget) => (
                          <SelectItem key={budget.id} value={budget.id}>
                            {budget.name} ({budget.code}) - {budget.currency}
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="create-new"
                          disabled={!isAdmin}
                          className={!isAdmin ? 'opacity-50' : 'text-primary font-medium'}
                        >
                          <span className="flex items-center gap-2">
                            {!isAdmin && <Lock className="h-3 w-3" />}
                            <Plus className="h-3 w-3" /> Créer un budget
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {hasPrefilledBudget && (
                  <div className="p-4 bg-muted/50 border rounded-md">
                    <p className="text-sm font-medium">Ce BC sera associé au budget : {budgetName}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="vendor">Fournisseur *</Label>
                  <Select value={selectedVendor} onValueChange={handleVendorSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorList.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                          {!vendor.is_active ? ' • KYC en attente' : ''}
                          {vendor.supplier_type_name ? ` • ${vendor.supplier_type_name}` : ''}
                        </SelectItem>
                      ))}
                      <SelectItem value="invite-new" className="text-primary font-medium">
                        <span className="flex items-center gap-2">
                          <Plus className="h-3 w-3" /> Inviter un fournisseur
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelectedVendorKycPending && (
                    <p className="text-xs text-muted-foreground">
                      Fournisseur en attente de KYC: le BC restera en brouillon.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Devise</Label>
                    <Select value={currency.toLowerCase()} onValueChange={(v) => setCurrency(v.toUpperCase())}>
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
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
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
                  <span>Total BC</span>
                  <span>
                    {currency}{' '}
                    {currentTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {selectedBudgetData && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Consommation du budget</p>
                    <BudgetConsumptionDonut
                      budgetInitialAmount={Number(selectedBudgetData.initial_amount)}
                      budgetCurrency={currency}
                      existingPOs={budgetPOs}
                      currentPOAmount={currentTotal}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <CardTitle>Articles</CardTitle>
                    <CardDescription>
                      {selectedVendorData?.supplier_type_name
                        ? `Catalogue: ${selectedVendorData.supplier_type_name} (avec option “Autre”).`
                        : 'Ajoutez des articles manuellement ou depuis un catalogue métier.'}
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" className="flex items-center gap-2" onClick={addItem}>
                    <Plus className="w-4 h-4" /> Ajouter Article
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full min-w-[920px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Prestation</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Quantité</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Prix Unitaire</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Total</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 w-[240px]">
                            <Select
                              value={item.articleTypeId || 'other'}
                              onValueChange={(value) => handleArticleTypeSelect(item.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir" />
                              </SelectTrigger>
                              <SelectContent>
                                {articleTypeList.map((articleType) => (
                                  <SelectItem key={articleType.id} value={articleType.id}>
                                    {articleType.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="other">Autre (saisie libre)</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
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
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                              onFocus={(e) => e.target.select()}
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
                              onFocus={(e) => e.target.select()}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {currency}{' '}
                            {(item.quantity * item.unitPrice).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
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
                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">
                          {currency}{' '}
                          {calculateTotal().toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td />
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
              onClick={() => (selectedBudget ? navigate(`/budgets/${selectedBudget}`) : navigate('/purchase-orders'))}
            >
              Annuler
            </Button>
            {isOverBudget || isSelectedVendorKycPending ? (
              <Button type="submit" disabled={isSubmitting} variant="outline">
                {isSubmitting ? 'Création en cours...' : 'Enregistrer en brouillon'}
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Création en cours...' : 'Créer Bon de Commande'}
              </Button>
            )}
          </div>
        </form>
      )}

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
