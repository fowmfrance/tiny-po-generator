import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Loader2, Eye, Download, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/paymentUtils';
import { downloadSingleAttachment } from '@/lib/bulk-download';
import { AttachmentPreviewDialog } from '@/components/payments/AttachmentPreviewDialog';
import { InvoicePaymentsSection } from '@/components/payments/InvoicePaymentsSection';
import { POInvoiceUploadDialog, type InvoiceUploadInput } from './POInvoiceUploadDialog';
import { POGroupPaymentDialog } from './POGroupPaymentDialog';
import { usePOInvoiceLines, usePOGroupPayment } from '@/hooks/usePOInvoicing';

interface POInvoiceSectionProps {
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  currency: string;
  totalAmount: number;
  /** Montants du BdC (total_amount = HT ; amount_ttc si renseigné). */
  amountHt?: number | null;
  amountTtc?: number | null;
  expectedDeliveryDate: string | null;
  poStatus: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente de validation', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  validated: { label: 'Validée', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-700 border-red-200' },
  paid: { label: 'Payée', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

function AttachmentLink({ attachmentUrl, invoiceNumber, onPreview }: { attachmentUrl: string; invoiceNumber: string; onPreview: () => void }) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      const ext = attachmentUrl.split('.').pop()?.split('?')[0] || 'pdf';
      await downloadSingleAttachment(attachmentUrl, `${invoiceNumber}.${ext}`);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de télécharger le fichier.', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPreview(); }}
        className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors"
      >
        <CheckCircle className="h-3 w-3" />
        <Eye className="h-3 w-3" />
        Voir
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
      >
        {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
      </button>
    </div>
  );
}
export function POInvoiceSection({
  poId,
  poNumber,
  supplierId,
  supplierName,
  currency,
  totalAmount,
  amountHt,
  amountTtc,
  expectedDeliveryDate,
  poStatus,
}: POInvoiceSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [groupPaymentOpen, setGroupPaymentOpen] = useState(false);

  const { lines: paymentLines } = usePOInvoiceLines(poId);
  const { addGroupPayment } = usePOGroupPayment(poId);

  const isDeliveryPassed = expectedDeliveryDate
    ? new Date(expectedDeliveryDate) <= new Date()
    : true;

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['po-invoices', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .select('*')
        .eq('purchase_order_id', poId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async ({ file, input }: { file: File; input: InvoiceUploadInput }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { getCurrentOrganizationId } = await import('@/utils/organization');
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');

      const filePath = `${user.id}/${poId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('invoice-attachments')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const ht = round2(input.ttc - (input.vat ?? 0));

      const { data, error } = await supabase
        .from('supplier_invoices')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          supplier_id: supplierId,
          purchase_order_id: poId,
          po_number: poNumber,
          invoice_number: input.invoiceNumber,
          // Convention app : amount = TTC ; HT/TTC explicites pour le contrôle cumulé
          amount: input.ttc,
          amount_ttc: input.ttc,
          amount_ht: ht,
          vat_amount: input.vat,
          currency,
          invoice_date: input.invoiceDate,
          due_date: dueDate,
          received_date: today,
          status: 'pending',
          attachment_url: filePath,
          notes: input.nature,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['po-invoices', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] });
      queryClient.invalidateQueries({ queryKey: ['po-invoicing-summaries'] });
      toast({ title: 'Facture créée', description: 'La facture a été enregistrée et est en attente de validation.' });
      setPendingFile(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPendingFile(file);
  };

  // Cumuls facturés vs montants du BdC (contrôle acompte / intermédiaire / solde)
  const activeInvoices = invoices.filter((i: any) => i.status !== 'cancelled' && i.status !== 'rejected');
  const invoicedTtc = round2(activeInvoices.reduce((s: number, i: any) => s + Number(i.amount_ttc ?? i.amount ?? 0), 0));
  const invoicedHt = round2(activeInvoices.reduce(
    (s: number, i: any) => s + Number(i.amount_ht ?? round2(Number(i.amount ?? 0) - Number(i.vat_amount ?? 0))), 0));
  const poHt = Number(amountHt ?? totalAmount);
  const poTtc = amountTtc != null ? Number(amountTtc) : null;
  const invoicedPct = poHt > 0 ? Math.round((invoicedHt / poHt) * 100) : 0;
  const overInvoiced = invoicedHt > poHt + 0.005;
  const remainingToInvoiceTtc = Math.max(0, round2((poTtc ?? poHt) - invoicedTtc));
  const hasPayable = paymentLines.some((l) => l.remaining > 0.005);

  const isDraft = poStatus === 'draft';
  if (isDraft) return null;

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Factures
            </CardTitle>
            <CardDescription>
              Factures associées à ce bon de commande
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasPayable && (
              <Button size="sm" variant="outline" onClick={() => setGroupPaymentOpen(true)}>
                <Banknote className="h-4 w-4 mr-1.5" />
                Paiement groupé
              </Button>
            )}
            {!isDeliveryPassed && expectedDeliveryDate && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Clock className="h-3 w-3 mr-1" />
                Upload disponible après le {new Date(expectedDeliveryDate).toLocaleDateString('fr-FR')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cumul facturé vs BdC : contrôle des montants soumis (acompte / intermédiaire / solde) */}
        {activeInvoices.length > 0 && (
          <div className="rounded-lg border bg-muted/30 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Facturé HT</p>
              <p className="text-sm font-semibold">{formatCurrency(invoicedHt, currency)}</p>
              <p className="text-[11px] text-muted-foreground">BdC : {formatCurrency(poHt, currency)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Facturé TTC</p>
              <p className="text-sm font-semibold">{formatCurrency(invoicedTtc, currency)}</p>
              {poTtc != null && (
                <p className="text-[11px] text-muted-foreground">BdC : {formatCurrency(poTtc, currency)}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Avancement facturation</p>
              <p className={`text-sm font-semibold ${
                overInvoiced ? 'text-red-600' : invoicedPct >= 100 ? 'text-green-700' : 'text-amber-600'
              }`}>
                {invoicedPct}%
              </p>
              {overInvoiced && (
                <p className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Dépassement de {formatCurrency(round2(invoicedHt - poHt), currency)} HT
                </p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Reste à facturer (TTC)</p>
              <p className="text-sm font-semibold">{formatCurrency(remainingToInvoiceTtc, currency)}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des factures...</p>
        ) : invoices.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">N° Facture</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Montant HT</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Montant TTC</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Pièce jointe</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice: any) => {
                  const status = statusLabels[invoice.status] || statusLabels.pending;
                  return (
                    <React.Fragment key={invoice.id}>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium">
                        {invoice.invoice_number}
                        {invoice.notes && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">{invoice.notes}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(Number(invoice.amount_ht ?? round2(Number(invoice.amount ?? 0) - Number(invoice.vat_amount ?? 0))), invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(Number(invoice.amount_ttc ?? invoice.amount), invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {invoice.attachment_url && invoice.attachment_url.trim() !== '' ? (
                          <AttachmentLink attachmentUrl={invoice.attachment_url} invoiceNumber={invoice.invoice_number} onPreview={() => { setPreviewUrl(invoice.attachment_url); setPreviewTitle(`Facture ${invoice.invoice_number}`); }} />
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Manquant
                          </Badge>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="px-4 pb-3 bg-muted/10">
                        <InvoicePaymentsSection
                          invoiceId={invoice.id}
                          invoiceTtc={Number(invoice.amount)}
                          currency={invoice.currency}
                        />
                      </td>
                    </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 border rounded-md bg-muted/20">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune facture associée à ce bon de commande</p>
          </div>
        )}

        <div className="pt-2">
          {isDeliveryPassed ? (
            <div>
              <Label
                htmlFor={`invoice-upload-${poId}`}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer transition-colors
                  ${createInvoiceMutation.isPending
                    ? 'opacity-50 pointer-events-none bg-muted'
                    : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
              >
                {createInvoiceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {createInvoiceMutation.isPending ? 'Upload en cours...' : 'Déposer une facture'}
              </Label>
              <Input
                id={`invoice-upload-${poId}`}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileUpload}
                disabled={createInvoiceMutation.isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG ou PNG — max. 10 Mo</p>
            </div>
          ) : (
            <Button disabled variant="outline" className="opacity-50">
              <Clock className="h-4 w-4 mr-2" />
              Upload disponible après la date de livraison
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

      <AttachmentPreviewDialog
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
        attachmentUrl={previewUrl}
        title={previewTitle}
      />

      <POInvoiceUploadDialog
        open={!!pendingFile}
        onOpenChange={(open) => !open && setPendingFile(null)}
        fileName={pendingFile?.name || ''}
        currency={currency}
        defaultInvoiceNumber={`FAC-${poNumber}-${(invoices.length + 1).toString().padStart(2, '0')}`}
        suggestedTtc={remainingToInvoiceTtc}
        isSubmitting={createInvoiceMutation.isPending}
        onSubmit={(input) => {
          if (pendingFile) createInvoiceMutation.mutate({ file: pendingFile, input });
        }}
      />

      <POGroupPaymentDialog
        open={groupPaymentOpen}
        onOpenChange={setGroupPaymentOpen}
        currency={currency}
        lines={paymentLines}
        isSubmitting={addGroupPayment.isPending}
        onSubmit={(input) => addGroupPayment.mutate(input, { onSuccess: () => setGroupPaymentOpen(false) })}
      />
    </>
  );
}
