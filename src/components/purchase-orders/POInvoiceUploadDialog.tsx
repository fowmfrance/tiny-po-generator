import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/paymentUtils';

export interface InvoiceUploadInput {
  invoiceNumber: string;
  invoiceDate: string;
  ttc: number;
  vat: number | null;
  nature: string | null; // Acompte / Intermédiaire / Solde
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  currency: string;
  defaultInvoiceNumber: string;
  /** Reste à facturer TTC sur le BdC (indicatif, pré-rempli). */
  suggestedTtc: number;
  isSubmitting?: boolean;
  onSubmit: (input: InvoiceUploadInput) => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;

const NATURES = ['Acompte', 'Facture intermédiaire', 'Solde'];

export function POInvoiceUploadDialog({
  open, onOpenChange, fileName, currency, defaultInvoiceNumber, suggestedTtc, isSubmitting, onSubmit,
}: Props) {
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(todayIso());
  const [ttc, setTtc] = useState('');
  const [vat, setVat] = useState('');
  const [nature, setNature] = useState<string>('none');

  useEffect(() => {
    if (open) {
      setInvoiceNumber(defaultInvoiceNumber);
      setInvoiceDate(todayIso());
      setTtc(suggestedTtc > 0.005 ? suggestedTtc.toFixed(2) : '');
      setVat('');
      setNature('none');
    }
  }, [open, defaultInvoiceNumber, suggestedTtc]);

  const ttcNum = parseFloat(ttc);
  const vatNum = vat === '' ? 0 : parseFloat(vat);
  const invalid =
    !Number.isFinite(ttcNum) || ttcNum <= 0 ||
    !Number.isFinite(vatNum) || vatNum < 0 || vatNum >= ttcNum ||
    invoiceNumber.trim() === '' || invoiceDate === '';
  const ht = Number.isFinite(ttcNum) && Number.isFinite(vatNum) ? round2(ttcNum - vatNum) : null;

  const submit = () => {
    if (invalid) return;
    onSubmit({
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      ttc: ttcNum,
      vat: vat === '' ? null : vatNum,
      nature: nature === 'none' ? null : nature,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Montants de la facture</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate">{fileName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-number">N° de facture</Label>
              <Input id="inv-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-date">Date de facture</Label>
              <Input id="inv-date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-ttc">Montant TTC *</Label>
              <Input
                id="inv-ttc" type="number" step="0.01" min="0"
                value={ttc} onChange={(e) => setTtc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-vat">dont TVA</Label>
              <Input
                id="inv-vat" type="number" step="0.01" min="0" placeholder="0.00"
                value={vat} onChange={(e) => setVat(e.target.value)}
              />
            </div>
          </div>

          {ht !== null && ht > 0 && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm flex justify-between">
              <span className="text-muted-foreground">Montant HT calculé</span>
              <span className="font-medium">{formatCurrency(ht, currency)}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Nature (optionnel)</Label>
            <Select value={nature} onValueChange={setNature}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {NATURES.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {suggestedTtc > 0.005 && (
            <p className="text-xs text-muted-foreground">
              Reste à facturer sur ce BdC : {formatCurrency(suggestedTtc, currency)} TTC
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={invalid || isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : 'Enregistrer la facture'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
