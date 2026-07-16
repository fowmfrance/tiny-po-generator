import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { History, TrendingUp, TrendingDown, Pencil } from 'lucide-react';
import { useBudgetAmountHistory, type BudgetAmountField } from '@/hooks/useBudgetAmountHistory';

const fmt = (currency: string, v: number | null) => {
  const s = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  return `${s}${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const fieldLabel = (f: BudgetAmountField) => (f === 'initial_amount' ? 'Provision de charges' : 'CA initial (prix de vente)');
const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

interface Props {
  budgetId: string;
  currency: string;
  initialAmount: number;
  resalePrice: number | null;
}

export function BudgetAmountsSection({ budgetId, currency, initialAmount, resalePrice }: Props) {
  const { history, isLoading, change } = useBudgetAmountHistory(budgetId);
  const [editField, setEditField] = useState<BudgetAmountField | null>(null);
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  const openEdit = (field: BudgetAmountField, current: number | null) => {
    setEditField(field);
    setValue(current != null ? String(current) : '');
    setReason('');
  };

  const submit = () => {
    const v = parseFloat(value);
    if (!editField || !Number.isFinite(v) || !reason.trim()) return;
    change.mutate(
      { field: editField, newValue: v, reason: reason.trim() },
      { onSuccess: () => setEditField(null) },
    );
  };

  return (
    <div className="space-y-4">
      {/* Montants courants + bouton ajuster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Provision de charges</p>
            <p className="text-lg font-semibold">{fmt(currency, initialAmount)}</p>
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={() => openEdit('initial_amount', initialAmount)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Ajuster
          </Button>
        </div>
        <div className="rounded-lg border px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">CA initial (prix de vente)</p>
            <p className="text-lg font-semibold">{resalePrice != null ? fmt(currency, resalePrice) : '—'}</p>
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={() => openEdit('resale_price', resalePrice)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Ajuster
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Augmenter la provision de charges nécessite le rôle « finance ». Chaque changement est journalisé ci-dessous.
      </p>

      {/* Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Historique des montants</h4>
        </div>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Chargement…</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun changement enregistré.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => {
              const up = (h.delta || 0) >= 0;
              return (
                <li key={h.id} className="flex items-start gap-3 rounded-md border px-3 py-2">
                  <span className={`mt-0.5 ${up ? 'text-green-700' : 'text-red-600'}`}>
                    {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{fieldLabel(h.field)}</span>{' '}
                      <span className="text-muted-foreground">{fmt(currency, h.old_value)} → </span>
                      <span className="font-medium">{fmt(currency, h.new_value)}</span>{' '}
                      <span className={up ? 'text-green-700' : 'text-red-600'}>
                        ({up ? '+' : ''}{fmt(currency, h.delta)})
                      </span>
                    </p>
                    {h.reason && <p className="text-xs text-muted-foreground italic">« {h.reason} »</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(h.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!editField} onOpenChange={(o) => !o && setEditField(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajuster — {editField ? fieldLabel(editField) : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bac-value">Nouveau montant</Label>
              <Input id="bac-value" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bac-reason">Motif (obligatoire)</Label>
              <Input id="bac-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Avenant, révision budgétaire…" />
            </div>
            {editField === 'initial_amount' && (
              <p className="text-xs text-muted-foreground">
                Une augmentation de la provision exige le rôle « finance ».
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditField(null)}>Annuler</Button>
            <Button onClick={submit} disabled={!reason.trim() || value === '' || change.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
