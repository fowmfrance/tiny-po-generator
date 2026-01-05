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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Save, RefreshCw, AlertCircle } from "lucide-react";

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

interface BankConnection {
  id: string;
  bank_name: string;
  organization_name: string | null;
}

interface Mapping {
  id?: string;
  bank_label_id: string;
  expense_category_id: string | null;
}

const BankMappingTab = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [bankLabels, setBankLabels] = useState<BankLabel[]>([]);
  const [connectedBanks, setConnectedBanks] = useState<BankConnection[]>([]);
  const [mappings, setMappings] = useState<Record<string, Record<string, string | null>>>({});
  const [originalMappings, setOriginalMappings] = useState<Record<string, Record<string, string | null>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user's expense categories
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('id, name, color')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data || [];
  };

  // Fetch all bank labels
  const fetchBankLabels = async () => {
    const { data, error } = await supabase
      .from('bank_labels')
      .select('*')
      .eq('is_active', true)
      .order('label_name');

    if (error) {
      console.error('Error fetching bank labels:', error);
      return [];
    }
    return data || [];
  };

  // Fetch user's connected banks
  const fetchConnectedBanks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bank_connections')
      .select('id, bank_name, organization_name')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching connected banks:', error);
      return [];
    }
    return data || [];
  };

  // Fetch user's existing mappings
  const fetchMappings = async (labels: BankLabel[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data, error } = await supabase
      .from('bank_label_mappings')
      .select('bank_label_id, expense_category_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching mappings:', error);
      return {};
    }

    // Organize mappings by bank_name -> label_code -> category_id
    const mappingsMap: Record<string, Record<string, string | null>> = {};
    
    (data || []).forEach(m => {
      const label = labels.find(l => l.id === m.bank_label_id);
      if (label) {
        if (!mappingsMap[label.bank_name]) {
          mappingsMap[label.bank_name] = {};
        }
        mappingsMap[label.bank_name][label.label_code] = m.expense_category_id;
      }
    });
    
    return mappingsMap;
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [categoriesData, labelsData, banksData] = await Promise.all([
        fetchCategories(),
        fetchBankLabels(),
        fetchConnectedBanks(),
      ]);
      
      setCategories(categoriesData);
      setBankLabels(labelsData);
      setConnectedBanks(banksData);
      
      const mappingsData = await fetchMappings(labelsData);
      setMappings(mappingsData);
      setOriginalMappings(JSON.parse(JSON.stringify(mappingsData)));
      
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleMappingChange = (bankName: string, labelCode: string, categoryId: string | null) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      if (!newMappings[bankName]) {
        newMappings[bankName] = {};
      }
      newMappings[bankName][labelCode] = categoryId === 'none' ? null : categoryId;
      return newMappings;
    });
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
      // Delete all existing mappings for this user
      const { error: deleteError } = await supabase
        .from('bank_label_mappings')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Build new mappings
      const newMappings: { user_id: string; bank_label_id: string; expense_category_id: string }[] = [];
      
      for (const [bankName, labelMappings] of Object.entries(mappings)) {
        for (const [labelCode, categoryId] of Object.entries(labelMappings)) {
          if (categoryId) {
            const label = bankLabels.find(l => l.bank_name === bankName && l.label_code === labelCode);
            if (label) {
              newMappings.push({
                user_id: user.id,
                bank_label_id: label.id,
                expense_category_id: categoryId,
              });
            }
          }
        }
      }

      if (newMappings.length > 0) {
        const { error: insertError } = await supabase
          .from('bank_label_mappings')
          .insert(newMappings);

        if (insertError) throw insertError;
      }

      setOriginalMappings(JSON.parse(JSON.stringify(mappings)));
      toast({
        title: "Mappings sauvegardés",
        description: `${newMappings.length} association(s) enregistrée(s).`,
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

  // Get unique bank names from connected banks
  const connectedBankNames = [...new Set(connectedBanks.map(b => b.bank_name))];
  
  // Get labels for connected banks only
  const labelsForConnectedBanks = bankLabels.filter(l => 
    connectedBankNames.includes(l.bank_name)
  );

  // Group labels by label_code for display across banks
  const labelsByCode: Record<string, { code: string; name: string; banks: Record<string, BankLabel> }> = {};
  labelsForConnectedBanks.forEach(label => {
    if (!labelsByCode[label.label_code]) {
      labelsByCode[label.label_code] = {
        code: label.label_code,
        name: label.label_name,
        banks: {},
      };
    }
    labelsByCode[label.label_code].banks[label.bank_name] = label;
  });

  const getMappedCategory = (bankName: string, labelCode: string): string | null => {
    return mappings[bankName]?.[labelCode] || null;
  };

  const getCategoryById = (categoryId: string | null): ExpenseCategory | undefined => {
    if (!categoryId) return undefined;
    return categories.find(c => c.id === categoryId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (connectedBanks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Mapping des Catégories Bancaires
          </CardTitle>
          <CardDescription>
            Associez les libellés de vos banques à vos catégories personnalisées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucune banque connectée</p>
            <p className="text-sm mt-1">
              Connectez une banque depuis la page Banques pour configurer le mapping des catégories.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Mapping des Catégories Bancaires
            </CardTitle>
            <CardDescription>
              Pour chaque libellé bancaire, définissez la catégorie Sapajoo correspondante.
            </CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Banques connectées :</span>
            {connectedBanks.map(bank => (
              <Badge key={bank.id} variant="secondary">
                {bank.organization_name || bank.bank_name}
              </Badge>
            ))}
          </div>

          {/* Main mapping table - Categories as rows, Banks as columns */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold w-[200px]">Catégorie Sapajoo</TableHead>
                  {connectedBankNames.map(bankName => (
                    <TableHead key={bankName} className="font-semibold text-center">
                      {bankName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    {connectedBankNames.map(bankName => {
                      // Find labels for this bank that are mapped to this category
                      const bankLabelsForBank = labelsForConnectedBanks.filter(l => l.bank_name === bankName);
                      const mappedLabels = bankLabelsForBank.filter(label => 
                        getMappedCategory(bankName, label.label_code) === category.id
                      );
                      
                      return (
                        <TableCell key={bankName} className="text-center">
                          {mappedLabels.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {mappedLabels.map(label => (
                                <Badge 
                                  key={label.id} 
                                  variant="outline" 
                                  className="text-xs"
                                  title={label.description || label.label_name}
                                >
                                  {label.label_name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Detailed mapping section by bank */}
          <div className="space-y-6 pt-4">
            <h3 className="text-lg font-medium border-b pb-2">Configuration par banque</h3>
            
            {connectedBankNames.map(bankName => {
              const bankLabelsForBank = labelsForConnectedBanks.filter(l => l.bank_name === bankName);
              
              if (bankLabelsForBank.length === 0) {
                return (
                  <div key={bankName} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{bankName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Aucun libellé disponible pour cette banque.
                    </p>
                  </div>
                );
              }
              
              return (
                <div key={bankName} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    {bankName}
                    <Badge variant="secondary">{bankLabelsForBank.length} libellés</Badge>
                  </h4>
                  
                  <div className="grid gap-3">
                    {bankLabelsForBank.map(label => {
                      const mappedCategoryId = getMappedCategory(bankName, label.label_code);
                      const mappedCategory = getCategoryById(mappedCategoryId);
                      
                      return (
                        <div 
                          key={label.id} 
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{label.label_name}</span>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {label.label_code}
                              </code>
                            </div>
                            {label.description && (
                              <p className="text-sm text-muted-foreground">
                                {label.description}
                              </p>
                            )}
                          </div>
                          
                          <Select
                            value={mappedCategoryId || 'none'}
                            onValueChange={(value) => handleMappingChange(bankName, label.label_code, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue>
                                {mappedCategory ? (
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: mappedCategory.color }}
                                    />
                                    <span>{mappedCategory.name}</span>
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
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            Ces associations seront utilisées pour catégoriser automatiquement les transactions lors de la synchronisation bancaire.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankMappingTab;
