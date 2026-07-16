import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/paymentUtils';
import { allocateProRata, type POInvoiceLine } from '@/hooks/usePOInvoicing';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  lines: POInvoiceLine[];
  isSubmitting?: boolean;
  onSubmit: (input: {
    allocations: { invoiceId: string; amount: number }[];
    status: 'paid' | 'prepared';
    bankPaymentDate?: string | null;
    valueDate?: string | null;
    paymentMethod?: string | null;
    note?: string | null;
  }) => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Paiement groupé au niveau du BdC : règle un pourcentage (ou un montant)
 * du cumul des factures reçues sélectionnées, réparti au prorata du reste
 * à régler de chacune. Un seul lot de paiement est créé.
 */
export function POGroupPaymentDialog({
  open, onOpenChange, currency, lines, isSubmitting, onSubmit,
}: Props) {
  const payable = useMemo(() => lines.filter((l) => l.remaining > 0.005), [lines]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'paid' | 'prepared'>('paid');
  const [pct, setPct] = useState('');
  const [amount, setAmount] = useState('');
  const [lastEdited, setLastEdited] = useState<'pct' | 'amount'>('pct');
  const [bankDate, setBankDate] = useState(todayIso());
  const [valueDate, setValueDate] = useState(todayIso());
  const [method, setMethod] = useState('sepa_transfer');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setSelected(new Set(payable.map((l) => l.id)));
      setMode('paid');
      setPct('');
      setAmount('');
      setLastEdited('pct');
      setBankDate(todayIso());
      setValueDate(todayIso());
      setMethod('sepa_transfer');
      setNote('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedLines = payable.filter((l) => selected.has(l.id));
  const selectedTtc = round2(selectedLines.reduce((s, l) => s + l.ttc, 0));
  const selectedRemaining = round2(selectedLines.reduce((s, l) => s + l.remaining, 0));

  // % s'applique au cumul TTC des factures sélectionnées (plafonné au reste à régler)
  const pctNum = parseFloat(pct);
  const amountNum = parseFloat(amount);
  const target =
    lastEdited === 'pct'
      ? Number.isFinite(pctNum) ? Math.min(round2((selectedTtc * pctNum) / 100), selectedRemaining) : NaN
      : Number.isFinite(amountNum) ? amountNum : NaN;

  const allocations = useMemo(
    () => (Number.isFinite(target) && target > 0 ? allocateProRata(selectedLines, target) : []),
    [selectedLines, target]
  );
  const allocatedTotal = round2(allocations.reduce((s, a) => s + a.amount, 0));

  const invalid =
    selectedLines.length === 0 ||
    !Number.isFinite(target) || target <= 0 ||
    target > selectedRemaining + 0.005;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (invalid) return;
    onSubmit({
      allocations,
      status: mode,
      bankPaymentDate: mode === 'paid' ? bankDate : null,
      valueDate: mode === 'prepared' ? valueDate : null,
      paymentMethod: method,
      note: note.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paiement groupé</DialogTitle>
          <DialogDescription>
            Régler un pourcentage du cumul des factures reçues, réparti au prorata.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection des factures */}
          <div className="space-y-1.5">
            <Label>Factures à régler</Label>
            <div className="rounded-md border divide-y">
              {payable.map((l) => {
                const alloc = allocations.find((a) => a.invoiceId === l.id);
                return (
                  <label key={l.id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer">
                    <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggle(l.id)} />
                    <span className="font-medium truncate">{l.invoiceNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(l.ttc, currency)} TTC · reste {formatCurrency(l.remaining, currency)}
                    </span>
                    {alloc && (
                      <span className="ml-auto text-xs font-medium text-primary shrink-0">
                        → {formatCurrency(alloc.amount, currency)}
                      </span>
                    )}
                  </label>
                );
              })}
              {payable.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Aucune facture avec un reste à régler.</p>
              )}
            </div>
          </div>

          {/* % ou montant */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gp-pct">% du cumul TTC</Label>
              <Input
                id="gp-pct" type="number" step="1" min="0" max="100" placeholder="ex : 40"
                value={pct}
                onChange={(e) => {
                  setPct(e.target.value);
                  setLastEdited('pct');
                  const p = parseFloat(e.target.value);
                  setAmount(Number.isFinite(p) ? Math.min(round2((selectedTtc * p) / 100), selectedRemaining).toFixed(2) : '');
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gp-amount">ou montant TTC</Label>
              <Input
                id="gp-amount" type="number" step="0.01" min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setLastEdited('amount');
                  const a = parseFloat(e.target.value);
                  setPct(Number.isFinite(a) && selectedTtc > 0 ? round2((a / selectedTtc) * 100).toString() : '');
                }}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cumul factures sélectionnées</span>
              <span className="font-medium">{formatCurrency(selectedTtc, currency)} TTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reste à régler</span>
              <span className="font-medium">{formatCurrency(selectedRemaining, currency)}</span>
            </div>
            {allocations.length > 0 && (
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-muted-foreground">Total du paiement</span>
                <span className="font-semibold">{formatCurrency(allocatedTotal, currency)}</span>
              </div>
            )}
          </div>
          {!invalid && target > selectedRemaining + 0.005 && (
            <p className="text-xs text-red-600">Montant supérieur au reste à régler.</p>
          )}

          {/* Statut du paiement */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('paid')}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'paid' ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground'
              }`}
            >
              Déjà réglé
            </button>
            <button
              type="button"
              onClick={() => setMode('prepared')}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'prepared' ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground'
              }`}
            >
              À préparer
            </button>
          </div>

          {mode === 'paid' ? (
            <div className="space-y-1.5">
              <Label htmlFor="gp-bankdate">Date de paiement en banque</Label>
              <Input id="gp-bankdate" type="date" value={bankDate} onChange={(e) => setBankDate(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="gp-valuedate">Date d'exécution souhaitée</Label>
              <Input id="gp-valuedate" type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Moyen de paiement</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sepa_transfer">Virement SEPA</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="direct_debit">Prélèvement</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gp-note">Note (optionnel)</Label>
              <Input id="gp-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Acompte 40 %…" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={invalid || isSubmitting}>
            {mode === 'paid' ? 'Enregistrer le paiement' : 'Préparer le paiement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
