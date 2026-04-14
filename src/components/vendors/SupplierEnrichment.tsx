import React, { useState } from 'react';
import { Zap, Search, Loader2, CheckCircle2, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export function SupplierEnrichment({ supplier }: SupplierEnrichmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Zap state
  const [zapLoading, setZapLoading] = useState(false);
  const [urlResults, setUrlResults] = useState<string[] | null>(null);

  // Extract state
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Find URL via DuckDuckGo
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
      console.error('Error finding URL:', e);
      toast({ title: 'Erreur', description: e.message || 'Échec de la recherche.', variant: 'destructive' });
    } finally {
      setZapLoading(false);
    }
  };

  // Select a URL from results
  const handleSelectUrl = async (url: string) => {
    setUrlResults(null);
    // Save URL to supplier
    const { error } = await supabase
      .from('suppliers')
      .update({ url } as any)
      .eq('id', supplier.id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'URL enregistrée', description: url });
    }
  };

  // Extract legal data from supplier URL
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
        setExtractedData(data.data);
        setConfirmOpen(true);
      } else {
        toast({ title: 'Extraction échouée', description: data?.error || 'Aucune donnée extraite.', variant: 'destructive' });
      }
    } catch (e: any) {
      console.error('Error extracting data:', e);
      toast({ title: 'Erreur', description: e.message || 'Échec de l\'extraction.', variant: 'destructive' });
    } finally {
      setExtractLoading(false);
    }
  };

  // Apply extracted data
  const applyMutation = useMutation({
    mutationFn: async (data: ExtractedData) => {
      const updates: Record<string, any> = {};
      if (data.siren) updates.siren = data.siren;
      if (data.vat_number) updates.vat_number = data.vat_number;
      if (data.address) updates.address = data.address;
      if (data.city) updates.city = data.city;
      if (data.country) updates.country = data.country;

      if (Object.keys(updates).length === 0) {
        throw new Error('Aucune donnée à appliquer.');
      }

      const { error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', supplier.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setConfirmOpen(false);
      setExtractedData(null);
      toast({ title: 'Fiche mise à jour ✅' });
    },
    onError: (e: any) => {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    },
  });

  const hasUrl = !!(supplier as any).url;

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

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Zap button – find URL */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFindUrl}
          disabled={zapLoading}
          title="Rechercher le site web du fournisseur"
        >
          {zapLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        </Button>

        {/* Extract button – scrape data */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExtract}
          disabled={extractLoading || !hasUrl}
          title={hasUrl ? 'Extraire les données légales du site' : 'Trouvez d\'abord l\'URL avec Zap'}
        >
          {extractLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>

        {hasUrl && (
          <a
            href={(supplier as any).url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="h-3 w-3" />
            Site web
          </a>
        )}
      </div>

      {/* URL results dropdown */}
      {urlResults && urlResults.length > 0 && (
        <div className="mt-2 border rounded-md p-2 space-y-1 bg-background shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">Sélectionnez le bon site :</p>
          {urlResults.map((url, i) => (
            <button
              key={i}
              className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors flex items-center gap-2 truncate"
              onClick={() => handleSelectUrl(url)}
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              <span className="truncate">{url}</span>
            </button>
          ))}
        </div>
      )}

      {/* Confirmation dialog for extracted data */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Données extraites — {supplier.name}</DialogTitle>
            <DialogDescription>
              Vérifiez les informations avant de les appliquer à la fiche fournisseur.
            </DialogDescription>
          </DialogHeader>

          {extractedData && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {Object.entries(extractedData).map(([key, value]) => {
                if (!value) return null;
                return (
                  <div key={key} className="flex items-start justify-between gap-3 py-1.5 border-b last:border-0">
                    <span className="text-sm text-muted-foreground min-w-[100px]">
                      {fieldLabels[key] || key}
                    </span>
                    <span className="text-sm font-medium text-right flex-1 break-all">
                      {typeof value === 'string' && value.startsWith('http') ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 justify-end">
                          <ExternalLink className="h-3 w-3" />
                          {value.length > 50 ? value.slice(0, 50) + '…' : value}
                        </a>
                      ) : (
                        String(value)
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => extractedData && applyMutation.mutate(extractedData)}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}