import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Briefcase, ChevronRight } from 'lucide-react';
import { useSupplierCatalog, type CatalogSupplier } from '@/hooks/useSupplierCatalog';
import { cn } from '@/lib/utils';

type SortKey = 'alpha' | 'date' | 'volume';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'alpha', label: 'Alphabétique' },
  { key: 'date', label: "Date d'ajout" },
  { key: 'volume', label: 'Volume LTM' },
];

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const Annuaire = () => {
  const navigate = useNavigate();
  const { suppliers, isLoading } = useSupplierCatalog();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('alpha');
  const [asc, setAsc] = useState(true);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.typeName.toLowerCase().includes(q))
      : suppliers;

    const dir = asc ? 1 : -1;
    const cmp = (a: CatalogSupplier, b: CatalogSupplier) => {
      if (sortKey === 'alpha') return a.name.localeCompare(b.name, 'fr') * dir;
      if (sortKey === 'date') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      return (a.ltmVolume - b.ltmVolume) * dir;
    };

    // Regroupe par métier
    const byType = new Map<string, CatalogSupplier[]>();
    for (const s of filtered) {
      const arr = byType.get(s.typeName) || [];
      arr.push(s);
      byType.set(s.typeName, arr);
    }

    return Array.from(byType.entries())
      .map(([typeName, items]) => ({
        typeName,
        color: items[0].typeColor,
        items: [...items].sort(cmp),
        total: items.reduce((sum, s) => sum + s.ltmVolume, 0),
        count: items.length,
      }))
      // Groupes triés par nom de métier, « Non classé » en dernier
      .sort((a, b) => {
        if (a.typeName === 'Non classé') return 1;
        if (b.typeName === 'Non classé') return -1;
        return a.typeName.localeCompare(b.typeName, 'fr');
      });
  }, [suppliers, search, sortKey, asc]);

  const totalSuppliers = suppliers.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-serif text-ink">Annuaire fournisseurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalSuppliers} fournisseur{totalSuppliers > 1 ? 's' : ''}, regroupé{totalSuppliers > 1 ? 's' : ''} par métier
          </p>
        </div>
      </div>

      {/* Barre de recherche + tri */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un fournisseur ou un métier…"
            className="pl-8 h-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSortKey(s.key)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                sortKey === s.key ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setAsc((v) => !v)}
          title={asc ? 'Ordre croissant' : 'Ordre décroissant'}
        >
          {asc ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          {sortKey === 'alpha' ? (asc ? 'A→Z' : 'Z→A') : sortKey === 'date' ? (asc ? 'Ancien' : 'Récent') : (asc ? 'Faible' : 'Élevé')}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Chargement de l'annuaire…</p>
      ) : groups.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Aucun fournisseur trouvé.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.typeName}>
              <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background/95 backdrop-blur-sm py-1.5 z-10">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                  style={{ backgroundColor: (g.color || '#B8853A') + '22', color: g.color || '#B8853A' }}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                </span>
                <h2 className="font-serif text-lg text-ink">{g.typeName}</h2>
                <span className="text-xs text-muted-foreground">
                  {g.count} · {fmtEur(g.total)} LTM
                </span>
              </div>
              <ul className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                {g.items.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/vendors/${s.id}`)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex-1 min-w-0">
                        <span className={cn('font-medium truncate block', !s.isActive && 'text-muted-foreground line-through')}>
                          {s.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Ajouté le {fmtDate(s.createdAt)}
                          {s.ltmCount > 0 && ` · ${s.ltmCount} transaction${s.ltmCount > 1 ? 's' : ''} LTM`}
                        </span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="tabular-nums font-medium text-ink">{fmtEur(s.ltmVolume)}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Annuaire;
