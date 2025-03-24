
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, ListFilter, Grid, List } from 'lucide-react';

// Mock data for demonstration
const mockPurchaseOrders = [
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

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'bg-gray-200 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      matched: 'bg-blue-100 text-blue-800',
      paid: 'bg-purple-100 text-purple-800'
    };

    const statusMap = {
      draft: 'Draft',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      matched: 'Matched',
      paid: 'Paid'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusMap[status as keyof typeof statusMap]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <CreatePOButton />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <div className="flex bg-muted rounded-md">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${viewMode === 'card' ? 'bg-background' : ''} rounded-md`}
              onClick={() => setViewMode('card')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${viewMode === 'table' ? 'bg-background' : ''} rounded-md`}
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredPOs.length > 0 ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPOs.map((po) => (
              <PurchaseOrderCard key={po.id} {...po} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map((po) => (
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
                      {po.currency} {po.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">{po.date}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(po.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
