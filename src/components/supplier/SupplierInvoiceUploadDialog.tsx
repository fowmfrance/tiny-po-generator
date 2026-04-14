import React, { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/paymentUtils';
import { FileUp, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface SupplierInvoiceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: {
    id: string;
    po_number: string;
    total_amount: number;
    currency: string;
  };
  invoicedAmount: number;
  token: string;
  onSuccess: () => void;
}

// Regex patterns to detect HT amount in French invoices
const HT_PATTERNS = [
  /total\s*h\.?t\.?\s*[:\s]*([0-9\s]+[.,]\d{2})/i,
  /montant\s*h\.?t\.?\s*[:\s]*([0-9\s]+[.,]\d{2})/i,
  /net\s*h\.?t\.?\s*[:\s]*([0-9\s]+[.,]\d{2})/i,
  /h\.?t\.?\s*[:\s]*([0-9\s]+[.,]\d{2})\s*€?/i,
  /sous[- ]total\s*[:\s]*([0-9\s]+[.,]\d{2})/i,
  /total\s+hors\s+tax\w*\s*[:\s]*([0-9\s]+[.,]\d{2})/i,
];

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
}

async function extractHTFromPdf(file: File): Promise<number | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
    }

    for (const pattern of HT_PATTERNS) {
      const match = fullText.match(pattern);
      if (match) {
        const amount = parseAmount(match[1]);
        if (amount > 0 && amount < 100_000_000) {
          return amount;
        }
      }
    }
    return null;
  } catch (e) {
    console.warn('OCR extraction failed:', e);
    return null;
  }
}

const SupplierInvoiceUploadDialog: React.FC<SupplierInvoiceUploadDialogProps> = ({
  open, onOpenChange, purchaseOrder, invoicedAmount, token, onSuccess,
}) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrDetected, setOcrDetected] = useState(false);

  const poTotal = Number(purchaseOrder.total_amount);
  const remaining = poTotal - invoicedAmount;
  const currentAmount = parseFloat(amount) || 0;
  const newPercentInvoiced = poTotal > 0 ? Math.min(100, ((invoicedAmount + currentAmount) / poTotal) * 100) : 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setOcrDetected(false);

    if (f.type === 'application/pdf') {
      const detected = await extractHTFromPdf(f);
      if (detected !== null) {
        setAmount(detected.toFixed(2));
        setOcrDetected(true);
        toast({
          title: 'Montant détecté',
          description: `Montant HT détecté par OCR : ${detected.toFixed(2)} €. Vérifiez et ajustez si nécessaire.`,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !invoiceNumber || !amount || !invoiceDate || !dueDate) {
      toast({ variant: 'destructive', title: 'Champs requis manquants' });
      return;
    }
    if (currentAmount > remaining + 0.01) {
      toast({ variant: 'destructive', title: 'Montant trop élevé', description: `Restant facturable : ${remaining.toFixed(2)} €` });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('purchase_order_id', purchaseOrder.id);
      formData.append('invoice_number', invoiceNumber);
      formData.append('amount', currentAmount.toString());
      formData.append('invoice_date', invoiceDate);
      formData.append('due_date', dueDate);
      formData.append('file', file);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/supplier-upload-invoice`, {
        method: 'POST',
        headers: { 'apikey': anonKey },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du dépôt');
      }

      toast({
        title: 'Facture déposée',
        description: `Facture ${invoiceNumber} soumise avec succès. ${result.percentInvoiced}% du BdC facturé.`,
      });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Déposer une facture</DialogTitle>
          <DialogDescription>
            Bon de commande {purchaseOrder.po_number} — {formatCurrency(poTotal, purchaseOrder.currency || 'EUR')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2 p-3 rounded-lg bg-muted/50">
          <div className="flex justify-between text-sm">
            <span>Déjà facturé</span>
            <span className="font-medium">{formatCurrency(invoicedAmount)} / {formatCurrency(poTotal)}</span>
          </div>
          <Progress value={(invoicedAmount / poTotal) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Restant facturable : {formatCurrency(remaining)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File upload */}
          <div className="space-y-2">
            <Label>Fichier facture (PDF)</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              {file ? (
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  {ocrDetected && (
                    <p className="text-xs text-primary flex items-center justify-center gap-1 mt-1">
                      <Sparkles className="h-3 w-3" />
                      Montant HT détecté automatiquement
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cliquez ou glissez-déposez un PDF</p>
              )}
              <input ref={fileRef} type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-number">N° Facture</Label>
              <Input id="inv-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="FAC-2025-001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-amount">Montant HT (€)</Label>
              <Input
                id="inv-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setOcrDetected(false); }}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {currentAmount > 0 && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span>Après cette facture</span>
                <span className="font-medium">{newPercentInvoiced.toFixed(0)}% du BdC</span>
              </div>
              <Progress value={newPercentInvoiced} className="h-2" />
              {currentAmount > remaining + 0.01 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Le montant dépasse le restant facturable
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-date">Date facture</Label>
              <Input id="inv-date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-due">Échéance</Label>
              <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || currentAmount > remaining + 0.01}>
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours…</> : 'Déposer la facture'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierInvoiceUploadDialog;
