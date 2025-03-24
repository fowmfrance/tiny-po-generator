import React, { useState } from 'react';
import { PurchaseOrdersFilters } from '@/components/purchase-orders/PurchaseOrdersFilters';
import { PurchaseOrdersCardView } from '@/components/purchase-orders/PurchaseOrdersCardView';
import { PurchaseOrdersTableView } from '@/components/purchase-orders/PurchaseOrdersTableView';
import CreatePOButton from '@/components/CreatePOButton';

// Mock data for demonstration
export const mockPurchaseOrders = [
  {
    id: '1',
    poNumber: '2023-001',
    vendor: 'Apple Inc.',
    vendorId: 'vendor-1',
    amount: 5000,
    currency: 'USD',
    date: '2023-06-15',
    status: 'matched' as const,
    paymentProgress: 60
  },
  {
    id: '2',
    poNumber: '2023-002',
    vendor: 'Microsoft Corp',
    vendorId: 'vendor-2',
    amount: 3500,
    currency: 'USD',
    date: '2023-06-18',
    status: 'approved' as const,
    paymentProgress: 0
  },
  {
    id: '3',
    poNumber: '2023-003',
    vendor: 'Dell Technologies',
    vendorId: 'vendor-3',
    amount: 2800,
    currency: 'USD',
    date: '2023-06-20',
    status: 'pending' as const
  },
  {
    id: '4',
    poNumber: '2023-004',
    vendor: 'Logitech',
    vendorId: 'vendor-4',
    amount: 1200,
    currency: 'USD',
    date: '2023-06-25',
    status: 'draft' as const
  },
  {
    id: '5',
    poNumber: '2023-005',
    vendor: 'Amazon Business',
    vendorId: 'vendor-5',
    amount: 8500,
    currency: 'USD',
    date: '2023-06-28',
    status: 'paid' as const,
    paymentProgress: 100
  },
  {
    id: '6',
    poNumber: '2023-006',
    vendor: 'Samsung Electronics',
    vendorId: 'vendor-6',
    amount: 4200,
    currency: 'USD',
    date: '2023-07-02',
    status: 'rejected' as const
  }
];

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'matched' | 'paid';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  vendorId: string;
  amount: number;
  currency: string;
  date: string;
  status: PurchaseOrderStatus;
  paymentProgress?: number;
}

const PurchaseOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Filter purchase orders based on search term and status filter
  const filteredPOs = mockPurchaseOrders.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
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
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">No purchase orders found.</p>
          <CreatePOButton />
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
