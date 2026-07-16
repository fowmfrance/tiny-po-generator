import React, { useState } from 'react';
import { PurchaseOrdersFilters } from '@/components/purchase-orders/PurchaseOrdersFilters';
import { PurchaseOrdersCardView } from '@/components/purchase-orders/PurchaseOrdersCardView';
import { PurchaseOrdersTableView } from '@/components/purchase-orders/PurchaseOrdersTableView';
import CreatePOButton from '@/components/CreatePOButton';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { usePOInvoicingSummaries } from '@/hooks/usePOInvoicing';

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'sent' | 'matched' | 'paid';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  vendorId: string;
  amount: number;
  currency: string;
  date: string;
  status: PurchaseOrderStatus;
  /** % réellement payé (paiements réglés / TTC de référence). */
  paymentProgress?: number;
  /** Cumul TTC des factures reçues face au BdC. */
  invoicedTtc?: number;
  /** % facturé (cumul HT factures / HT du BdC). */
  invoicedPct?: number;
  invoiceCount?: number;
}

const PurchaseOrders = () => {
  const { purchaseOrders, isLoading } = usePurchaseOrders();
  const { summaries } = usePOInvoicingSummaries();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Map DB purchase orders to the display format
  const displayPOs: PurchaseOrder[] = purchaseOrders.map(po => {
    const totals = summaries.get(po.id);
    const poHt = Number((po as any).amount_ht ?? po.total_amount);
    // TTC de référence pour le % payé : TTC du BdC, sinon cumul TTC facturé, sinon HT
    const ttcBase = Number((po as any).amount_ttc ?? 0) || totals?.invoicedTtc || poHt;
    return {
      id: po.id,
      poNumber: po.po_number,
      vendor: po.supplier?.name || 'Fournisseur inconnu',
      vendorId: po.supplier_id,
      amount: Number(po.total_amount),
      currency: po.currency,
      date: new Date(po.created_at).toLocaleDateString('fr-FR'),
      status: po.status as PurchaseOrderStatus,
      paymentProgress: totals && ttcBase > 0 ? Math.round((totals.paidTtc / ttcBase) * 100) : 0,
      invoicedTtc: totals?.invoicedTtc ?? 0,
      invoicedPct: totals && poHt > 0 ? Math.round((totals.invoicedHt / poHt) * 100) : 0,
      invoiceCount: totals?.invoiceCount ?? 0,
    };
  });

  const filteredPOs = displayPOs.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bons de Commande</h1>
          <CreatePOButton />
        </div>
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Chargement des bons de commande...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bons de Commande</h1>
        <CreatePOButton />
      </div>

      <PurchaseOrdersFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {filteredPOs.length > 0 ? (
        viewMode === 'card' ? (
          <PurchaseOrdersCardView purchaseOrders={filteredPOs} />
        ) : (
          <PurchaseOrdersTableView purchaseOrders={filteredPOs} />
        )
      ) : (
        <div className="bg-card p-8 rounded-lg border text-center">
          <p className="text-muted-foreground mb-4">Aucun bon de commande trouvé.</p>
          <CreatePOButton />
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;

// Keep backward compat export for components that import mockPurchaseOrders
export const mockPurchaseOrders: PurchaseOrder[] = [];
