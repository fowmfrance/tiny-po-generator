import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Clock, FileText, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoiceWithPaymentStatus } from '@/types/payment';
import { PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { formatCurrency } from '@/utils/paymentUtils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { AttachmentPreviewDialog } from '@/components/payments/AttachmentPreviewDialog';

interface VendorInvoicesTabProps {
  supplierInvoices: InvoiceWithPaymentStatus[];
  supplierPOs: PurchaseOrder[];
}

function VendorInvoicesTab({ supplierInvoices, supplierPOs }: VendorInvoicesTabProps) {
  const navigate = useNavigate();
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceWithPaymentStatus | null>(null);

  // Load many-to-many links
  const invoiceIds = useMemo(() => supplierInvoices.map(i => i.id), [supplierInvoices]);
  const { data: invoicePOLinks } = useQuery({
    queryKey: ['invoice-po-links', invoiceIds],
    enabled: invoiceIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_purchase_orders')
        .select('*')
        .in('invoice_id', invoiceIds);
      if (error) throw error;
      return data || [];
    },
  });

  const poMap = useMemo(() => {
    const map = new Map<string, PurchaseOrder>();
    supplierPOs.forEach(po => map.set(po.id, po));
    return map;
  }, [supplierPOs]);

  const enrichedInvoices = useMemo(() => {
    return supplierInvoices.map(inv => {
      const links = (invoicePOLinks || []).filter(l => l.invoice_id === inv.id);
      const linkedPOs = links.map(l => ({
        ...l,
        po: poMap.get(l.purchase_order_id),
      }));
      if (linkedPOs.length === 0 && inv.po_number) {
        const matchedPO = supplierPOs.find(po => po.po_number === inv.po_number);
        if (matchedPO) {
          linkedPOs.push({ purchase_order_id: matchedPO.id, amount_allocated: Number(inv.amount), po: matchedPO } as any);
        }
      }
      return { ...inv, linkedPOs };
    });
  }, [supplierInvoices, invoicePOLinks, poMap]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'overdue': return <AlertTriangle className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-800 bg-green-100';
      case 'overdue': return 'text-red-800 bg-red-100';
      case 'due_soon': return 'text-amber-800 bg-amber-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'overdue': return 'Échue';
      case 'due_soon': return 'Bientôt due';
      default: return 'À venir';
    }
  };

  const handleOpenPreview = (inv: InvoiceWithPaymentStatus) => {
    setPreviewInvoice(inv);
  };

  if (enrichedInvoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Aucune facture pour ce fournisseur.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {enrichedInvoices.map(inv => (
          <Card 
            key={inv.id} 
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => handleOpenPreview(inv)}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {inv.attachment_url && <FileText className="h-4 w-4 text-primary shrink-0" />}
                    <span className="font-semibold text-sm">{inv.invoice_number}</span>
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle(inv.payment_status)}`}>
                      {statusIcon(inv.payment_status)}
                      {statusLabel(inv.payment_status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                    <span>Date facture : {new Date(inv.invoice_date).toLocaleDateString('fr-FR')}</span>
                    <span>Reçue le : {new Date(inv.received_date).toLocaleDateString('fr-FR')}</span>
                    <span>Échéance : {new Date(inv.due_date).toLocaleDateString('fr-FR')}</span>
                    {inv.paid_date && <span>Payée le : {new Date(inv.paid_date).toLocaleDateString('fr-FR')}</span>}
                  </div>

                  {inv.linkedPOs.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> Bons de commande liés
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {inv.linkedPOs.map((link: any, idx: number) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              link.po && navigate(`/purchase-orders/${link.po.id}`);
                            }}
                          >
                            {link.po?.po_number || link.purchase_order_id.slice(0, 8)}
                            {link.amount_allocated > 0 && (
                              <span className="ml-1 text-muted-foreground">
                                ({formatCurrency(link.amount_allocated, inv.currency)})
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{formatCurrency(Number(inv.amount), inv.currency)}</p>
                  {(inv.linkedPOs.length > 0 || inv.po_number) && (
                    <p className="text-xs text-muted-foreground">
                      Réf. {inv.linkedPOs[0]?.po?.po_number || inv.po_number}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {previewInvoice && (
        <AttachmentPreviewDialog
          open={!!previewInvoice}
          onOpenChange={(open) => !open && setPreviewInvoice(null)}
          attachmentUrl={previewInvoice.attachment_url}
          title={`Facture ${previewInvoice.invoice_number}`}
        >
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
              <p className="font-medium">{new Date(previewInvoice.invoice_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Échéance</p>
              <p className="font-medium">{new Date(previewInvoice.due_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Statut</p>
              <PaymentStatusBadge status={previewInvoice.payment_status} />
            </div>
          </div>
        </AttachmentPreviewDialog>
      )}
    </>
  );
}

export default VendorInvoicesTab;
