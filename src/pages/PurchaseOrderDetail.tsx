import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, FileText, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { mockVendors, Vendor } from '@/types/vendor';
import { useNotifications, notifyPOStatusChange } from '@/services/notificationService';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  vendorId: string;
  amount: number;
  currency: string;
  date: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'matched' | 'paid';
  paymentProgress?: number;
}

const mockPurchaseOrders = [
  {
    id: '1',
    poNumber: '2023-001',
    vendor: 'Apple Inc.',
    vendorId: 'vendor-1',
    amount: 5000,
    currency: 'EUR',
    date: '2023-06-15',
    status: 'matched' as const,
    paymentProgress: 60,
    items: [
      { id: 'item-1', description: 'MacBook Pro 14"', quantity: 2, unitPrice: 1999.99, total: 3999.98 },
      { id: 'item-2', description: 'Magic Mouse', quantity: 5, unitPrice: 99.99, total: 499.95 },
      { id: 'item-3', description: 'USB-C Adapter', quantity: 10, unitPrice: 49.99, total: 499.90 }
    ],
    timeline: [
      { date: '2023-06-10', action: 'Created', user: 'John Doe' },
      { date: '2023-06-12', action: 'Approved', user: 'Jane Smith' },
      { date: '2023-06-15', action: 'Invoice Matched', user: 'System' }
    ]
  },
  {
    id: '2',
    poNumber: '2023-002',
    vendor: 'Microsoft Corp',
    vendorId: 'vendor-2',
    amount: 3500,
    currency: 'EUR',
    date: '2023-06-18',
    status: 'approved' as const,
    paymentProgress: 0,
    items: [
      { id: 'item-1', description: 'Surface Laptop', quantity: 1, unitPrice: 1299.99, total: 1299.99 },
      { id: 'item-2', description: 'Office 365 License (Annual)', quantity: 10, unitPrice: 220, total: 2200 }
    ],
    timeline: [
      { date: '2023-06-16', action: 'Created', user: 'John Doe' },
      { date: '2023-06-18', action: 'Approved', user: 'Jane Smith' }
    ]
  },
  {
    id: '101',
    poNumber: '2023-101',
    vendor: 'Dell Technologies',
    vendorId: 'vendor-3',
    amount: 7899,
    currency: 'EUR',
    date: '2023-07-05',
    status: 'approved' as const,
    paymentProgress: 0,
    items: [
      { id: 'item-1', description: 'Dell XPS 15', quantity: 3, unitPrice: 1999, total: 5997 },
      { id: 'item-2', description: 'Dell UltraSharp 27" Monitor', quantity: 6, unitPrice: 299.99, total: 1799.94 }
    ],
    timeline: [
      { date: '2023-07-01', action: 'Created', user: 'John Doe' },
      { date: '2023-07-03', action: 'Reviewed', user: 'Mike Johnson' },
      { date: '2023-07-05', action: 'Approved', user: 'Jane Smith' }
    ]
  }
];

const PurchaseOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();
  const { notifyPOSent } = useNotifications();

  useEffect(() => {
    const fetchPurchaseOrder = () => {
      setLoading(true);
      const po = mockPurchaseOrders.find(po => po.id === id);
      
      if (po) {
        setPurchaseOrder(po);
        const vendorData = mockVendors.find(v => v.id === po.vendorId);
        if (vendorData) {
          setVendor(vendorData);
        }
      }
      setLoading(false);
    };

    fetchPurchaseOrder();
  }, [id]);

  const handleSendPO = async () => {
    if (!purchaseOrder || !vendor) return;
    
    const success = await notifyPOSent(purchaseOrder, vendor);
    
    if (success) {
      toast({
        title: "Bon de commande envoyé",
        description: `Le bon de commande ${purchaseOrder.poNumber} a été envoyé à ${vendor.name}`,
      });
    }
  };

  const handleStatusChange = async (newStatus: PurchaseOrder['status']) => {
    if (!purchaseOrder || !vendor) return;
    
    setPurchaseOrder({
      ...purchaseOrder,
      status: newStatus
    });
    
    await notifyPOStatusChange(purchaseOrder, vendor, newStatus);
    
    toast({
      title: "Statut mis à jour",
      description: `Le statut du bon de commande ${purchaseOrder.poNumber} a été mis à jour`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'matched':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'Brouillon',
      pending: 'En attente d\'approbation',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      matched: 'Facture rapprochée',
      paid: 'Payé'
    };
    
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">Chargement...</div>;
  }

  if (!purchaseOrder) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Bon de commande introuvable</h2>
        <p className="mb-4">Le bon de commande que vous recherchez n'existe pas.</p>
        <Button onClick={() => navigate('/purchase-orders')}>
          Retour aux bons de commande
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/purchase-orders')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Bon de commande #{purchaseOrder.poNumber}</h1>
          <p className="text-muted-foreground">Créé le {purchaseOrder.date}</p>
        </div>
        
        {vendor && purchaseOrder.status !== 'draft' && (
          <Button 
            variant="outline" 
            className="ml-auto flex items-center gap-2"
            onClick={handleSendPO}
          >
            <Send className="h-4 w-4" />
            Envoyer au fournisseur
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(purchaseOrder.status)}
              <span className={`text-lg font-medium`}>
                {getStatusText(purchaseOrder.status)}
              </span>
            </div>
            
            {(purchaseOrder.status === 'approved' || purchaseOrder.status === 'matched' || purchaseOrder.status === 'paid') && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Avancement paiement</span>
                  <span>{purchaseOrder.paymentProgress ?? 0}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${purchaseOrder.paymentProgress ?? 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            {purchaseOrder.status === 'draft' && (
              <Button size="sm" onClick={() => handleStatusChange('pending')}>
                Soumettre pour approbation
              </Button>
            )}
            {purchaseOrder.status === 'pending' && (
              <>
                <Button size="sm" variant="outline" className="bg-red-50 text-red-600 border-red-200" 
                  onClick={() => handleStatusChange('rejected')}>
                  Rejeter
                </Button>
                <Button size="sm" className="bg-green-600" 
                  onClick={() => handleStatusChange('approved')}>
                  Approuver
                </Button>
              </>
            )}
            {purchaseOrder.status === 'approved' && (
              <Button size="sm" className="bg-blue-600" 
                onClick={() => handleStatusChange('matched')}>
                Marquer comme rapproché
              </Button>
            )}
            {purchaseOrder.status === 'matched' && (
              <Button size="sm" className="bg-purple-600" 
                onClick={() => handleStatusChange('paid')}>
                Marquer comme payé
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fournisseur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-lg">{purchaseOrder.vendor}</p>
                <p className="text-sm text-muted-foreground">ID Fournisseur : {purchaseOrder.vendorId}</p>
              </div>
              <Link to={`/vendors/${purchaseOrder.vendorId}`} className="text-po-blue flex items-center gap-1 text-sm">
                Voir le profil
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Montant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{purchaseOrder.currency} {purchaseOrder.amount.toLocaleString('fr-FR')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Quantité</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Prix unitaire</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(purchaseOrder as any).items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {purchaseOrder.currency} {item.unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      {purchaseOrder.currency} {item.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">
                    Total :
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {purchaseOrder.currency} {purchaseOrder.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(purchaseOrder as any).timeline?.map((event: any, index: number) => (
              <div key={index} className="flex gap-3">
                <div className="min-w-8 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{event.action}</p>
                  <p className="text-sm text-muted-foreground">Par {event.user} le {event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderDetail;
