import React, { useState, useMemo } from 'react';
import { Zap, Search, Loader2, CheckCircle2, ExternalLink, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Supplier } from '@/hooks/useSuppliers';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface SupplierEnrichmentProps {
  supplier: Supplier;
}

interface ExtractedData {
  legal_name?: string | null;
  siren?: string | null;
  vat_number?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  representative?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  logo_url?: string | null;
}

const fieldLabels: Record<string, string> = {
  legal_name: 'Raison sociale',
  siren: 'SIREN/SIRET',
  vat_number: 'N° TVA',
  address: 'Adresse',
  city: 'Ville',
  country: 'Pays',
  representative: 'Dirigeant',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  logo_url: 'Logo',
};

// Map extracted fields to supplier table columns
const fieldToColumn: Record<string, string> = {
  siren: 'siren',
  vat_number: 'vat_number',
  address: 'address',
  city: 'city',
  country: 'country',
};

function getExistingValue(supplier: Supplier, field: string): string | null {
  const s = supplier as any;
  switch (field) {
    case 'legal_name': return s.name || null;
    case 'siren': return s.siren || null;
    case 'vat_number': return s.vat_number || null;
    case 'address': return s.address || null;
    case 'city': return s.city || null;
    case 'country': return s.country || null;
    default: return null;
  }
}

function ValueDisplay({ value }: { value: string }) {
  if (value.startsWith('http')) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{value.length > 40 ? value.slice(0, 40) + '…' : value}</span>
      </a>
    );
  }
  return <span>{value}</span>;
}

export function SupplierEnrichment({ supplier }: SupplierEnrichmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [zapLoading, setZapLoading] = useState(false);
  const [urlResults, setUrlResults] = useState<string[] | null>(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  const enrichmentRows = useMemo(() => {
    if (!extractedData) return [];
    return Object.entries(extractedData)
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(([field, newValue]) => {
        const existing = getExistingValue(supplier, field);
        const isUpdatable = field in fieldToColumn;
        const hasConflict = !!existing && existing !== String(newValue);
        return { field, newValue: String(newValue!), existing, isUpdatable, hasConflict };
      });
  }, [extractedData, supplier]);

  const openConfirmDialog = (data: ExtractedData) => {
    setExtractedData(data);
    const initial = new Set<string>();
    Object.entries(data)
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .forEach(([field]) => {
        if (field in fieldToColumn) {
          const existing = getExistingValue(supplier, field);
          if (!existing) initial.add(field);
        }
      });
    setSelectedFields(initial);
    setConfirmOpen(true);
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handleFindUrl = async () => {
    setZapLoading(true);
    setUrlResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-supplier', {
        body: { supplierName: supplier.name, action: 'find_url' },
      });
      if (error) throw error;
      if (data?.urls?.length > 0) {
        setUrlResults(data.urls);
      } else {
        toast({ title: 'Aucun résultat', description: 'Impossible de trouver le site web.' });
      }
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Échec de la recherche.', variant: 'destructive' });
    } finally {
      setZapLoading(false);
    }
  };

  const handleSelectUrl = async (url: string) => {
    setUrlResults(null);
    const { error } = await supabase
      .from('suppliers')
      .update({ url } as any)
      .eq('id', supplier.id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'URL enregistrée', description: url });
    }
  };

  const handleExtract = async () => {
    const url = (supplier as any).url;
    if (!url) {
      toast({ title: 'URL manquante', description: 'Utilisez d\'abord le bouton Zap pour trouver l\'URL du site.', variant: 'destructive' });
      return;
    }
    setExtractLoading(true);
    setExtractedData(null);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-supplier', {
        body: { supplierName: supplier.name, supplierUrl: url, action: 'extract_data' },
      });
      if (error) throw error;
      if (data?.success && data?.data) {
        openConfirmDialog(data.data);
      } else {
        toast({ title: 'Extraction échouée', description: data?.error || 'Aucune donnée extraite.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Échec de l\'extraction.', variant: 'destructive' });
    } finally {
      setExtractLoading(false);
    }
  };

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!extractedData) throw new Error('Pas de données.');
      const updates: Record<string, any> = {};
      selectedFields.forEach(field => {
        const col = fieldToColumn[field];
        const val = (extractedData as any)[field];
        if (col && val) updates[col] = val;
      });
      if (Object.keys(updates).length === 0) {
        throw new Error('Aucun champ sélectionné à mettre à jour.');
      }
      const { error } = await supabase.from('suppliers').update(updates).eq('id', supplier.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setConfirmOpen(false);
      setExtractedData(null);
      toast({ title: 'Fiche mise à jour' });
    },
    onError: (e: any) => {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    },
  });

  const hasUrl = !!(supplier as any).url;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleFindUrl} disabled={zapLoading} title="Rechercher le site web du fournisseur">
          {zapLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExtract} disabled={extractLoading || !hasUrl} title={hasUrl ? 'Extraire les données légales du site' : 'Trouvez d\'abord l\'URL avec Zap'}>
          {extractLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        {hasUrl && (
          <a href={(supplier as any).url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Globe className="h-3 w-3" /> Site web
          </a>
        )}
      </div>

      {urlResults && urlResults.length > 0 && (
        <div className="mt-2 border rounded-md p-2 space-y-1 bg-background shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">Sélectionnez le bon site :</p>
          {urlResults.map((url, i) => (
            <button key={i} className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors flex items-center gap-2 truncate" onClick={() => handleSelectUrl(url)}>
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              <span className="truncate">{url}</span>
            </button>
          ))}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Données extraites — {supplier.name}</DialogTitle>
            <DialogDescription>
              Cochez les champs que vous souhaitez mettre à jour sur la fiche fournisseur.
            </DialogDescription>
          </DialogHeader>

          {enrichmentRows.length > 0 && (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {enrichmentRows.map(({ field, newValue, existing, isUpdatable, hasConflict }) => (
                <div key={field} className="flex items-start gap-3 py-2 px-2 border-b last:border-0 rounded hover:bg-muted/30">
                  {isUpdatable ? (
                    <Checkbox
                      checked={selectedFields.has(field)}
                      onCheckedChange={() => toggleField(field)}
                      className="mt-0.5"
                    />
                  ) : (
                    <div className="w-4" />
                  )}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="text-xs font-medium text-muted-foreground">{fieldLabels[field] || field}</div>
                    {hasConflict && (
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="text-muted-foreground line-through truncate max-w-[160px]">{existing}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          <ValueDisplay value={newValue} />
                        </span>
                      </div>
                    )}
                    {!hasConflict && existing && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="truncate">{existing}</span>
                        <span className="text-xs">(identique)</span>
                      </div>
                    )}
                    {!existing && (
                      <div className="text-sm font-medium">
                        <ValueDisplay value={newValue} />
                      </div>
                    )}
                    {!isUpdatable && (
                      <span className="text-[10px] text-muted-foreground">(info uniquement)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Annuler</Button>
            <Button
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || selectedFields.size === 0}
            >
              {applyMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Appliquer ({selectedFields.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
