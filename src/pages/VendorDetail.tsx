import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, Mail, Phone, Building, FileText, Share2, Archive,
  AlertTriangle, CheckCircle, Clock as ClockIcon, MapPin, Star, Handshake, TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { useSupplierAccessToken } from '@/hooks/useSupplierAccessToken';
import { Copy, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/paymentUtils';

const VendorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { suppliers, isLoading: loadingSuppliers } = useSuppliers();
  const { purchaseOrders, isLoading: loadingPOs } = usePurchaseOrders();
  const { invoices, isLoading: loadingInvoices } = useSupplierInvoices();
  const { copyPortalLink } = useSupplierAccessToken(id);

  const supplier = useMemo(() => suppliers.find(s => s.id === id), [suppliers, id]);
  const supplierPOs = useMemo(() => purchaseOrders.filter(po => po.supplier_id === id), [purchaseOrders, id]);
  const supplierInvoices = useMemo(() => invoices.filter(inv => inv.supplier_id === id), [invoices, id]);

  const isLoading = loadingSuppliers || loadingPOs || loadingInvoices;

  if (isLoading) {
    return <div className="flex justify-center items-center p-8">Chargement...</div>;
  }

  if (!supplier) {
    return (
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => navigate('/vendors')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux fournisseurs
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-lg text-muted-foreground">Fournisseur introuvable.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paidInvoices = supplierInvoices.filter(inv => inv.payment_status === 'paid');
  const pendingInvoices = supplierInvoices.filter(inv => inv.payment_status === 'not_due' || inv.payment_status === 'due_soon');
  const overdueInvoices = supplierInvoices.filter(inv => inv.payment_status === 'overdue');
  const totalOutstanding = supplierInvoices
    .filter(inv => inv.payment_status !== 'paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate('/vendors')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour aux fournisseurs
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={() => copyPortalLink()}
          >
            <Copy className="w-4 h-4" /> Copier lien portail
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Supplier Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{supplier.name}</CardTitle>
                <p className="text-muted-foreground">{supplier.supplier_type?.name || 'Non classé'}</p>
                {supplier.specialty && <Badge variant="secondary" className="mt-1">{supplier.specialty}</Badge>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                  {supplier.is_active ? 'Actif' : 'Inactif'}
                </Badge>
                {(supplier.average_rating || 0) > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{supplier.average_rating!.toFixed(1)}</span>
                    <span className="text-muted-foreground">({supplier.total_ratings})</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                <span>{supplier.email}</span>
              </div>
              {supplier.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {(supplier.city || supplier.country) && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Building className="h-4 w-4 mr-3 text-muted-foreground" />
                <span>{supplierPOs.length} Bon{supplierPOs.length > 1 ? 's' : ''} de Commande</span>
              </div>
              <div className="flex items-center gap-4 pt-2 border-t mt-2">
                {supplier.has_negotiated_rates && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Handshake className="h-3 w-3" />
                    <span>Tarifs négociés</span>
                  </div>
                )}
                {supplier.business_volume > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>{formatCurrency(supplier.business_volume)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Statut Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 rounded-md p-2 text-center">
                  <span className="text-xl font-bold text-green-600">{paidInvoices.length}</span>
                  <p className="text-xs text-green-700">Payées</p>
                </div>
                <div className="bg-yellow-50 rounded-md p-2 text-center">
                  <span className="text-xl font-bold text-yellow-600">{pendingInvoices.length}</span>
                  <p className="text-xs text-yellow-700">En attente</p>
                </div>
                <div className="bg-red-50 rounded-md p-2 text-center">
                  <span className="text-xl font-bold text-red-600">{overdueInvoices.length}</span>
                  <p className="text-xs text-red-700">Échues</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Total en attente</h4>
                <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Bons de Commande
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supplierPOs.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">N° BC</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Budget</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Montant</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {supplierPOs.map(po => (
                      <tr key={po.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                        <td className="px-4 py-3 font-medium text-primary">{po.po_number}</td>
                        <td className="px-4 py-3 text-muted-foreground">{po.budget?.name || '—'}</td>
                        <td className="px-4 py-3">{new Date(po.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(po.total_amount), po.currency)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={po.status === 'paid' ? 'default' : po.status === 'approved' ? 'secondary' : 'outline'}>
                            {po.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">Aucun bon de commande pour ce fournisseur.</p>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        {supplierInvoices.length > 0 && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Factures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">N° Facture</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Réf. BC</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Échéance</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Montant</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {supplierInvoices.map(inv => (
                      <tr key={inv.id}>
                        <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                        <td className="px-4 py-3 text-muted-foreground">{inv.po_number || '—'}</td>
                        <td className="px-4 py-3">{new Date(inv.invoice_date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3">{new Date(inv.due_date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(inv.amount), inv.currency)}</td>
                        <td className="px-4 py-3 text-center">
                          {inv.payment_status === 'paid' && (
                            <span className="inline-flex items-center text-xs font-medium text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3 mr-1" /> Payée
                            </span>
                          )}
                          {inv.payment_status === 'overdue' && (
                            <span className="inline-flex items-center text-xs font-medium text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Échue
                            </span>
                          )}
                          {inv.payment_status === 'due_soon' && (
                            <span className="inline-flex items-center text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              <ClockIcon className="w-3 h-3 mr-1" /> Bientôt due
                            </span>
                          )}
                          {inv.payment_status === 'not_due' && (
                            <span className="inline-flex items-center text-xs font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded-full">
                              <ClockIcon className="w-3 h-3 mr-1" /> À venir
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VendorDetail;
