import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Mail, Phone, Building, FileText, Share2, Send, Pencil,
  AlertTriangle, CheckCircle, Clock as ClockIcon, MapPin, Star, Handshake, TrendingUp, BarChart3, Receipt, ShieldOff, CreditCard, History, Users, Trash2, Eye, MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { useSupplierAccessToken } from '@/hooks/useSupplierAccessToken';
import { Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/paymentUtils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import VendorKPITab from '@/components/vendors/VendorKPITab';
import VendorInvoicesTab from '@/components/vendors/VendorInvoicesTab';
import VendorKYCReviewTab from '@/components/vendors/VendorKYCReviewTab';
import { EditSupplierContactDialog } from '@/components/vendors/EditSupplierContactDialog';
import SupplierTimeline from '@/components/vendors/SupplierTimeline';
import SupplierBankTransactions from '@/components/vendors/SupplierBankTransactions';
import SupplierPaymentSuggestions from '@/components/vendors/SupplierPaymentSuggestions';
import SupplierMessagesTab from '@/components/vendors/SupplierMessagesTab';
import { SupplierContactsSection } from '@/components/vendors/SupplierContactsSection';
import { DeleteSupplierDialog } from '@/components/vendors/DeleteSupplierDialog';
import { useSupplierContacts } from '@/hooks/useSupplierContacts';
import { SupplierEnrichment } from '@/components/vendors/SupplierEnrichment';
import { AttachmentPreviewDialog } from '@/components/payments/AttachmentPreviewDialog';
import { subMonths, startOfYear, isAfter, parseISO } from 'date-fns';

type PeriodFilter = '1M' | '3M' | '6M' | '12M' | 'YTD' | 'ALL';

function getFilterDate(period: PeriodFilter): Date | null {
  const now = new Date();
  switch (period) {
    case '1M': return subMonths(now, 1);
    case '3M': return subMonths(now, 3);
    case '6M': return subMonths(now, 6);
    case '12M': return subMonths(now, 12);
    case 'YTD': return startOfYear(now);
    case 'ALL': return null;
  }
}

interface VendorDetailProps {
  supplierId?: string;
  embedded?: boolean;
}

const VendorDetail = ({ supplierId, embedded = false }: VendorDetailProps = {}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = supplierId || paramId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [bankRefresh, setBankRefresh] = useState(0);

  // Check admin role
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' }).then(({ data: isAdm }) => {
          setIsAdmin(Boolean(isAdm));
        });
      }
    });
  }, []);
  
  const { suppliers, isLoading: loadingSuppliers, updateSupplier, deleteSupplier } = useSuppliers();
  const { purchaseOrders, isLoading: loadingPOs } = usePurchaseOrders();
  const { invoices, isLoading: loadingInvoices } = useSupplierInvoices();
  const { copyPortalLink, sendMagicLink } = useSupplierAccessToken(id);
  const { contacts } = useSupplierContacts(id);

  const supplier = useMemo(() => suppliers.find(s => s.id === id), [suppliers, id]);
  const supplierPOs = useMemo(() => purchaseOrders.filter(po => po.supplier_id === id), [purchaseOrders, id]);
  const supplierInvoices = useMemo(() => invoices.filter(inv => inv.supplier_id === id), [invoices, id]);

  // Filtered data by period
  const filterDate = useMemo(() => getFilterDate(period), [period]);

  const filteredPOs = useMemo(() => {
    if (!filterDate) return supplierPOs;
    return supplierPOs.filter(po => isAfter(parseISO(po.created_at), filterDate));
  }, [supplierPOs, filterDate]);

  const filteredInvoices = useMemo(() => {
    if (!filterDate) return supplierInvoices;
    return supplierInvoices.filter(inv => isAfter(parseISO(inv.invoice_date), filterDate));
  }, [supplierInvoices, filterDate]);

  const paidInvoices = useMemo(() => filteredInvoices.filter(inv => inv.payment_status === 'paid'), [filteredInvoices]);
  const pendingInvoices = useMemo(() => filteredInvoices.filter(inv => inv.payment_status === 'not_due' || inv.payment_status === 'due_soon'), [filteredInvoices]);
  const overdueInvoices = useMemo(() => filteredInvoices.filter(inv => inv.payment_status === 'overdue'), [filteredInvoices]);

  const totalCommande = useMemo(() => filteredPOs.reduce((s, po) => s + Number(po.total_amount), 0), [filteredPOs]);
  const totalFacture = useMemo(() => filteredInvoices.reduce((s, inv) => s + Number(inv.amount), 0), [filteredInvoices]);
  const totalPaye = useMemo(() => paidInvoices.reduce((s, inv) => s + Number(inv.amount), 0), [paidInvoices]);

  // Paiements bancaires rattachés au tiers (décaissements). Alimentent la synthèse
  // pour que l'argent réellement versé soit visible même sans facture saisie.
  const { data: bankTx } = useQuery({
    queryKey: ['supplier-bank-tx', id, bankRefresh],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, qonto_amount, qonto_side, qonto_settled_at, qonto_emitted_at')
        .eq('supplier_id', id!);
      if (error) throw error;
      return data || [];
    },
  });

  const filteredBankTx = useMemo(() => {
    const rows = (bankTx || []).filter(t => t.qonto_side === 'debit');
    if (!filterDate) return rows;
    return rows.filter(t => {
      const d = t.qonto_settled_at || t.qonto_emitted_at;
      return d ? isAfter(parseISO(d), filterDate) : true;
    });
  }, [bankTx, filterDate]);

  const totalPayeBanque = useMemo(
    () => filteredBankTx.reduce((s, t) => s + Math.abs(Number(t.qonto_amount) || 0), 0),
    [filteredBankTx]
  );

  // Load PO items for KPI calculations
  const { data: poItems } = useQuery({
    queryKey: ['po-items-for-supplier', id],
    enabled: !!id && supplierPOs.length > 0,
    queryFn: async () => {
      const poIds = supplierPOs.map(po => po.id);
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('*')
        .in('purchase_order_id', poIds);
      if (error) throw error;
      return data || [];
    },
  });

  // Enrich POs with items for KPI tab
  const enrichedPOs = useMemo(() => {
    if (!poItems) return supplierPOs;
    return supplierPOs.map(po => ({
      ...po,
      items: poItems.filter(item => item.purchase_order_id === po.id).map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total: Number(item.total || item.quantity * item.unit_price),
      })),
    }));
  }, [supplierPOs, poItems]);

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

  const periodButtons: PeriodFilter[] = ['1M', '3M', '6M', '12M', 'YTD', 'ALL'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {!embedded ? (
          <Button variant="outline" onClick={() => navigate('/vendors')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour aux fournisseurs
          </Button>
        ) : <div />}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button 
              variant="destructive" 
              size="sm"
              className="flex items-center gap-2" 
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </Button>
          )}
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={() => copyPortalLink()}
          >
            <Copy className="w-4 h-4" /> Copier lien portail
          </Button>
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => id && sendMagicLink.mutate(id)}
            disabled={sendMagicLink.isPending || !supplier.email}
            title={!supplier.email ? "Renseigner d'abord un email sur la fiche" : undefined}
          >
            <Send className="w-4 h-4" /> Envoyer le lien par email
          </Button>
        </div>
      </div>

      {/* Supplier header card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{supplier.name}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">{supplier.supplier_type?.name || 'Non classé'}</p>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {supplier.specialty && <Badge variant="secondary">{supplier.specialty}</Badge>}
                {supplier.service_type && <Badge variant="secondary">{supplier.service_type.name}</Badge>}
                {supplier.expense_family_name && <Badge variant="outline">{supplier.expense_family_name}</Badge>}
                {supplier.is_mixed && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">Mixte</Badge>
                )}
              </div>
              <div className="mt-2">
                <SupplierEnrichment supplier={supplier} />
              </div>
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
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{supplier.email || <span className="text-muted-foreground italic">Pas d'email</span>}</span>
            </div>
            {supplier.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{supplier.phone}</span>
              </div>
            )}
            {(supplier.city || supplier.country) && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{supplierPOs.length} BC</span>
            </div>
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
            {supplier.is_po_exempt && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <ShieldOff className="h-3 w-3 mr-1" />
                Dispensé de BdC
              </Badge>
            )}
            {supplier.payment_method && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3" />
                <span>{supplier.payment_method.name}{supplier.payment_modality ? ` · ${supplier.payment_modality.name}` : ''}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs — en modale (depuis la banque) on ouvre direct sur Paiements */}
      <Tabs defaultValue={embedded ? 'paiements' : 'overview'}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Aperçu
          </TabsTrigger>
          <TabsTrigger value="paiements" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" /> Paiements
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" /> Messages
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Contacts
          </TabsTrigger>
          <TabsTrigger value="historique" className="flex items-center gap-1.5">
            <History className="h-4 w-4" /> Historique
          </TabsTrigger>
          <TabsTrigger value="kpis" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" /> KPIs
          </TabsTrigger>
          <TabsTrigger value="kyc" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> KYC
            {supplier.kyc_status === 'pending' && (
              <span className="ml-1 h-2 w-2 rounded-full bg-amber-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Unified summary card */}
          <Card>
            <CardContent className="pt-5">
              {/* Period filters */}
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-base">Synthèse</CardTitle>
                <div className="flex gap-1">
                  {periodButtons.map(p => (
                    <Button
                      key={p}
                      variant={period === p ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setPeriod(p)}
                    >
                      {p === 'ALL' ? 'Tout' : p}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Row 1: counts + payment status chart */}
              <div className="flex items-center gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold">{filteredPOs.length}</span>
                  <span className="text-sm text-muted-foreground">BdC</span>
                </div>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold">{filteredInvoices.length}</span>
                  <span className="text-sm text-muted-foreground">factures reçues</span>
                </div>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold">{filteredBankTx.length}</span>
                  <span className="text-sm text-muted-foreground">paiements banque</span>
                </div>
                <span className="text-muted-foreground">dont :</span>
                <div className="flex gap-2">
                  <div className="bg-green-50 rounded-md px-3 py-1.5 text-center">
                    <span className="text-lg font-bold text-green-600">{paidInvoices.length}</span>
                    <p className="text-[10px] text-green-700">Payées</p>
                  </div>
                  <div className="bg-yellow-50 rounded-md px-3 py-1.5 text-center">
                    <span className="text-lg font-bold text-yellow-600">{pendingInvoices.length}</span>
                    <p className="text-[10px] text-yellow-700">En attente</p>
                  </div>
                  <div className="bg-red-50 rounded-md px-3 py-1.5 text-center">
                    <span className="text-lg font-bold text-red-600">{overdueInvoices.length}</span>
                    <p className="text-[10px] text-red-700">Échues</p>
                  </div>
                </div>
              </div>

              {/* Row 2: financial totals */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Total commandé</p>
                  <p className="text-xl font-bold">{formatCurrency(totalCommande)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total facturé</p>
                  <p className="text-xl font-bold">{formatCurrency(totalFacture)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payé (factures)</p>
                  <p className="text-xl font-bold">{formatCurrency(totalPaye)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Réglé (banque)</p>
                  <p className="text-xl font-bold text-brand">{formatCurrency(totalPayeBanque)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BdC section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bons de commande</CardTitle>
            </CardHeader>
            <CardContent>
              {supplierPOs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun bon de commande.</p>
              ) : (
                <div className="space-y-2">
                  {supplierPOs.slice(0, 5).map(po => (
                    <div
                      key={po.id}
                      className="flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                    >
                      <div>
                        <span className="text-sm font-medium">{po.po_number}</span>
                        <span className="text-xs text-muted-foreground ml-2">{new Date(po.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{po.status}</Badge>
                        <span className="text-sm font-semibold">{formatCurrency(Number(po.total_amount), po.currency)}</span>
                      </div>
                    </div>
                  ))}
                  {supplierPOs.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">+ {supplierPOs.length - 5} autres</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Factures section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Factures</CardTitle>
            </CardHeader>
            <CardContent>
              {supplierInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune facture.</p>
              ) : (
                <div className="space-y-2">
                  {supplierInvoices.slice(0, 5).map(inv => (
                    <div
                      key={inv.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-md border transition-colors',
                        inv.attachment_url ? 'cursor-pointer hover:bg-muted/50' : ''
                      )}
                      onClick={() => {
                        if (inv.attachment_url) {
                          setPreviewUrl(inv.attachment_url);
                          setPreviewTitle(`Facture ${inv.invoice_number}`);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {inv.attachment_url && <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="text-sm font-medium">{inv.invoice_number}</span>
                        <span className="text-xs text-muted-foreground">{new Date(inv.invoice_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            inv.payment_status === 'paid' && 'border-emerald-300 text-emerald-700',
                            inv.payment_status === 'overdue' && 'border-red-300 text-red-700',
                            inv.payment_status === 'due_soon' && 'border-amber-300 text-amber-700',
                          )}
                        >
                          {inv.payment_status === 'paid' ? 'Payée' : inv.payment_status === 'overdue' ? 'Échue' : inv.payment_status === 'due_soon' ? 'Bientôt due' : 'À venir'}
                        </Badge>
                        <span className="text-sm font-semibold">{formatCurrency(Number(inv.amount), inv.currency)}</span>
                      </div>
                    </div>
                  ))}
                  {supplierInvoices.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">+ {supplierInvoices.length - 5} autres</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paiements" className="mt-4 space-y-6">
          <SupplierPaymentSuggestions
            supplierId={id!}
            supplierName={supplier.name}
            onAttached={() => setBankRefresh((n) => n + 1)}
          />
          <SupplierBankTransactions supplierId={id!} refreshToken={bankRefresh} />
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <SupplierMessagesTab supplierId={id!} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <SupplierContactsSection supplierId={id!} />
        </TabsContent>

        <TabsContent value="historique" className="mt-4 space-y-6">
          <SupplierTimeline
            purchaseOrders={supplierPOs}
            invoices={supplierInvoices}
          />
        </TabsContent>

        <TabsContent value="kpis" className="mt-4">
          <VendorKPITab
            supplierPOs={enrichedPOs}
            supplierInvoices={supplierInvoices}
            bankTransactions={bankTx || []}
            currency={supplierPOs[0]?.currency || 'EUR'}
          />
        </TabsContent>

        <TabsContent value="kyc" className="mt-4">
          <VendorKYCReviewTab
            supplierId={id!}
            supplierName={supplier.name}
          />
        </TabsContent>
      </Tabs>

      {supplier && (
        <EditSupplierContactDialog
          supplier={supplier}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={(updates) => {
            updateSupplier.mutate(updates, {
              onSuccess: () => setEditOpen(false),
            });
          }}
          isPending={updateSupplier.isPending}
          isAdmin={isAdmin}
        />
      )}

      {supplier && (
        <DeleteSupplierDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          supplier={supplier}
          contacts={contacts}
          otherSuppliers={suppliers.filter(s => s.id !== id)}
          poCount={supplierPOs.length}
          invoiceCount={supplierInvoices.length}
          onConfirm={async (contactActions) => {
            await deleteSupplier.mutateAsync({ id: id!, contactActions });
            navigate('/vendors');
          }}
        />
      )}

      <AttachmentPreviewDialog
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
        attachmentUrl={previewUrl}
        title={previewTitle}
      />
    </div>
  );
};

export default VendorDetail;
