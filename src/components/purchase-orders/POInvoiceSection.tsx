import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/paymentUtils';
import { openInvoiceAttachmentInNewTab } from '@/lib/invoice-attachments';

interface POInvoiceSectionProps {
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  currency: string;
  totalAmount: number;
  expectedDeliveryDate: string | null;
  poStatus: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente de validation', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  validated: { label: 'Validée', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-700 border-red-200' },
  paid: { label: 'Payée', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

function AttachmentLink({ attachmentUrl }: { attachmentUrl: string }) {
  const { toast } = useToast();
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = async () => {
    try {
      setIsOpening(true);
      const opened = await openInvoiceAttachmentInNewTab(attachmentUrl);
      if (!opened) {
        toast({ title: 'Erreur', description: 'Impossible d’ouvrir le document.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error opening invoice attachment:', error);
      toast({ title: 'Erreur', description: 'Impossible d’ouvrir le document.', variant: 'destructive' });
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={isOpening}
      className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors"
    >
      {isOpening ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
      <ExternalLink className="h-3 w-3" />
      Fichier joint
    </button>
  );
}

export function POInvoiceSection({
  poId,
  poNumber,
  supplierId,
  supplierName,
  currency,
  totalAmount,
  expectedDeliveryDate,
  poStatus,
}: POInvoiceSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const isDeliveryPassed = expectedDeliveryDate
    ? new Date(expectedDeliveryDate) <= new Date()
    : true; // If no delivery date set, allow upload

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
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Upload file
      const filePath = `${user.id}/${poId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('invoice-attachments')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Create invoice record
      const invoiceNumber = `FAC-${poNumber}-${(invoices.length + 1).toString().padStart(2, '0')}`;
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('supplier_invoices')
        .insert({
          user_id: user.id,
          supplier_id: supplierId,
          purchase_order_id: poId,
          po_number: poNumber,
          invoice_number: invoiceNumber,
          amount: totalAmount,
          currency,
          invoice_date: today,
          due_date: dueDate,
          received_date: today,
          status: 'pending',
          attachment_url: filePath,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['po-invoices', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] });
      toast({ title: 'Facture créée', description: 'La facture a été enregistrée et est en attente de validation.' });
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    createInvoiceMutation.mutate(file);
  };

  const isDraft = poStatus === 'draft';

  if (isDraft) return null;

  return (
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
          {!isDeliveryPassed && expectedDeliveryDate && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Clock className="h-3 w-3 mr-1" />
              Upload disponible après le {new Date(expectedDeliveryDate).toLocaleDateString('fr-FR')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des factures...</p>
        ) : invoices.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">N° Facture</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Montant</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Pièce jointe</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice: any) => {
                  const status = statusLabels[invoice.status] || statusLabels.pending;
                  return (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3 text-sm font-medium">{invoice.invoice_number}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(Number(invoice.amount), invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {invoice.attachment_url && invoice.attachment_url.trim() !== '' ? (
                          <AttachmentLink attachmentUrl={invoice.attachment_url} />
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Manquant
                          </Badge>
                        )}
                      </td>
                    </tr>
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

        {/* Upload section */}
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
  );
}
