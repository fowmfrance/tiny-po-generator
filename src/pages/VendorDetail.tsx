import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building, 
  FileText, 
  Share2, 
  Archive,
  AlertTriangle,
  CheckCircle,
  Clock as ClockIcon
} from 'lucide-react';
import { mockVendors, Vendor } from '@/types/vendor';
import { StatusBadge } from '@/components/purchase-orders/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// Define interfaces for our data structures
interface Invoice {
  id: string;
  invoiceNumber: string;
  poId: string;
  poNumber: string;
  amount: number;
  currency: string;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate: string | null;
}

interface POStatus {
  status: 'paid' | 'partially_paid' | 'unpaid' | 'overdue';
  paidPercentage: number;
  poNumber: string;
  totalAmount: number;
}

// Mock invoices for demonstration
const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2023-001',
    poId: '1',
    poNumber: '2023-001',
    amount: 3000,
    currency: 'USD',
    date: '2023-07-01',
    dueDate: '2023-08-01',
    status: 'paid',
    paymentDate: '2023-07-15'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2023-002',
    poId: '1',
    poNumber: '2023-001',
    amount: 2000,
    currency: 'USD',
    date: '2023-07-10',
    dueDate: '2023-08-10',
    status: 'overdue',
    paymentDate: null
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2023-003',
    poId: '2',
    poNumber: '2023-002',
    amount: 1500,
    currency: 'USD',
    date: '2023-07-15',
    dueDate: '2023-08-15',
    status: 'pending',
    paymentDate: null
  }
];

const calculatePOStatus = (invoices: Invoice[]): Record<string, POStatus> => {
  const poInvoices: Record<string, Invoice[]> = {};
  
  // Group invoices by PO
  invoices.forEach(inv => {
    if (!poInvoices[inv.poId]) {
      poInvoices[inv.poId] = [];
    }
    poInvoices[inv.poId].push(inv);
  });
  
  // Calculate status for each PO
  const poStatuses: Record<string, POStatus> = {};
  
  Object.keys(poInvoices).forEach(poId => {
    const poInvs = poInvoices[poId];
    const totalAmount = poInvs.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = poInvs
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const paidPercentage = Math.round((paidAmount / totalAmount) * 100);
    
    let status: 'paid' | 'partially_paid' | 'unpaid' | 'overdue';
    if (paidPercentage === 0) {
      status = 'unpaid';
    } else if (paidPercentage === 100) {
      status = 'paid';
    } else {
      status = 'partially_paid';
    }
    
    // Check if any invoice is overdue
    const hasOverdue = poInvs.some(inv => inv.status === 'overdue');
    
    poStatuses[poId] = {
      status: hasOverdue ? 'overdue' : status,
      paidPercentage,
      poNumber: poInvs[0].poNumber,
      totalAmount
    };
  });
  
  return poStatuses;
};

const VendorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Find the vendor with the matching ID
  const vendor = mockVendors.find(v => v.id === id);
  
  // Calculate PO statuses based on invoices
  const vendorInvoices = vendor 
    ? mockInvoices.filter(inv => vendor.poIds.includes(inv.poId))
    : [];
  
  const poStatuses = calculatePOStatus(vendorInvoices);
  
  // If vendor is not found, show a message
  if (!vendor) {
    return (
      <div className="p-6">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={() => navigate('/vendors')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vendors
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-lg text-gray-500">Vendor not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSharePortal = () => {
    toast({
      title: "Supplier Portal Link Shared",
      description: `A portal access email has been sent to ${vendor.email}`,
    });
  };

  const handleArchiveVendor = () => {
    toast({
      title: "Vendor Archived",
      description: `${vendor.name} has been archived.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate('/vendors')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Vendors
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleSharePortal}
          >
            <Share2 className="w-4 h-4" />
            Share Portal Access
          </Button>
          <Button 
            variant="destructive" 
            className="flex items-center gap-2"
            onClick={handleArchiveVendor}
          >
            <Archive className="w-4 h-4" />
            Archive Vendor
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{vendor.name}</CardTitle>
                <p className="text-gray-500">{vendor.category}</p>
              </div>
              <div>
                {vendor.status === 'active' && (
                  <span className="status-badge status-approved">Active</span>
                )}
                {vendor.status === 'pending' && (
                  <span className="status-badge status-pending">Pending</span>
                )}
                {vendor.status === 'inactive' && (
                  <span className="status-badge status-draft">Inactive</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <span>{vendor.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-gray-400" />
                <span>{vendor.phone}</span>
              </div>
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-3 text-gray-400" />
                <span>{vendor.totalPOs} Purchase Orders</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Invoices by Status</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-50 rounded-md p-2 text-center">
                    <span className="text-xl font-bold text-green-600">
                      {vendorInvoices.filter(inv => inv.status === 'paid').length}
                    </span>
                    <p className="text-xs text-green-700">Paid</p>
                  </div>
                  <div className="bg-yellow-50 rounded-md p-2 text-center">
                    <span className="text-xl font-bold text-yellow-600">
                      {vendorInvoices.filter(inv => inv.status === 'pending').length}
                    </span>
                    <p className="text-xs text-yellow-700">Pending</p>
                  </div>
                  <div className="bg-red-50 rounded-md p-2 text-center">
                    <span className="text-xl font-bold text-red-600">
                      {vendorInvoices.filter(inv => inv.status === 'overdue').length}
                    </span>
                    <p className="text-xs text-red-700">Overdue</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Total Outstanding</h4>
                <p className="text-2xl font-bold">
                  ${vendorInvoices
                    .filter(inv => inv.status !== 'paid')
                    .reduce((sum, inv) => sum + inv.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(poStatuses).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(poStatuses).map(([poId, poStatus]) => (
                  <div key={poId} className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-4 flex justify-between items-center">
                      <div>
                        <Link to={`/purchase-orders/${poId}`} className="font-medium text-po-blue hover:underline">
                          PO #{poStatus.poNumber}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">
                          Total: ${poStatus.totalAmount.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {poStatus.status === 'paid' && (
                            <span className="inline-flex items-center text-xs font-medium text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3 mr-1" /> Paid
                            </span>
                          )}
                          {poStatus.status === 'partially_paid' && (
                            <span className="inline-flex items-center text-xs font-medium text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                              Partially Paid
                            </span>
                          )}
                          {poStatus.status === 'unpaid' && (
                            <span className="inline-flex items-center text-xs font-medium text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-full">
                              <ClockIcon className="w-3 h-3 mr-1" /> Unpaid
                            </span>
                          )}
                          {poStatus.status === 'overdue' && (
                            <span className="inline-flex items-center text-xs font-medium text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs text-right mb-1">{poStatus.paidPercentage}% Paid</div>
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                poStatus.status === 'overdue' ? 'bg-red-500' : 
                                poStatus.status === 'paid' ? 'bg-green-500' : 
                                'bg-blue-500'
                              }`}
                              style={{ width: `${poStatus.paidPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-medium mb-2">Invoices</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-gray-500">
                            <th className="text-left py-2">Invoice #</th>
                            <th className="text-left py-2">Date</th>
                            <th className="text-left py-2">Due Date</th>
                            <th className="text-right py-2">Amount</th>
                            <th className="text-center py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockInvoices
                            .filter(inv => inv.poId === poId)
                            .map(invoice => (
                              <tr key={invoice.id} className="border-b last:border-0">
                                <td className="py-2">
                                  {invoice.invoiceNumber}
                                </td>
                                <td className="py-2">{invoice.date}</td>
                                <td className="py-2">{invoice.dueDate}</td>
                                <td className="py-2 text-right">
                                  ${invoice.amount.toLocaleString()}
                                </td>
                                <td className="py-2 text-center">
                                  {invoice.status === 'paid' && (
                                    <span className="inline-flex items-center text-xs font-medium text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                                      <CheckCircle className="w-3 h-3 mr-1" /> Paid
                                    </span>
                                  )}
                                  {invoice.status === 'pending' && (
                                    <span className="inline-flex items-center text-xs font-medium text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full">
                                      <ClockIcon className="w-3 h-3 mr-1" /> Pending
                                    </span>
                                  )}
                                  {invoice.status === 'overdue' && (
                                    <span className="inline-flex items-center text-xs font-medium text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                                      <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => 
                      toast({
                        title: "Payment Action",
                        description: "Selected invoices have been queued for payment processing."
                      })
                    }
                    className="bg-po-blue hover:bg-blue-600"
                  >
                    Process Payments for Selected Invoices
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">No purchase orders or invoices found for this vendor.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDetail;
