import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { POInvoiceSection } from '@/components/purchase-orders/POInvoiceSection';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrder, usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { formatCurrency } from '@/utils/paymentUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente d\'approbation',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  sent: 'Envoyé',
  matched: 'Facture rapprochée',
  paid: 'Payé',
};

const PurchaseOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: po, isLoading } = usePurchaseOrder(id);
  const { updatePOStatus, deletePO } = usePurchaseOrders();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check supplier KYC status
  const { data: supplierKycStatus } = useQuery({
    queryKey: ['supplier-kyc-status', po?.supplier_id],
    enabled: !!po?.supplier_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('suppliers')
        .select('kyc_status, kyc_level_id')
        .eq('id', po!.supplier_id)
        .single();
      return data;
    },
  });

  const isKycBlocking = supplierKycStatus?.kyc_level_id && supplierKycStatus?.kyc_status !== 'verified';

  const handleStatusChange = (newStatus: string) => {
    if (!po) return;
    updatePOStatus.mutate(
      { id: po.id, status: newStatus as any },
      {
        onSuccess: () => {
          toast({ title: 'Statut mis à jour', description: `Le statut a été changé en "${statusLabels[newStatus] || newStatus}"` });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!po) return;
    deletePO.mutate(po.id, {
      onSuccess: () => {
        navigate('/purchase-orders');
      },
    });
  };

  const canDelete = po && !['sent', 'matched', 'paid'].includes(po.status);

  if (isLoading) {
    return <div className="flex justify-center items-center p-8">Chargement...</div>;
  }

  if (!po) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Bon de commande introuvable</h2>
        <p className="mb-4">Le bon de commande que vous recherchez n'existe pas.</p>
        <Button onClick={() => navigate('/purchase-orders')}>Retour aux bons de commande</Button>
      </div>
    );
  }

  const paymentProgress = po.status === 'paid' ? 100 : po.status === 'matched' ? 60 : 0;

  return (
    <div className="space-y-6">
      {isKycBlocking && po.status === 'draft' && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">KYC fournisseur en attente</p>
            <p className="text-sm">Ce bon de commande restera en brouillon tant que le fournisseur n'aura pas finalisé sa vérification KYC.</p>
          </div>
        </div>
      )}
      {/* Header - navigation only */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/purchase-orders')} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Bon de commande #{po.po_number}</h1>
            <Badge className={`text-sm px-3 py-1 ${
              po.status === 'draft' 
                ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700' 
                : po.status === 'rejected'
                  ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10'
                  : po.status === 'approved' || po.status === 'sent'
                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300'
                    : ''
            }`} variant="outline">
              {statusLabels[po.status] || po.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">Créé le {new Date(po.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget */}
        <Card>
          <CardHeader><CardTitle>Budget</CardTitle></CardHeader>
          <CardContent>
            {po.budget ? (
              <div>
                <Link to={`/budgets/${po.budget_id}`} className="text-primary font-medium text-lg hover:underline">
                  {po.budget.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">Code : {po.budget.code}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun budget associé</p>
            )}
            {(['approved', 'matched', 'paid'].includes(po.status)) && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span>Avancement paiement</span>
                  <span>{paymentProgress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${paymentProgress}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier */}
        <Card>
          <CardHeader><CardTitle>Fournisseur</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-lg">{po.supplier?.name || 'Inconnu'}</p>
                <p className="text-sm text-muted-foreground">{po.supplier?.email}</p>
              </div>
              <Link to={`/vendors/${po.supplier_id}`} className="text-primary flex items-center gap-1 text-sm">
                Voir le profil <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Amount */}
        <Card>
          <CardHeader><CardTitle>Montant</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(Number(po.total_amount), po.currency)}</p>
            {po.expected_delivery_date && (
              <p className="text-sm text-muted-foreground mt-2">
                Livraison prévue : {new Date(po.expected_delivery_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader><CardTitle>Articles</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Quantité</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Prix unitaire</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(po.items || []).map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(item.unit_price), po.currency)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(Number(item.total), po.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">Total :</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(Number(po.total_amount), po.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {po.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{po.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Invoices Section - visible when PO is not draft */}
      <POInvoiceSection
        poId={po.id}
        poNumber={po.po_number}
        supplierId={po.supplier_id}
        supplierName={po.supplier?.name || 'Inconnu'}
        currency={po.currency}
        totalAmount={Number(po.total_amount)}
        expectedDeliveryDate={po.expected_delivery_date}
        poStatus={po.status}
      />

      {/* Action Buttons - Bottom of page */}
      <div className="flex items-center justify-between border-t pt-6">
        <div>
          {canDelete && (
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" /> Annuler le bon de commande
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {po.status === 'draft' && (
            <>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}>
                <Pencil className="h-4 w-4" /> Modifier
              </Button>
              {isKycBlocking ? (
                <Button disabled className="flex items-center gap-2" title="Le fournisseur doit finaliser son KYC">
                  <AlertTriangle className="h-4 w-4" /> KYC en attente
                </Button>
              ) : (
                <Button onClick={() => handleStatusChange('pending')}>
                  Soumettre pour approbation
                </Button>
              )}
            </>
          )}
          {po.status === 'pending' && (
            <>
              <Button variant="destructive" onClick={() => handleStatusChange('rejected')}>Rejeter</Button>
              <Button onClick={() => handleStatusChange('approved')}>Approuver</Button>
            </>
          )}
          {po.status === 'approved' && (
            <Button onClick={() => handleStatusChange('sent')}>Marquer comme envoyé</Button>
          )}
          {po.status === 'sent' && (
            <Button onClick={() => handleStatusChange('matched')}>Rapprocher facture</Button>
          )}
          {po.status === 'matched' && (
            <Button onClick={() => handleStatusChange('paid')}>Marquer comme payé</Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler ce bon de commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le bon de commande #{po.po_number} sera supprimé et le budget associé sera libéré.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, conserver</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Oui, annuler le BdC
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchaseOrderDetail;