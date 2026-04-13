import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, ExternalLink, X, Download } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { formatCurrency } from '@/utils/paymentUtils';
import { supabase } from '@/integrations/supabase/client';
import type { InvoiceWithPaymentStatus } from '@/types/payment';

interface InvoicesTableProps {
  invoices: InvoiceWithPaymentStatus[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  showCheckboxes?: boolean;
}

function getAttachmentUrl(path: string | null): string | null {
  if (!path) return null;
  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;
  // Otherwise build a signed URL from storage
  const { data } = supabase.storage.from('invoice-attachments').getPublicUrl(path);
  return data?.publicUrl || null;
}

export function InvoicesTable({
  invoices,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  showCheckboxes = true,
}: InvoicesTableProps) {
  const allSelected = invoices.length > 0 && invoices.every(inv => selectedIds.has(inv.id));
  const someSelected = invoices.some(inv => selectedIds.has(inv.id));
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceWithPaymentStatus | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const handleOpenPreview = async (invoice: InvoiceWithPaymentStatus) => {
    setPreviewInvoice(invoice);
    setSignedUrl(null);
    if (invoice.attachment_url) {
      if (invoice.attachment_url.startsWith('http')) {
        setSignedUrl(invoice.attachment_url);
      } else {
        const { data, error } = await supabase.storage
          .from('invoice-attachments')
          .createSignedUrl(invoice.attachment_url, 3600);
        if (error) {
          console.error('Error creating signed URL:', error);
        }
        setSignedUrl(data?.signedUrl || null);
      }
    }
  };

  return (
    <>
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
                  onClick={() => handleOpenPreview(invoice)}
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
                      <FileText className="h-4 w-4 text-primary" />
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
              {/* Invoice metadata */}
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

              {/* PDF preview or no-attachment message */}
              {signedUrl ? (
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ouvrir
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={signedUrl} download>
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </a>
                    </Button>
                  </div>
                  <object
                    data={signedUrl}
                    type="application/pdf"
                    className="w-full flex-1 min-h-[400px] rounded-md border"
                  >
                    <iframe
                      src={signedUrl}
                      className="w-full h-full min-h-[400px]"
                      title={`Facture ${previewInvoice.invoice_number}`}
                    />
                  </object>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground border rounded-md">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun document attaché à cette facture.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
