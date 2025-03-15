
import React, { useState } from 'react';
import PurchaseOrderCard from '@/components/PurchaseOrderCard';
import CreatePOButton from '@/components/CreatePOButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

// Mock data for demonstration
const mockPurchaseOrders = [
  {
    id: '1',
    poNumber: '2023-001',
    vendor: 'Apple Inc.',
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
    amount: 2800,
    currency: 'USD',
    date: '2023-06-20',
    status: 'pending' as const
  },
  {
    id: '4',
    poNumber: '2023-004',
    vendor: 'Logitech',
    amount: 1200,
    currency: 'USD',
    date: '2023-06-25',
    status: 'draft' as const
  },
  {
    id: '5',
    poNumber: '2023-005',
    vendor: 'Amazon Business',
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
    amount: 4200,
    currency: 'USD',
    date: '2023-07-02',
    status: 'rejected' as const
  }
];

const PurchaseOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="matched">Invoice Matched</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPOs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPOs.map((po) => (
            <PurchaseOrderCard key={po.id} {...po} />
          ))}
        </div>
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
