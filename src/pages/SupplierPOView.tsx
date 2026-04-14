import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import SupplierKYCTab from '@/components/supplier/SupplierKYCTab';
import { formatCurrency } from '@/utils/paymentUtils';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Loader2,
  MapPin,
  Package,
  XCircle,
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

type SupplierPortalData = {
  supplier: PortalSupplier;
  purchaseOrders: PortalPurchaseOrder[];
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  draft: {
    label: 'Brouillon',
    icon: Clock,
    className: 'bg-muted text-muted-foreground border-transparent',
  },
  pending: {
    label: 'En attente',
    icon: Clock,
    className: 'bg-secondary text-secondary-foreground border-transparent',
  },
  approved: {
    label: 'Approuvé',
    icon: CheckCircle2,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  rejected: {
    label: 'Rejeté',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  matched: {
    label: 'Facture associée',
    icon: CheckCircle2,
    className: 'bg-accent text-accent-foreground border-transparent',
  },
  paid: {
    label: 'Payé',
    icon: CheckCircle2,
    className: 'bg-primary text-primary-foreground border-transparent',
  },
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
};

const SupplierPOView = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['supplier-portal-data', token],
    enabled: !!token,
    queryFn: async (): Promise<SupplierPortalData> => {
      const { data, error } = await supabase.functions.invoke('supplier-portal-data', {
        body: { token },
      });

      if (error) {
        throw new Error(error.message || 'Impossible de charger le portail fournisseur.');
      }

      if (!data?.supplier) {
        throw new Error('Fournisseur introuvable.');
      }

      return data as SupplierPortalData;
    },
  });

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
            <Button variant="outline" onClick={() => navigate('/supplier')}>
              Retour à l’accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { supplier, purchaseOrders } = data;
  const hasKyc = Boolean(supplier.kyc_level_id);
  const pendingOrders = purchaseOrders.filter((po) => ['pending', 'approved'].includes(po.status)).length;
  const totalAmount = purchaseOrders.reduce((sum, po) => sum + Number(po.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-muted/30">
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
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date().toLocaleDateString('fr-FR')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        <Tabs defaultValue={hasKyc && supplier.kyc_status === 'pending' ? 'kyc' : 'orders'}>
          <TabsList className="mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bons de commande
            </TabsTrigger>
            {hasKyc && (
              <TabsTrigger value="kyc" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Documents KYC
                {supplier.kyc_status === 'pending' && <span className="ml-1 h-2 w-2 rounded-full bg-primary" />}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">Bons de commande</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{purchaseOrders.length}</div>
                  <p className="text-sm text-muted-foreground">Total reçus</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">À traiter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{pendingOrders}</div>
                  <p className="text-sm text-muted-foreground">Commandes en cours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">Valeur totale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{formatCurrency(totalAmount, purchaseOrders[0]?.currency || 'EUR')}</div>
                  <p className="text-sm text-muted-foreground">Montant cumulé</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bons de commande reçus</CardTitle>
                <CardDescription>
                  Retrouvez ici les bons de commande qui vous sont adressés.
                </CardDescription>
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
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders.map((po) => {
                        const config = statusConfig[po.status] || statusConfig.pending;
                        const StatusIcon = config.icon;

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
                            <TableCell>{formatCurrency(Number(po.total_amount || 0), po.currency || 'EUR')}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={config.className}>
                                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                                {config.label}
                              </Badge>
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
                    <p className="text-muted-foreground">
                      Aucun bon de commande n’est disponible pour le moment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {hasKyc && (
            <TabsContent value="kyc">
              <SupplierKYCTab
                supplierId={supplier.id}
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
    </div>
  );
};

export default SupplierPOView;
