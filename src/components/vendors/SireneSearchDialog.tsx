import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Loader2, MapPin, Search, Users } from 'lucide-react';
import {
  SireneCompany,
  SirenePrefill,
  formatSiren,
  formatSiret,
  mapToSupplierPrefill,
  natureJuridiqueLabel,
  searchSirene,
} from '@/hooks/useSireneSearch';

interface SireneSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  onSelect: (prefill: SirenePrefill, company: SireneCompany) => void;
}

export function SireneSearchDialog({ open, onOpenChange, initialQuery, onSelect }: SireneSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SireneCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery || '');
      setResults([]);
      setError(null);
      setHasSearched(false);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open || query.trim().length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const companies = await searchSirene(query, controller.signal);
        setResults(companies);
        setHasSearched(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Erreur lors de la recherche');
          setHasSearched(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const handlePick = (company: SireneCompany) => {
    onSelect(mapToSupplierPrefill(company), company);
    onOpenChange(false);
  };

  const dirigeantsLine = (company: SireneCompany) => {
    const names = (company.dirigeants || [])
      .slice(0, 2)
      .map(d =>
        d.type_dirigeant === 'personne morale'
          ? d.denomination
          : [d.prenoms?.split(' ')[0], d.nom].filter(Boolean).join(' ')
      )
      .filter(Boolean);
    if (!names.length) return null;
    const extra = (company.dirigeants || []).length - names.length;
    return names.join(', ') + (extra > 0 ? ` +${extra}` : '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rechercher une entreprise</DialogTitle>
          <DialogDescription>
            Registre SIRENE (INSEE) — recherchez par nom, SIREN ou SIRET puis sélectionnez
            l'entreprise pour compléter la fiche.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 h-10"
            placeholder="Ex : Fleuron, 928508142 ou 92850814200017"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2 min-h-[120px]">
          {error && (
            <p className="text-sm text-destructive py-4 text-center">{error}</p>
          )}

          {!error && !isLoading && hasSearched && results.length === 0 && query.trim().length >= 3 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aucune entreprise trouvée pour « {query.trim()} »
            </p>
          )}

          {!error && query.trim().length < 3 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Saisissez au moins 3 caractères…
            </p>
          )}

          {results.map(company => {
            const isActive = company.etat_administratif === 'A';
            const forme = natureJuridiqueLabel(company.nature_juridique);
            const dirigeants = dirigeantsLine(company);
            return (
              <button
                key={company.siren}
                type="button"
                onClick={() => handlePick(company)}
                className="w-full text-left rounded-lg border p-3 hover:border-primary hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {company.nom_raison_sociale || company.nom_complet}
                      </span>
                      {forme && <Badge variant="outline" className="shrink-0">{forme}</Badge>}
                      <Badge
                        variant={isActive ? 'secondary' : 'destructive'}
                        className="shrink-0"
                      >
                        {isActive ? 'Active' : 'Cessée'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SIREN {formatSiren(company.siren)}
                      {company.siege?.siret && <> · SIRET siège {formatSiret(company.siege.siret)}</>}
                      {company.activite_principale && <> · NAF {company.activite_principale}</>}
                    </p>
                    {company.siege?.adresse && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{company.siege.adresse}</span>
                      </p>
                    )}
                    {dirigeants && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3 shrink-0" />
                        <span className="truncate">{dirigeants}</span>
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Données publiques — recherche-entreprises.api.gouv.fr (base SIRENE / INSEE)
        </p>
      </DialogContent>
    </Dialog>
  );
}
