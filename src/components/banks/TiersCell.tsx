import { useState } from 'react';
import { Pencil, Building2, Users, Plus, Link2, X, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { findSupplierMatches } from '@/utils/fuzzyMatch';
import { toProperCase } from '@/utils/properCase';

type TiersKind = 'supplier' | 'client';

interface TiersEntity {
  id: string;
  name: string;
}

interface TiersCellProps {
  txId: string;
  qontoSide: string; // 'credit' = encaissement -> client ; sinon décaissement -> fournisseur
  qontoLabel?: string; // libellé de la transaction, pour suggérer un tiers existant
  supplierId: string | null;
  clientId: string | null;
  suppliers: TiersEntity[];
  clients: TiersEntity[];
  onSave: (patch: { supplier_id: string | null; client_id: string | null }) => void;
  onCreateSupplier: (name?: string) => void;
  onCreateClient: (name?: string) => void;
  onOpenSupplier: (id: string) => void;
  onOpenClient: (id: string) => void;
}

/**
 * Cellule « Tiers » de l'écran banque. Affiche une valeur discrète, éditable au
 * crayon. Le type (fournisseur/client) est pré-filtré selon le signe de la
 * transaction (crédit → client, débit → fournisseur) mais reste modifiable.
 * Une fois lié, le nom devient cliquable et ouvre la fiche du tiers.
 */
const TiersCell = ({
  txId,
  qontoSide,
  qontoLabel,
  supplierId,
  clientId,
  suppliers,
  clients,
  onSave,
  onCreateSupplier,
  onCreateClient,
  onOpenSupplier,
  onOpenClient,
}: TiersCellProps) => {
  const [open, setOpen] = useState(false);

  const linkedSupplier = supplierId ? suppliers.find((s) => s.id === supplierId) : undefined;
  const linkedClient = clientId ? clients.find((c) => c.id === clientId) : undefined;
  const isLinked = !!(supplierId || clientId);

  const defaultKind: TiersKind = supplierId
    ? 'supplier'
    : clientId
      ? 'client'
      : qontoSide === 'credit'
        ? 'client'
        : 'supplier';
  const [kind, setKind] = useState<TiersKind>(defaultKind);
  const [search, setSearch] = useState('');

  const openEditor = () => {
    setKind(defaultKind);
    // Pré-remplit la recherche avec le libellé (au format propre, éditable) pour
    // une transaction encore non rattachée.
    setSearch(isLinked ? '' : toProperCase(qontoLabel || ''));
    setOpen(true);
  };

  const allItems = kind === 'supplier' ? suppliers : clients;
  const q = search.trim().toLowerCase();

  // Suggestions : tiers proches du texte de recherche (pré-rempli avec le
  // libellé). Filtrage maison (shouldFilter=false) pour ne pas que cmdk masque
  // une suggestion dont le nom est plus court que le libellé.
  const suggestions = (search.trim() || qontoLabel)
    ? findSupplierMatches(search.trim() || qontoLabel || '', allItems, 0.6).map((m) => m.supplier)
    : [];
  const suggestionIds = new Set(suggestions.map((s) => s.id));
  const filteredList = (q ? allItems.filter((i) => i.name.toLowerCase().includes(q)) : allItems)
    .filter((i) => !suggestionIds.has(i.id));

  const linkSupplier = (id: string) => {
    onSave({ supplier_id: id, client_id: null });
    setOpen(false);
  };
  const linkClient = (id: string) => {
    onSave({ supplier_id: null, client_id: id });
    setOpen(false);
  };
  const detach = () => {
    onSave({ supplier_id: null, client_id: null });
    setOpen(false);
  };

  // --- Rendu de la valeur liée (nom cliquable) ---
  const linkedLabel = linkedSupplier ? (
    <button
      type="button"
      onClick={() => onOpenSupplier(linkedSupplier.id)}
      title="Ouvrir la fiche fournisseur"
      className="inline-flex items-center gap-1 text-brand font-medium hover:underline truncate max-w-[120px]"
    >
      <Building2 className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{linkedSupplier.name}</span>
    </button>
  ) : linkedClient ? (
    <button
      type="button"
      onClick={() => onOpenClient(linkedClient.id)}
      title="Ouvrir la fiche client"
      className="inline-flex items-center gap-1 text-brand font-medium hover:underline truncate max-w-[120px]"
    >
      <Users className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{linkedClient.name}</span>
    </button>
  ) : (
    // Cas rare : id lié mais entité non chargée
    supplierId || clientId ? (
      <span className="text-muted-foreground italic text-sm">Tiers lié</span>
    ) : null
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1.5 min-h-[28px]">
        {isLinked ? (
          <>
            {linkedLabel}
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={openEditor}
                title="Modifier le tiers"
                className="text-muted-foreground/60 hover:text-brand shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
          </>
        ) : (
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={openEditor}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground/70 hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              Ajouter
            </button>
          </PopoverTrigger>
        )}
      </div>

      <PopoverContent align="start" className="w-72 p-0">
        {/* Sélecteur de type (pré-filtré par signe, modifiable) */}
        <div className="flex items-center gap-1 p-2 border-b border-border">
          <button
            type="button"
            onClick={() => setKind('supplier')}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              kind === 'supplier' ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Building2 className="h-3.5 w-3.5" /> Fournisseur
          </button>
          <button
            type="button"
            onClick={() => setKind('client')}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              kind === 'client' ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Users className="h-3.5 w-3.5" /> Client
          </button>
        </div>

        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={kind === 'supplier' ? 'Rechercher un fournisseur…' : 'Rechercher un client…'}
          />
          <CommandList>
            {suggestions.length > 0 && (
              <>
                <CommandGroup heading="Suggestions">
                  {suggestions.map((item) => (
                    <CommandItem
                      key={`sug-${item.id}`}
                      value={`sug-${item.id}`}
                      onSelect={() => (kind === 'supplier' ? linkSupplier(item.id) : linkClient(item.id))}
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-brand" />
                      <span className="truncate">{item.name}</span>
                      <Link2 className="ml-auto h-4 w-4 text-brand/60" />
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            {filteredList.length > 0 && (
              <CommandGroup heading={suggestions.length > 0 ? 'Tous' : undefined}>
                {filteredList.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => (kind === 'supplier' ? linkSupplier(item.id) : linkClient(item.id))}
                  >
                    {kind === 'supplier' ? <Building2 className="mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />}
                    <span className="truncate">{item.name}</span>
                    {(kind === 'supplier' ? supplierId : clientId) === item.id && (
                      <Link2 className="ml-auto h-4 w-4 text-brand" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {suggestions.length === 0 && filteredList.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Aucun {kind === 'supplier' ? 'fournisseur' : 'client'} existant.
              </div>
            )}
          </CommandList>
          {/* Actions toujours visibles (hors filtrage cmdk) : jamais de cul-de-sac */}
          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                const name = search.trim() || undefined;
                kind === 'supplier' ? onCreateSupplier(name) : onCreateClient(name);
              }}
              className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-brand hover:bg-brand-subtle text-left"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {search.trim()
                  ? `Créer ${kind === 'supplier' ? 'le fournisseur' : 'le client'} « ${search.trim()} »`
                  : `Nouveau ${kind === 'supplier' ? 'fournisseur' : 'client'}`}
              </span>
            </button>
            {isLinked && (
              <button
                type="button"
                onClick={detach}
                className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 text-left"
              >
                <X className="h-4 w-4 shrink-0" />
                Détacher
              </button>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TiersCell;
