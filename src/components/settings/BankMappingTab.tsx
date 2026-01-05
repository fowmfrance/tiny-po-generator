import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Save, RefreshCw, ArrowRight } from "lucide-react";

interface BankLabel {
  id: string;
  bank_name: string;
  label_code: string;
  label_name: string;
  description: string | null;
}

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

interface Mapping {
  bank_label_id: string;
  expense_category_id: string | null;
}

const FRENCH_BANKS = [
  { code: 'Qonto', name: 'Qonto' },
  { code: 'BNP', name: 'BNP Paribas' },
  { code: 'SocieteGenerale', name: 'Société Générale' },
  { code: 'CreditAgricole', name: 'Crédit Agricole' },
  { code: 'LCL', name: 'LCL' },
  { code: 'CaisseEpargne', name: 'Caisse d\'Épargne' },
  { code: 'BanquePopulaire', name: 'Banque Populaire' },
  { code: 'CreditMutuel', name: 'Crédit Mutuel' },
  { code: 'HSBC', name: 'HSBC France' },
  { code: 'Boursorama', name: 'Boursorama Banque' },
  { code: 'HelloBank', name: 'Hello Bank!' },
  { code: 'Fortuneo', name: 'Fortuneo' },
  { code: 'N26', name: 'N26' },
  { code: 'Revolut', name: 'Revolut' },
  { code: 'Shine', name: 'Shine' },
];

const BankMappingTab = () => {
  const { toast } = useToast();
  const [selectedBank, setSelectedBank] = useState<string>('Qonto');
  const [bankLabels, setBankLabels] = useState<BankLabel[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [mappings, setMappings] = useState<Record<string, string | null>>({});
  const [originalMappings, setOriginalMappings] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch bank labels for selected bank
  const fetchBankLabels = async () => {
    const { data, error } = await supabase
      .from('bank_labels')
      .select('*')
      .eq('bank_name', selectedBank)
      .eq('is_active', true)
      .order('label_name');

    if (error) {
      console.error('Error fetching bank labels:', error);
      return;
    }
    setBankLabels(data || []);
  };

  // Fetch user's expense categories
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('id, name, color')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    setCategories(data || []);
  };

  // Fetch user's existing mappings
  const fetchMappings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('bank_label_mappings')
      .select('bank_label_id, expense_category_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching mappings:', error);
      return;
    }

    const mappingsMap: Record<string, string | null> = {};
    (data || []).forEach(m => {
      mappingsMap[m.bank_label_id] = m.expense_category_id;
    });
    setMappings(mappingsMap);
    setOriginalMappings(mappingsMap);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchBankLabels(), fetchCategories(), fetchMappings()]);
      setIsLoading(false);
    };
    loadData();
  }, [selectedBank]);

  const handleMappingChange = (labelId: string, categoryId: string | null) => {
    setMappings(prev => ({
      ...prev,
      [labelId]: categoryId === 'none' ? null : categoryId,
    }));
  };

  const hasChanges = () => {
    return JSON.stringify(mappings) !== JSON.stringify(originalMappings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez être connecté pour sauvegarder.",
      });
      setIsSaving(false);
      return;
    }

    try {
      // Get all bank label IDs for this bank
      const labelIds = bankLabels.map(l => l.id);

      // Delete existing mappings for these labels
      const { error: deleteError } = await supabase
        .from('bank_label_mappings')
        .delete()
        .eq('user_id', user.id)
        .in('bank_label_id', labelIds);

      if (deleteError) throw deleteError;

      // Insert new mappings (only for non-null values)
      const newMappings = Object.entries(mappings)
        .filter(([labelId, categoryId]) => categoryId && labelIds.includes(labelId))
        .map(([labelId, categoryId]) => ({
          user_id: user.id,
          bank_label_id: labelId,
          expense_category_id: categoryId,
        }));

      if (newMappings.length > 0) {
        const { error: insertError } = await supabase
          .from('bank_label_mappings')
          .insert(newMappings);

        if (insertError) throw insertError;
      }

      setOriginalMappings({ ...mappings });
      toast({
        title: "Mappings sauvegardés",
        description: `${newMappings.length} association(s) enregistrée(s) pour ${selectedBank}.`,
      });
    } catch (error: any) {
      console.error('Error saving mappings:', error);
      toast({
        variant: "destructive",
        title: "Erreur de sauvegarde",
        description: error.message || "Impossible de sauvegarder les mappings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.color || null;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.name || null;
  };

  const bankHasLabels = bankLabels.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Mapping des Catégories Bancaires
        </CardTitle>
        <CardDescription>
          Associez les libellés de vos banques à vos catégories personnalisées pour un classement automatique des transactions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bank Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sélectionnez une banque</label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Choisir une banque" />
            </SelectTrigger>
            <SelectContent>
              {FRENCH_BANKS.map(bank => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mapping Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !bankHasLabels ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucun libellé disponible pour {selectedBank}</p>
            <p className="text-sm mt-1">
              Les libellés seront ajoutés au fur et à mesure de l'intégration des API bancaires.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Libellés {selectedBank}
                <Badge variant="secondary" className="ml-2">
                  {bankLabels.length}
                </Badge>
              </h3>
              {hasChanges() && (
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              )}
            </div>

            <div className="border rounded-lg divide-y">
              {bankLabels.map(label => {
                const mappedCategoryId = mappings[label.id];
                const categoryColor = getCategoryColor(mappedCategoryId);
                
                return (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{label.label_name}</span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {label.label_code}
                        </code>
                      </div>
                      {label.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {label.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={mappedCategoryId || 'none'}
                        onValueChange={(value) => handleMappingChange(label.id, value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Non associé">
                            {mappedCategoryId ? (
                              <div className="flex items-center gap-2">
                                {categoryColor && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: categoryColor }}
                                  />
                                )}
                                <span>{getCategoryName(mappedCategoryId)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Non associé</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">Non associé</span>
                          </SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span>{cat.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-muted-foreground">
              Ces associations seront utilisées pour catégoriser automatiquement les transactions lors de la synchronisation bancaire.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BankMappingTab;
