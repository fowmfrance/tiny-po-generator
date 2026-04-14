import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, PackageOpen } from 'lucide-react';
import { SupplierLink } from '@/components/ui/supplier-link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { InvoiceAttachmentPreview } from './InvoiceAttachmentPreview';
import { formatCurrency } from '@/utils/paymentUtils';
import { downloadSingleAttachment, downloadMultipleAsZip, type DownloadableItem } from '@/lib/bulk-download';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceWithPaymentStatus } from '@/types/payment';

interface InvoicesTableProps {
  invoices: InvoiceWithPaymentStatus[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  showCheckboxes?: boolean;
}

export function InvoicesTable({
  invoices,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  showCheckboxes = true,
}: InvoicesTableProps) {
  const { toast } = useToast();
  const allSelected = invoices.length > 0 && invoices.every(inv => selectedIds.has(inv.id));
  const someSelected = invoices.some(inv => selectedIds.has(inv.id));
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceWithPaymentStatus | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const invoicesWithAttachments = invoices.filter(inv => inv.attachment_url);

  const handleDownload = async (invoice: InvoiceWithPaymentStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!invoice.attachment_url) return;
    setDownloadingId(invoice.id);
    try {
      const ext = invoice.attachment_url.split('.').pop()?.split('?')[0] || 'pdf';
      await downloadSingleAttachment(invoice.attachment_url, `${invoice.invoice_number}.${ext}`);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de télécharger le fichier.', variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBulkDownload = async () => {
    setIsBulkDownloading(true);
    try {
      const items: DownloadableItem[] = invoicesWithAttachments.map(inv => {
        const ext = inv.attachment_url!.split('.').pop()?.split('?')[0] || 'pdf';
        return { path: inv.attachment_url!, filename: `${inv.invoice_number}.${ext}` };
      });
      const count = await downloadMultipleAsZip(items, `factures-${format(new Date(), 'yyyy-MM-dd')}.zip`);
      toast({ title: 'Téléchargement terminé', description: `${count} facture(s) téléchargée(s).` });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsBulkDownloading(false);
    }
  };

  return (
    <>
      {invoicesWithAttachments.length > 1 && (
        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" onClick={handleBulkDownload} disabled={isBulkDownloading}>
            {isBulkDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PackageOpen className="h-4 w-4 mr-2" />}
            Télécharger toutes les pièces jointes ({invoicesWithAttachments.length})
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckboxes && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => onSelectAll(!!checked)}
                    aria-label="Sélectionner tout"
                    className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                </TableHead>
              )}
              <TableHead>N° Facture</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>N° BC</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Date facture</TableHead>
              <TableHead>Reçue le</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCheckboxes ? 11 : 10} className="text-center text-muted-foreground py-8">
                  Aucune facture trouvée
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow 
                  key={invoice.id}
                  className={`cursor-pointer hover:bg-muted/50 ${selectedIds.has(invoice.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => setPreviewInvoice(invoice)}
                >
                  {showCheckboxes && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(invoice.id)}
                        onCheckedChange={(checked) => onSelectionChange(invoice.id, !!checked)}
                        aria-label={`Sélectionner facture ${invoice.invoice_number}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      {invoice.attachment_url && <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                      {invoice.invoice_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.supplier ? (
                      <SupplierLink supplierId={invoice.supplier_id} name={invoice.supplier.name} />
                    ) : '-'}
                  </TableCell>
                  <TableCell>{invoice.project_code || '-'}</TableCell>
                  <TableCell>{invoice.po_number || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(invoice.amount), invoice.currency)}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(invoice.invoice_date), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(invoice.received_date), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(invoice.due_date), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={invoice.payment_status} />
                  </TableCell>
                  <TableCell>
                    {invoice.attachment_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleDownload(invoice, e)}
                        disabled={downloadingId === invoice.id}
                        title="Télécharger"
                      >
                        {downloadingId === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice preview dialog */}
      <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Facture {previewInvoice?.invoice_number}
            </DialogTitle>
            <DialogDescription>Détails et aperçu de la facture</DialogDescription>
          </DialogHeader>
          
          {previewInvoice && (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fournisseur</p>
                  <p className="font-medium">{previewInvoice.supplier?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Montant</p>
                  <p className="font-medium">{formatCurrency(Number(previewInvoice.amount), previewInvoice.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date facture</p>
                  <p className="font-medium">{format(parseISO(previewInvoice.invoice_date), 'dd MMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reçue le</p>
                  <p className="font-medium">{format(parseISO(previewInvoice.received_date), 'dd MMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Échéance</p>
                  <p className="font-medium">{format(parseISO(previewInvoice.due_date), 'dd MMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <PaymentStatusBadge status={previewInvoice.payment_status} />
                </div>
                {previewInvoice.po_number && (
                  <div>
                    <p className="text-muted-foreground">N° BC</p>
                    <p className="font-medium">{previewInvoice.po_number}</p>
                  </div>
                )}
                {previewInvoice.project_code && (
                  <div>
                    <p className="text-muted-foreground">Projet</p>
                    <p className="font-medium">{previewInvoice.project_code}</p>
                  </div>
                )}
              </div>

              <InvoiceAttachmentPreview
                attachmentUrl={previewInvoice.attachment_url}
                title={`Facture ${previewInvoice.invoice_number}`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
