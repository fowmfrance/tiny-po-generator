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
import { Building2, Save, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

interface QontoCategory {
  code: string;
  name: string;
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

const BankMappingTab = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [qontoCategories, setQontoCategories] = useState<QontoCategory[]>([]);
  const [connectedBanks, setConnectedBanks] = useState<BankConnection[]>([]);
  const [mappings, setMappings] = useState<Record<string, string | null>>({});
  const [originalMappings, setOriginalMappings] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
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

  // Fetch Qonto categories via edge function
  const fetchQontoCategories = async (connectionId: string) => {
    setIsLoadingCategories(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        console.error('No session found');
        return [];
      }

      const response = await supabase.functions.invoke('qonto-proxy', {
        body: {
          action: 'get_categories',
          connectionId,
        },
      });

      if (response.error) {
        console.error('Error fetching Qonto categories:', response.error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de récupérer les catégories Qonto.",
        });
        return [];
      }

      const categoriesData = response.data?.categories || [];
      
      // Sync categories with bank_labels table
      await syncBankLabels(categoriesData);
      
      // Transform string array to QontoCategory objects
      return categoriesData.map((cat: string) => ({
        code: cat,
        name: formatQontoCategoryName(cat),
      }));
    } catch (error) {
      console.error('Error fetching Qonto categories:', error);
      return [];
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Sync Qonto categories with bank_labels table
  const syncBankLabels = async (categoryCodes: string[]) => {
    if (categoryCodes.length === 0) return;

    // Get existing bank_labels for Qonto
    const { data: existingLabels } = await supabase
      .from('bank_labels')
      .select('label_code')
      .eq('bank_name', 'qonto');

    const existingCodes = new Set(existingLabels?.map(l => l.label_code) || []);
    
    // Find new categories that need to be added
    const newCategories = categoryCodes.filter(code => !existingCodes.has(code));
    
    if (newCategories.length > 0) {
      const labelsToInsert = newCategories.map(code => ({
        bank_name: 'qonto',
        label_code: code,
        label_name: formatQontoCategoryName(code),
      }));

      const { error } = await supabase
        .from('bank_labels')
        .insert(labelsToInsert);

      if (error) {
        console.error('Error syncing bank labels:', error);
      }
    }
  };

  // Format Qonto category name for display
  const formatQontoCategoryName = (code: string): string => {
    // Replace underscores with spaces and capitalize
    return code
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Fetch or create bank_label for a Qonto category
  const getOrCreateBankLabel = async (qontoCode: string): Promise<string | null> => {
    // Check if label exists
    const { data: existing } = await supabase
      .from('bank_labels')
      .select('id')
      .eq('bank_name', 'qonto')
      .eq('label_code', qontoCode)
      .single();

    if (existing) return existing.id;

    // Label doesn't exist - we can't create it as bank_labels has no INSERT policy
    // This is expected behavior - labels should be pre-populated
    return null;
  };

  // Fetch user's existing mappings from database
  const fetchMappings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    // Get all bank_labels for Qonto
    const { data: bankLabels } = await supabase
      .from('bank_labels')
      .select('id, label_code')
      .eq('bank_name', 'qonto');

    if (!bankLabels || bankLabels.length === 0) return {};

    const labelCodeToId = new Map(bankLabels.map(bl => [bl.label_code, bl.id]));
    const labelIdToCode = new Map(bankLabels.map(bl => [bl.id, bl.label_code]));

    // Get user's mappings
    const { data: userMappings, error } = await supabase
      .from('bank_label_mappings')
      .select('bank_label_id, expense_category_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching mappings:', error);
      return {};
    }

    // Transform to { qontoCode: categoryId } format
    const mappingsObj: Record<string, string | null> = {};
    userMappings?.forEach(m => {
      const code = labelIdToCode.get(m.bank_label_id);
      if (code) {
        mappingsObj[code] = m.expense_category_id;
      }
    });

    return mappingsObj;
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [categoriesData, banksData] = await Promise.all([
        fetchCategories(),
        fetchConnectedBanks(),
      ]);
      
      setCategories(categoriesData);
      setConnectedBanks(banksData);
      
      // Fetch Qonto categories if we have a Qonto connection
      const qontoConnection = banksData.find(b => b.bank_name.toLowerCase() === 'qonto');
      if (qontoConnection) {
        const qontoCats = await fetchQontoCategories(qontoConnection.id);
        setQontoCategories(qontoCats);
      }
      
      const mappingsData = await fetchMappings();
      setMappings(mappingsData);
      setOriginalMappings(JSON.parse(JSON.stringify(mappingsData)));
      
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleMappingChange = (qontoCategory: string, categoryId: string | null) => {
    setMappings(prev => ({
      ...prev,
      [qontoCategory]: categoryId === 'none' ? null : categoryId,
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
      // Get all bank_labels for Qonto
      const { data: bankLabels } = await supabase
        .from('bank_labels')
        .select('id, label_code')
        .eq('bank_name', 'qonto');

      const labelCodeToId = new Map(bankLabels?.map(bl => [bl.label_code, bl.id]) || []);

      // Delete existing mappings for this user's Qonto labels
      const qontoLabelIds = bankLabels?.map(bl => bl.id) || [];
      if (qontoLabelIds.length > 0) {
        await supabase
          .from('bank_label_mappings')
          .delete()
          .eq('user_id', user.id)
          .in('bank_label_id', qontoLabelIds);
      }

      // Insert new mappings
      const mappingsToInsert = Object.entries(mappings)
        .filter(([_, categoryId]) => categoryId !== null)
        .map(([qontoCode, categoryId]) => {
          const labelId = labelCodeToId.get(qontoCode);
          if (!labelId) return null;
          return {
            user_id: user.id,
            bank_label_id: labelId,
            expense_category_id: categoryId,
          };
        })
        .filter(Boolean);

      if (mappingsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('bank_label_mappings')
          .insert(mappingsToInsert as any[]);

        if (insertError) {
          throw insertError;
        }
      }
      
      const mappingCount = Object.values(mappings).filter(v => v !== null).length;

      setOriginalMappings(JSON.parse(JSON.stringify(mappings)));
      toast({
        title: "Mappings sauvegardés",
        description: `${mappingCount} association(s) enregistrée(s) en base.`,
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

  const getMappedCategory = (qontoCategory: string): string | null => {
    return mappings[qontoCategory] || null;
  };

  const getCategoryById = (categoryId: string | null): ExpenseCategory | undefined => {
    if (!categoryId) return undefined;
    return categories.find(c => c.id === categoryId);
  };

  // Check if we have a Qonto connection
  const qontoConnection = connectedBanks.find(b => b.bank_name.toLowerCase() === 'qonto');

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

  if (connectedBanks.length === 0 || !qontoConnection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Mapping des Catégories Qonto
          </CardTitle>
          <CardDescription>
            Associez les catégories Qonto à vos catégories personnalisées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucune banque Qonto connectée</p>
            <p className="text-sm mt-1">
              Connectez votre compte Qonto depuis la page Banques pour configurer le mapping des catégories.
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
              Mapping des Catégories Qonto
            </CardTitle>
            <CardDescription>
              Pour chaque catégorie Qonto, définissez la catégorie Sapajoo correspondante.
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
            <span className="text-sm text-muted-foreground">Compte connecté :</span>
            <Badge variant="secondary">
              Qonto - {qontoConnection.organization_name || 'Mon compte'}
            </Badge>
            <Badge variant="outline">
              {qontoCategories.length} catégories Qonto
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                if (qontoConnection) {
                  const qontoCats = await fetchQontoCategories(qontoConnection.id);
                  setQontoCategories(qontoCats);
                  toast({
                    title: "Catégories actualisées",
                    description: `${qontoCats.length} catégorie(s) Qonto chargée(s).`,
                  });
                }
              }}
              disabled={isLoadingCategories}
            >
              {isLoadingCategories ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1">Rafraîchir</span>
            </Button>
          </div>

          {isLoadingCategories ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Chargement des catégories Qonto...</span>
            </div>
          ) : qontoCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Aucune catégorie Qonto trouvée</p>
              <p className="text-sm mt-1">
                Les catégories seront disponibles une fois que vous aurez des transactions dans Qonto.
              </p>
            </div>
          ) : (
            <>
              {/* Main mapping table - Sapajoo categories as rows */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold w-[200px]">Catégorie Sapajoo</TableHead>
                      <TableHead className="font-semibold">Catégories Qonto associées</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(category => {
                      // Find Qonto categories mapped to this Sapajoo category
                      const mappedQontoCategories = qontoCategories.filter(qc => 
                        getMappedCategory(qc.code) === category.id
                      );
                      
                      return (
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
                          <TableCell>
                            {mappedQontoCategories.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {mappedQontoCategories.map(qc => (
                                  <Badge 
                                    key={qc.code} 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {qc.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Detailed mapping section for Qonto categories */}
              <div className="space-y-6 pt-4">
                <h3 className="text-lg font-medium border-b pb-2">Configuration des catégories Qonto</h3>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    Qonto
                    <Badge variant="secondary">{qontoCategories.length} catégories</Badge>
                  </h4>
                  
                  <div className="grid gap-3">
                    {qontoCategories.map(qontoCategory => {
                      const mappedCategoryId = getMappedCategory(qontoCategory.code);
                      const mappedCategory = getCategoryById(mappedCategoryId);
                      
                      return (
                        <div 
                          key={qontoCategory.code} 
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{qontoCategory.name}</span>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {qontoCategory.code}
                              </code>
                            </div>
                          </div>
                          
                          <Select
                            value={mappedCategoryId || 'none'}
                            onValueChange={(value) => handleMappingChange(qontoCategory.code, value)}
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
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BankMappingTab;
