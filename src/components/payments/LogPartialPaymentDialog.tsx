import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/paymentUtils';
import type { PartialPaymentStatus } from '@/hooks/useInvoicePayments';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  remainingToPay: number;
  onSubmit: (input: {
    amount: number;
    status: PartialPaymentStatus;
    bankPaymentDate?: string | null;
    valueDate?: string | null;
    paymentMethod?: string | null;
    note?: string | null;
  }) => void;
  isSubmitting?: boolean;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function LogPartialPaymentDialog({
  open, onOpenChange, currency, remainingToPay, onSubmit, isSubmitting,
}: Props) {
  // 'paid' = paiement déjà réglé (date banque connue) ; 'prepared' = à ordonner
  const [mode, setMode] = useState<'paid' | 'prepared'>('paid');
  const [amount, setAmount] = useState<string>(remainingToPay ? remainingToPay.toFixed(2) : '');
  const [bankDate, setBankDate] = useState<string>(todayIso());
  const [valueDate, setValueDate] = useState<string>(todayIso());
  const [method, setMethod] = useState<string>('sepa_transfer');
  const [note, setNote] = useState<string>('');

  const amountNum = parseFloat(amount);
  const invalid =
    !Number.isFinite(amountNum) || amountNum <= 0 || amountNum > remainingToPay + 0.005;

  const submit = () => {
    if (invalid) return;
    onSubmit({
      amount: amountNum,
      status: mode,
      bankPaymentDate: mode === 'paid' ? bankDate : null,
      valueDate: mode === 'prepared' ? valueDate : null,
      paymentMethod: method,
      note: note.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un paiement partiel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm flex justify-between">
            <span className="text-muted-foreground">Reste à régler</span>
            <span className="font-medium">{formatCurrency(remainingToPay, currency)}</span>
          </div>

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

          <div className="space-y-1.5">
            <Label htmlFor="pp-amount">Montant</Label>
            <div className="flex gap-2">
              <Input
                id="pp-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(remainingToPay.toFixed(2))}
              >
                Solde
              </Button>
            </div>
            {invalid && amount !== '' && (
              <p className="text-xs text-red-600">
                Montant invalide (max {formatCurrency(remainingToPay, currency)}).
              </p>
            )}
          </div>

          {mode === 'paid' ? (
            <div className="space-y-1.5">
              <Label htmlFor="pp-bankdate">Date de paiement en banque</Label>
              <Input id="pp-bankdate" type="date" value={bankDate} onChange={(e) => setBankDate(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="pp-valuedate">Date d'exécution souhaitée</Label>
              <Input id="pp-valuedate" type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} />
            </div>
          )}

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
            <Label htmlFor="pp-note">Note (optionnel)</Label>
            <Input id="pp-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Acompte, solde…" />
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
