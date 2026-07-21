// Sous-modale SIRENE de la vérification de justificatif (module Notes de frais).
// Deux lookups sur recherche-entreprises.api.gouv.fr (API publique, sans auth,
// CORS ouvert — même source que SireneSearchDialog de fleuron) :
//   1. par SIRET/SIREN lu par l'OCR (fallback quand l'adresse manque),
//   2. par nom du fournisseur.
// Puis proposition de SUBSTITUTION champ par champ (pattern module fusion
// retail_shops) : valeur actuelle vs valeur SIRENE, cases à cocher.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Building2, Loader2, MapPin, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NAF_LABELS } from './nafLabels';

export interface SireneFields {
  merchant: string;
  siret: string;
  address: string;
  naf: string;
  nafLabel: string;
}

interface SireneResult {
  siren: string;
  name: string;
  siret: string | null;
  address: string | null;
  naf: string | null;
  nafLabel: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultQuery: string;
  current: SireneFields;
  onApply: (patch: Partial<SireneFields>) => void;
}

const cap = (s: string) =>
  s.toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (m, sep, c) => sep + c.toUpperCase());

// Adresse d'un établissement (matching_etablissements[i] ou siege).
const etabAddress = (e: any): string | null => {
  if (!e) return null;
  if (e.adresse) return cap(String(e.adresse));
  const street = [e.numero_voie, e.type_voie, e.libelle_voie].filter(Boolean).join(' ');
  const parts = [street ? cap(street) : null, e.code_postal, e.libelle_commune ? cap(String(e.libelle_commune)) : null];
  return parts.filter(Boolean).join(' ') || null;
};

const FIELD_LABELS: { key: keyof SireneFields; label: string }[] = [
  { key: 'merchant', label: 'Fournisseur' },
  { key: 'siret', label: 'SIRET' },
  { key: 'address', label: 'Adresse' },
  { key: 'naf', label: 'Code NAF' },
  { key: 'nafLabel', label: 'Activité' },
];

const SireneFraisDialog: React.FC<Props> = ({ open, onOpenChange, defaultQuery, current, onApply }) => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<SireneResult[]>([]);
  const [selected, setSelected] = useState<SireneResult | null>(null);
  const [take, setTake] = useState<Record<string, boolean>>({});
  const lastAuto = useRef<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (!term) return;
    setSearching(true);
    setSearched(true);
    setResults([]);
    setSelected(null);
    try {
      const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(term)}&per_page=6&page=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const mapped: SireneResult[] = (data.results ?? []).map((r: any) => {
        // Un SIRET recherché remonte dans matching_etablissements ; sinon le siège.
        const etab = r.matching_etablissements?.[0] ?? r.siege ?? {};
        const naf = etab.activite_principale ?? r.activite_principale ?? null;
        return {
          siren: r.siren,
          name: cap(r.nom_raison_sociale || r.nom_complet || r.siren),
          siret: etab.siret ?? r.siege?.siret ?? null,
          address: etabAddress(etab) ?? etabAddress(r.siege),
          naf,
          // L'API ne renvoie pas le libellé → nomenclature INSEE embarquée.
          nafLabel: naf ? NAF_LABELS[naf] ?? null : null,
        };
      });
      setResults(mapped);
      if (mapped.length === 1) setSelected(mapped[0]);
    } catch (e: any) {
      toast({ title: 'Recherche SIRENE impossible', description: e?.message ?? String(e), variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      setQuery(defaultQuery);
      if (defaultQuery && lastAuto.current !== defaultQuery) {
        lastAuto.current = defaultQuery;
        void runSearch(defaultQuery);
      }
    } else {
      lastAuto.current = null;
      setResults([]);
      setSelected(null);
      setSearched(false);
    }
  }, [open, defaultQuery, runSearch]);

  // Valeurs SIRENE du résultat sélectionné, alignées sur les champs du frais.
  const sireneValues: SireneFields | null = selected
    ? {
        merchant: selected.name,
        siret: selected.siret ?? '',
        address: selected.address ?? '',
        naf: selected.naf ?? '',
        nafLabel: selected.nafLabel ?? '',
      }
    : null;

  // À la sélection : coche par défaut les champs que SIRENE peut améliorer
  // (valeur SIRENE présente et différente de l'actuelle).
  useEffect(() => {
    if (!sireneValues) { setTake({}); return; }
    const next: Record<string, boolean> = {};
    for (const { key } of FIELD_LABELS) {
      next[key] = !!sireneValues[key] && sireneValues[key].trim() !== current[key].trim();
    }
    setTake(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const apply = () => {
    if (!sireneValues) return;
    const patch: Partial<SireneFields> = {};
    for (const { key } of FIELD_LABELS) {
      if (take[key] && sireneValues[key]) patch[key] = sireneValues[key];
    }
    onApply(patch);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compléter via SIRENE</DialogTitle>
          <DialogDescription>
            Base officielle des entreprises : SIRET, adresse et code NAF du fournisseur.
            Cherchez par SIRET (le plus fiable) ou par nom.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(query); } }}
            placeholder="SIRET, SIREN ou nom du fournisseur"
            autoFocus
          />
          <Button type="button" variant="outline" className="shrink-0"
            onClick={() => runSearch(query)} disabled={searching || !query.trim()}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-2">
          {searching && (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Recherche…
            </div>
          )}
          {!searching && searched && results.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">Aucune entreprise trouvée.</div>
          )}
          {!searching && results.map((r) => (
            <button
              key={`${r.siren}-${r.siret ?? ''}`}
              type="button"
              onClick={() => setSelected(r)}
              className={`w-full text-left rounded-lg border p-2.5 transition-colors ${selected?.siren === r.siren ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" /> {r.name}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {r.address ?? 'Adresse inconnue'}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {r.siret ? `SIRET ${r.siret}` : `SIREN ${r.siren}`}
                {r.naf && ` · ${r.naf}${r.nafLabel ? ` — ${r.nafLabel}` : ''}`}
              </div>
            </button>
          ))}
        </div>

        {/* Substitution champ par champ (pattern module fusion retail_shops) */}
        {sireneValues && (
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-[20px_1fr_1fr] gap-2 px-3 py-1.5 bg-muted/50 text-[11px] font-medium text-muted-foreground">
              <span /><span>Valeur actuelle</span><span>Valeur SIRENE</span>
            </div>
            {FIELD_LABELS.map(({ key, label }) => {
              const sv = sireneValues[key];
              if (!sv) return null;
              const same = sv.trim() === current[key].trim();
              return (
                <label key={key}
                  className={`grid grid-cols-[20px_1fr_1fr] gap-2 px-3 py-2 border-t items-start text-xs cursor-pointer ${same ? 'opacity-50' : ''}`}>
                  <Checkbox
                    checked={!!take[key]}
                    disabled={same}
                    onCheckedChange={(v) => setTake((t) => ({ ...t, [key]: v === true }))}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
                    <div className="truncate">{current[key] || <span className="text-muted-foreground italic">vide</span>}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-transparent select-none">{label}</div>
                    <div className={`truncate ${same ? '' : 'font-medium'}`}>{sv}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="button" onClick={apply}
            disabled={!sireneValues || !Object.values(take).some(Boolean)}>
            Remplacer les champs cochés
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SireneFraisDialog;
