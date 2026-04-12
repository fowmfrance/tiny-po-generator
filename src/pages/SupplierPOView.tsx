import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  Package,
  FileCheck
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockVendors } from '@/types/vendor';
import { mockPurchaseOrders } from './PurchaseOrders';
import { Progress } from '@/components/ui/progress';
import SupplierKYCTab from '@/components/supplier/SupplierKYCTab';

const SupplierPOView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Get vendor details
  const vendor = mockVendors.find(v => v.id === id);
  
  // Get POs for this vendor
  const vendorPOs = mockPurchaseOrders.filter(po => po.vendorId === id);
  
  if (!vendor) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Fournisseur non trouvé</h2>
          <p className="text-gray-500 mb-6">Impossible de trouver les détails du fournisseur.</p>
          <Button onClick={() => navigate('/supplier')} className="bg-po-blue hover:bg-blue-600">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with vendor info */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/supplier')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
            <div className="text-sm text-gray-500">
              Portail Fournisseur • {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{vendor.name}</h1>
              <p className="text-gray-500">{vendor.category}</p>
              <p className="text-gray-500">{vendor.city}, {vendor.country}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">N° de fournisseur</div>
              <div className="text-xl font-semibold">VEND-{vendor.id.padStart(5, '0')}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-700 flex items-center text-base font-medium">
                <FileText className="h-4 w-4 mr-2 text-po-blue" />
                Bons de commande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{vendorPOs.length}</div>
              <p className="text-sm text-gray-500">Total reçus</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-700 flex items-center text-base font-medium">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                En attente de livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {vendorPOs.filter(po => po.status === 'approved').length}
              </div>
              <p className="text-sm text-gray-500">À traiter</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-700 flex items-center text-base font-medium">
                <DollarSign className="h-4 w-4 mr-2 text-amber-500" />
                Valeur totale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {vendorPOs.reduce((total, po) => total + po.amount, 0).toLocaleString()} €
              </div>
              <p className="text-sm text-gray-500">Tous les bons de commande</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Purchase Orders Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Bons de commande reçus</CardTitle>
            <CardDescription>
              Liste de tous les bons de commande que vous avez reçus
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vendorPOs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Bon de commande</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Traitement</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">
                        {po.poNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {po.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{po.amount.toLocaleString()} {po.currency}</div>
                      </TableCell>
                      <TableCell>
                        {po.status === 'draft' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Brouillon
                          </span>
                        )}
                        {po.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            En attente
                          </span>
                        )}
                        {po.status === 'approved' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approuvé
                          </span>
                        )}
                        {po.status === 'rejected' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejeté
                          </span>
                        )}
                        {po.status === 'matched' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Facture associée
                          </span>
                        )}
                        {po.status === 'paid' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Payé
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {po.paymentProgress !== undefined ? (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progression</span>
                              <span>{po.paymentProgress}%</span>
                            </div>
                            <Progress value={po.paymentProgress} className="h-2" />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-8">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          <Button variant="outline" size="sm" className="h-8">
                            <Package className="h-4 w-4 mr-1" />
                            Livrer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun bon de commande</h3>
                <p className="text-gray-500">
                  Vous n'avez reçu aucun bon de commande pour le moment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-16 justify-start px-4">
                <Package className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Confirmer une livraison</div>
                  <div className="text-xs text-gray-500">Mettre à jour l'état d'une commande</div>
                </div>
              </Button>
              
              <Button variant="outline" className="h-16 justify-start px-4">
                <FileText className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Créer une facture</div>
                  <div className="text-xs text-gray-500">Soumettre une facture pour paiement</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierPOView;
