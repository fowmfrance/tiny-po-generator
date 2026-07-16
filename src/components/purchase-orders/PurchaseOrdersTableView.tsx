
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PurchaseOrder, PurchaseOrderStatus } from '@/pages/PurchaseOrders';
import { StatusBadge } from '@/components/purchase-orders/StatusBadge';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/services/notifications';
import { mockVendors } from '@/types/vendor';

interface PurchaseOrdersTableViewProps {
  purchaseOrders: PurchaseOrder[];
}

export const PurchaseOrdersTableView: React.FC<PurchaseOrdersTableViewProps> = ({ 
  purchaseOrders 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { notifyPOSent } = useNotifications();

  const handleSendPO = async (poId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Find the PO
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    
    // Find the vendor - using id instead of vendorId to match the Vendor interface
    const vendor = mockVendors.find(v => v.id === po.vendorId);
    if (!vendor) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de trouver les informations du fournisseur.",
      });
      return;
    }
    
    // Send the notification
    const success = await notifyPOSent(po, vendor);
    
    if (success) {
      toast({
        title: "Bon de commande envoyé",
        description: `Le bon de commande ${po.poNumber} a été envoyé à ${vendor.name}`,
      });
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° BC</TableHead>
            <TableHead>Fournisseur</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="text-right">Facturé</TableHead>
            <TableHead className="text-right">Payé</TableHead>
            <TableHead className="text-center">Date</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders.map((po) => (
            <TableRow key={po.id}>
              <TableCell className="font-medium">
                <Link to={`/purchase-orders/${po.id}`} className="text-po-blue hover:underline">
                  {po.poNumber}
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/vendors/${po.vendorId}`} className="text-po-blue hover:underline">
                  {po.vendor}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {po.currency} {po.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                {(po.invoiceCount ?? 0) > 0 ? (
                  <span className={
                    (po.invoicedPct ?? 0) > 100 ? 'text-red-600' :
                    (po.invoicedPct ?? 0) >= 100 ? 'text-emerald-600' : 'text-amber-600'
                  }>
                    {(po.invoicedTtc ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({po.invoicedPct}%)
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {(po.paymentProgress ?? 0) > 0 ? `${po.paymentProgress}%` : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-center">{po.date}</TableCell>
              <TableCell className="text-center">
                <StatusBadge status={po.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={(e) => handleSendPO(po.id, e)}
                >
                  <Send className="h-3 w-3" />
                  Envoyer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
