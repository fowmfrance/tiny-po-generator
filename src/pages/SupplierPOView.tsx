import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SupplierKYCTab from '@/components/supplier/SupplierKYCTab';
import SupplierInvoiceUploadDialog from '@/components/supplier/SupplierInvoiceUploadDialog';
import SupplierPortalMessages from '@/components/supplier/SupplierPortalMessages';
import { formatCurrency } from '@/utils/paymentUtils';
import {
  AlertCircle, ArrowLeft, Calendar, CheckCircle2, Clock, CreditCard,
  FileCheck, FileText, Loader2, MapPin, MessageSquare, Package, Receipt, Upload, XCircle,
} from 'lucide-react';

type PortalSupplier = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  country: string | null;
  kyc_level_id: string | null;
  kyc_status: string;
};

type PortalPurchaseOrder = {
  id: string;
  po_number: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
};

type PortalInvoice = {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  invoice_date: string;
  due_date: string;
  paid_date: string | null;
  status: string;
  purchase_order_id: string | null;
  attachment_url: string | null;
  po_number: string | null;
};

type SupplierPortalData = {
  supplier: PortalSupplier;
  purchaseOrders: PortalPurchaseOrder[];
  invoices: PortalInvoice[];
  ownerId: string;
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: 'Brouillon', icon: Clock, className: 'bg-muted text-muted-foreground border-transparent' },
  pending: { label: 'En attente', icon: Clock, className: 'bg-secondary text-secondary-foreground border-transparent' },
  approved: { label: 'Approuvé', icon: CheckCircle2, className: 'bg-primary/10 text-primary border-primary/20' },
  rejected: { label: 'Rejeté', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  matched: { label: 'Facture associée', icon: CheckCircle2, className: 'bg-accent text-accent-foreground border-transparent' },
  paid: { label: 'Payé', icon: CheckCircle2, className: 'bg-primary text-primary-foreground border-transparent' },
};

const invoiceStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approuvée', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Payée', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
};

const getPaymentStatusBadge = (invoice: PortalInvoice) => {
  if (invoice.paid_date) {
    return <Badge className="bg-green-100 text-green-800 border-transparent">Payée le {formatDate(invoice.paid_date)}</Badge>;
  }
  const today = new Date();
  const dueDate = new Date(invoice.due_date);
  if (dueDate < today) {
    return <Badge className="bg-red-100 text-red-800 border-transparent">En retard</Badge>;
  }
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) {
    return <Badge className="bg-amber-100 text-amber-800 border-transparent">Échéance dans {diffDays}j</Badge>;
  }
  return <Badge className="bg-muted text-muted-foreground border-transparent">Échéance {formatDate(invoice.due_date)}</Badge>;
};

const SupplierPOView = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadPO, setUploadPO] = useState<PortalPurchaseOrder | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['supplier-portal-data', token],
    enabled: !!token,
    queryFn: async (): Promise<SupplierPortalData> => {
      const { data, error } = await supabase.functions.invoke('supplier-portal-data', {
        body: { token },
      });
      if (error) throw new Error(error.message || 'Impossible de charger le portail fournisseur.');
      if (!data?.supplier) throw new Error('Fournisseur introuvable.');
      return data as SupplierPortalData;
    },
  });

  const handleInvoiceUploaded = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['supplier-portal-data', token] });
    setUploadPO(null);
  }, [queryClient, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement du portail fournisseur…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-3xl font-semibold mb-3">Fournisseur non trouvé</h2>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error ? error.message : 'Impossible de trouver les détails du fournisseur.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/supplier')}>Retour à l'accueil</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { supplier, purchaseOrders, invoices } = data;
  const hasKyc = Boolean(supplier.kyc_level_id);

  // Compute invoiced amounts per PO
  const invoicedByPO = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.purchase_order_id && inv.status !== 'cancelled') {
      invoicedByPO.set(inv.purchase_order_id, (invoicedByPO.get(inv.purchase_order_id) || 0) + Number(inv.amount));
    }
  }

  const pendingOrders = purchaseOrders.filter((po) => ['pending', 'approved'].includes(po.status)).length;
  const totalAmount = purchaseOrders.reduce((sum, po) => sum + Number(po.total_amount || 0), 0);
  const unpaidInvoices = invoices.filter(inv => !inv.paid_date && inv.status !== 'cancelled');
  const paidInvoices = invoices.filter(inv => inv.paid_date);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <Button variant="outline" onClick={() => navigate('/supplier')} className="w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Package className="h-4 w-4" />
                  Portail fournisseur
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">{supplier.name}</h1>
                {(supplier.city || supplier.country) && (
                  <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {[supplier.city, supplier.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
            <Card className="min-w-[220px]">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Accès sécurisé</div>
                <div className="text-lg font-medium mt-1">{supplier.email || 'Email non renseigné'}</div>
                <div className="text-xs text-muted-foreground mt-2">{new Date().toLocaleDateString('fr-FR')}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        <Tabs defaultValue={hasKyc && supplier.kyc_status === 'pending' ? 'kyc' : 'orders'}>
          <TabsList className="mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bons de commande
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Factures
              {unpaidInvoices.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">{unpaidInvoices.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Paiements
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            {hasKyc && (
              <TabsTrigger value="kyc" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Documents KYC
                {supplier.kyc_status === 'pending' && <span className="ml-1 h-2 w-2 rounded-full bg-primary" />}
              </TabsTrigger>
            )}
          </TabsList>

          {/* === ORDERS TAB === */}
          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-medium text-muted-foreground">Bons de commande</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{purchaseOrders.length}</div>
                  <p className="text-sm text-muted-foreground">Total reçus</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-medium text-muted-foreground">À traiter</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{pendingOrders}</div>
                  <p className="text-sm text-muted-foreground">Commandes en cours</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-medium text-muted-foreground">Valeur totale</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{formatCurrency(totalAmount, purchaseOrders[0]?.currency || 'EUR')}</div>
                  <p className="text-sm text-muted-foreground">Montant cumulé</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bons de commande reçus</CardTitle>
                <CardDescription>Retrouvez ici les bons de commande qui vous sont adressés.</CardDescription>
              </CardHeader>
              <CardContent>
                {purchaseOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° bon de commande</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Livraison prévue</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Facturé</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders.map((po) => {
                        const config = statusConfig[po.status] || statusConfig.pending;
                        const StatusIcon = config.icon;
                        const invoicedAmount = invoicedByPO.get(po.id) || 0;
                        const poTotal = Number(po.total_amount || 0);
                        const percentInvoiced = poTotal > 0 ? Math.min(100, (invoicedAmount / poTotal) * 100) : 0;
                        const isFullyInvoiced = percentInvoiced >= 99.99;
                        const canUpload = po.status === 'approved' && !isFullyInvoiced;

                        return (
                          <TableRow key={po.id}>
                            <TableCell className="font-medium">{po.po_number}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(po.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(po.expected_delivery_date)}</TableCell>
                            <TableCell>{formatCurrency(poTotal, po.currency || 'EUR')}</TableCell>
                            <TableCell>
                              <div className="space-y-1 min-w-[120px]">
                                <Progress value={percentInvoiced} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                  {percentInvoiced.toFixed(0)}% — {formatCurrency(invoicedAmount, po.currency || 'EUR')}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={config.className}>
                                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                disabled={!canUpload}
                                onClick={() => setUploadPO(po)}
                                title={isFullyInvoiced ? 'BdC entièrement facturé' : !canUpload ? 'Non facturable dans cet état' : 'Déposer une facture'}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                {isFullyInvoiced ? '100% facturé' : 'Facturer'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-1">Aucun bon de commande</h3>
                    <p className="text-muted-foreground">Aucun bon de commande n'est disponible pour le moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === INVOICES TAB === */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-medium text-muted-foreground">Total factures</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{invoices.length}</div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2"><CardTitle className="text-base font-medium text-amber-700">En attente</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-amber-700">{unpaidInvoices.length}</div>
                  <p className="text-sm text-amber-600">
                    {formatCurrency(unpaidInvoices.reduce((s, i) => s + Number(i.amount), 0))}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-2"><CardTitle className="text-base font-medium text-green-700">Payées</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-green-700">{paidInvoices.length}</div>
                  <p className="text-sm text-green-600">
                    {formatCurrency(paidInvoices.reduce((s, i) => s + Number(i.amount), 0))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Toutes les factures</CardTitle>
                <CardDescription>Suivi de vos factures et de leurs échéances</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Réf. BC</TableHead>
                        <TableHead>Date facture</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead className="text-right">Montant HT</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Paiement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => {
                        const cfg = invoiceStatusConfig[inv.status] || invoiceStatusConfig.pending;
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                            <TableCell>{inv.po_number || '—'}</TableCell>
                            <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                            <TableCell>{formatDate(inv.due_date)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(inv.amount), inv.currency || 'EUR')}</TableCell>
                            <TableCell><Badge className={`${cfg.className} border-transparent`}>{cfg.label}</Badge></TableCell>
                            <TableCell>{getPaymentStatusBadge(inv)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <Receipt className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-1">Aucune facture</h3>
                    <p className="text-muted-foreground">Déposez une facture depuis l'onglet Bons de commande.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === PAYMENTS TAB === */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des paiements</CardTitle>
                <CardDescription>Suivi des règlements reçus</CardDescription>
              </CardHeader>
              <CardContent>
                {paidInvoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Réf. BC</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Date paiement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                          <TableCell>{inv.po_number || '—'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(inv.amount), inv.currency || 'EUR')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              {formatDate(inv.paid_date)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <CreditCard className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-1">Aucun paiement enregistré</h3>
                    <p className="text-muted-foreground">Les paiements apparaîtront ici une fois les factures réglées.</p>
                  </div>
                )}

                {unpaidInvoices.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">En attente de règlement</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Facture</TableHead>
                          <TableHead>Réf. BC</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Échéance</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unpaidInvoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                            <TableCell>{inv.po_number || '—'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(inv.amount), inv.currency || 'EUR')}</TableCell>
                            <TableCell>{formatDate(inv.due_date)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(inv)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === MESSAGES TAB === */}
          <TabsContent value="messages">
            {token && <SupplierPortalMessages token={token} />}
          </TabsContent>

          {/* === KYC TAB === */}
          {hasKyc && (
            <TabsContent value="kyc">
              <SupplierKYCTab
                supplierId={supplier.id}
                portalToken={token}
                initialSupplier={{
                  kyc_level_id: supplier.kyc_level_id,
                  kyc_status: supplier.kyc_status,
                  name: supplier.name,
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Upload Dialog */}
      {uploadPO && (
        <SupplierInvoiceUploadDialog
          open={!!uploadPO}
          onOpenChange={(open) => { if (!open) setUploadPO(null); }}
          purchaseOrder={uploadPO}
          invoicedAmount={invoicedByPO.get(uploadPO.id) || 0}
          token={token!}
          onSuccess={handleInvoiceUploaded}
        />
      )}
    </div>
  );
};

export default SupplierPOView;
