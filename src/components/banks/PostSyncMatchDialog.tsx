import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Building2, Users, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/utils/paymentUtils';
import type { TiersLinkProposal } from '@/utils/fuzzyMatch';

/**
 * Revue des rattachements proposés après une synchronisation bancaire. Chaque
 * ligne = une transaction fraîchement synchronisée dont le libellé ressemble à
 * un tiers existant. Tout est coché par défaut ; l'utilisateur décoche les faux
 * positifs puis valide en masse.
 */
export default function PostSyncMatchDialog({
  proposals,
  isApplying,
  onConfirm,
  onClose,
}: {
  proposals: TiersLinkProposal[];
  isApplying: boolean;
  onConfirm: (accepted: TiersLinkProposal[]) => void;
  onClose: () => void;
}) {
  const open = proposals.length > 0;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // À chaque nouveau lot de propositions, tout cocher par défaut.
  useEffect(() => {
    setSelected(new Set(proposals.map((p) => p.txId)));
  }, [proposals]);

  const allChecked = selected.size === proposals.length && proposals.length > 0;
  const toggle = (txId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(txId) ? next.delete(txId) : next.add(txId);
      return next;
    });
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(proposals.map((p) => p.txId)));

  const accepted = useMemo(
    () => proposals.filter((p) => selected.has(p.txId)),
    [proposals, selected]
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isApplying && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            {proposals.length} rattachement{proposals.length > 1 ? 's' : ''} proposé
            {proposals.length > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Ces transactions fraîchement synchronisées ressemblent à des tiers déjà
            existants. Décochez les erreurs, puis rattachez.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between border-b border-border pb-2">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Checkbox checked={allChecked} className="pointer-events-none" />
            Tout sélectionner
          </button>
          <span className="text-xs text-muted-foreground">{accepted.length} sélectionné(s)</span>
        </div>

        <ScrollArea className="max-h-[52vh] pr-3">
          <div className="space-y-1">
            {proposals.map((p) => {
              const isChecked = selected.has(p.txId);
              return (
                <label
                  key={p.txId}
                  className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 cursor-pointer hover:bg-muted/40"
                >
                  <Checkbox checked={isChecked} onCheckedChange={() => toggle(p.txId)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground truncate">{p.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.date ? new Date(p.date).toLocaleDateString('fr-FR') : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 max-w-[42%]">
                    <span className="text-muted-foreground text-xs">→</span>
                    {p.kind === 'supplier' ? (
                      <Building2 className="h-3.5 w-3.5 text-brand shrink-0" />
                    ) : (
                      <Users className="h-3.5 w-3.5 text-brand shrink-0" />
                    )}
                    <span className="text-sm font-medium text-brand truncate">{p.entityName}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {Math.round(p.score * 100)}%
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0 w-24 text-right">
                    {formatCurrency(Math.abs(Number(p.amount) || 0), p.currency || 'EUR')}
                  </span>
                </label>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            Ignorer
          </Button>
          <Button onClick={() => onConfirm(accepted)} disabled={isApplying || accepted.length === 0}>
            {isApplying ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : null}
            Rattacher {accepted.length > 0 ? `les ${accepted.length}` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
