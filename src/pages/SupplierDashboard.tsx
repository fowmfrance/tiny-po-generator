import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronLeft, FileText, Mail, Plus, ArrowDown, ArrowUp } from 'lucide-react';
import { mockVendors } from '@/types/vendor';
import { mockPurchaseOrders } from '@/pages/PurchaseOrders';
import { StatusBadge } from '@/components/purchase-orders/StatusBadge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mockInvoices = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2023-001',
    poId: '1',
    poNumber: '2023-001',
    amount: 3000,
    currency: 'USD',
    date: '2023-07-01',
    status: 'paid',
    paymentDate: '2023-07-15'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2023-002',
    poId: '2',
    poNumber: '2023-002',
    amount: 1500,
    currency: 'USD',
    date: '2023-07-10',
    status: 'pending',
    paymentDate: null
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2023-003',
    poId: '5',
    poNumber: '2023-005',
    amount: 8500,
    currency: 'USD',
    date: '2023-07-20',
    status: 'paid',
    paymentDate: '2023-08-05'
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-2023-004',
    poId: '3',
    poNumber: '2023-003',
    amount: 12000,
    currency: 'USD',
    date: '2023-08-15',
    status: 'paid',
    paymentDate: '2023-09-01'
  },
  {
    id: 'inv-5',
    invoiceNumber: 'INV-2023-005',
    poId: '4',
    poNumber: '2023-004',
    amount: 5750,
    currency: 'USD',
    date: '2023-09-05',
    status: 'pending',
    paymentDate: null
  },
  {
    id: 'inv-6',
    invoiceNumber: 'INV-2023-006',
    poId: '6',
    poNumber: '2023-006',
    amount: 2250,
    currency: 'USD',
    date: '2023-10-10',
    status: 'paid',
    paymentDate: '2023-10-25'
  }
];

const additionalMockPOs = [
  {
    id: '7',
    poNumber: '2023-007',
    vendorId: '1',
    date: '2023-11-01',
    amount: 6000,
    currency: 'USD',
    status: 'approved',
    items: [
      { id: '701', name: 'Marketing Materials', quantity: 5000, unitPrice: 1.2 }
    ]
  },
  {
    id: '8',
    poNumber: '2023-008',
    vendorId: '1',
    date: '2023-11-15',
    amount: 8800,
    currency: 'USD',
    status: 'pending',
    items: [
      { id: '801', name: 'Display Units', quantity: 40, unitPrice: 220 }
    ]
  },
  {
    id: '9',
    poNumber: '2023-009',
    vendorId: '1',
    date: '2023-12-01',
    amount: 4500,
    currency: 'USD',
    status: 'approved',
    items: [
      { id: '901', name: 'Product Samples', quantity: 300, unitPrice: 15 }
    ]
  },
  {
    id: '10',
    poNumber: '2023-010',
    vendorId: '1',
    date: '2023-12-15',
    amount: 15000,
    currency: 'USD',
    status: 'approved',
    items: [
      { id: '1001', name: 'Event Equipment', quantity: 1, unitPrice: 15000 }
    ]
  }
];

const extendedMockPurchaseOrders = [...mockPurchaseOrders, ...additionalMockPOs];

const SupplierDashboard = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const queryParams = new URLSearchParams(location.search);
  const vendorId = queryParams.get('vendor') || '1';
  
  const vendor = mockVendors.find(v => v.id === vendorId);
  
  if (!vendor) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Vendor not found. Please log in again.</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/supplier')}>Back to Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vendorPOs = extendedMockPurchaseOrders.filter(po => po.vendorId === vendorId);
  
  const poAndInvoices = vendorPOs.map(po => {
    const relatedInvoices = mockInvoices.filter(inv => inv.poId === po.id);
    return {
      ...po,
      hasInvoice: relatedInvoices.length > 0,
      invoices: relatedInvoices
    };
  });

  const sortedData = [...poAndInvoices].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'amount') {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else if (sortBy === 'status') {
      return sortOrder === 'asc' 
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSendEmail = (subject: string, message: string) => {
    toast({
      title: "Email Sent",
      description: "Your message has been sent to the procurement team.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/supplier')}
            size="sm"
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Log Out
          </Button>
          <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
          <p className="text-gray-500">Welcome, {vendor.name}</p>
        </div>
        
        <div className="flex gap-3">
          <ContactDialog onSendEmail={handleSendEmail} />
          <Button 
            className="bg-po-blue hover:bg-blue-600 flex items-center gap-2"
            onClick={() => navigate('/supplier/invoices/create')}
          >
            <Plus className="h-4 w-4" />
            Upload Invoice
          </Button>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
        <FileText className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-blue-800">API Access Coming Soon</h3>
          <p className="text-sm text-blue-700 mt-1">
            We're working on an API to allow your systems to submit invoices automatically. 
            This will enable you to create automation within your invoice tools. 
            <span className="font-medium"> Contact us for early access.</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders & Invoices</CardTitle>
          <CardDescription>
            View your purchase orders and related invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="invoiced">Invoiced</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <CombinedTable 
                data={sortedData} 
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={toggleSort}
                navigate={navigate}
              />
            </TabsContent>
            
            <TabsContent value="pending">
              <CombinedTable 
                data={sortedData.filter(po => po.status === 'pending')} 
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={toggleSort}
                navigate={navigate}
              />
            </TabsContent>
            
            <TabsContent value="approved">
              <CombinedTable 
                data={sortedData.filter(po => po.status === 'approved')} 
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={toggleSort}
                navigate={navigate}
              />
            </TabsContent>
            
            <TabsContent value="invoiced">
              <CombinedTable 
                data={sortedData.filter(po => po.hasInvoice)} 
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={toggleSort}
                navigate={navigate}
              />
            </TabsContent>
            
            <TabsContent value="paid">
              <CombinedTable 
                data={sortedData.filter(po => po.invoices?.some(inv => inv.status === 'paid'))} 
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={toggleSort}
                navigate={navigate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface CombinedTableProps {
  data: any[];
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
  navigate: (path: string) => void;
}

const CombinedTable: React.FC<CombinedTableProps> = ({ 
  data, 
  sortBy, 
  sortOrder,
  onSort,
  navigate 
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-500">No records found in this category.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">
            <button 
              className="flex items-center font-medium text-left"
              onClick={() => onSort('date')}
            >
              Date
              {sortBy === 'date' && (
                <span className="ml-1">{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</span>
              )}
            </button>
          </TableHead>
          <TableHead>PO Number</TableHead>
          <TableHead>
            <button 
              className="flex items-center font-medium text-left"
              onClick={() => onSort('amount')}
            >
              Amount
              {sortBy === 'amount' && (
                <span className="ml-1">{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</span>
              )}
            </button>
          </TableHead>
          <TableHead>
            <button 
              className="flex items-center font-medium text-left"
              onClick={() => onSort('status')}
            >
              Status
              {sortBy === 'status' && (
                <span className="ml-1">{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</span>
              )}
            </button>
          </TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Payment Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(po => (
          <TableRow key={po.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {po.date}
              </div>
            </TableCell>
            <TableCell>{po.poNumber}</TableCell>
            <TableCell>
              {po.currency} {po.amount.toLocaleString()}
            </TableCell>
            <TableCell>
              <StatusBadge status={po.status} />
            </TableCell>
            <TableCell>
              {po.hasInvoice ? (
                <div className="space-y-1">
                  {po.invoices.map((inv: any) => (
                    <div key={inv.id} className="text-sm">
                      {inv.invoiceNumber}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 text-sm">None</span>
              )}
            </TableCell>
            <TableCell>
              {po.hasInvoice ? (
                <div className="space-y-1">
                  {po.invoices.map((inv: any) => (
                    <div key={inv.id}>
                      {inv.status === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 text-sm">—</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => window.open(`/purchase-orders/${po.id}`, '_blank')}
                >
                  <FileText className="h-4 w-4" />
                  View PO
                </Button>
                
                {po.status === 'approved' && !po.hasInvoice && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-po-blue hover:bg-blue-600 flex items-center gap-1"
                    onClick={() => navigate(`/supplier/invoices/create?po=${po.id}`)}
                  >
                    <Plus className="h-4 w-4" />
                    Invoice
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

interface ContactDialogProps {
  onSendEmail: (subject: string, message: string) => void;
}

const ContactDialog: React.FC<ContactDialogProps> = ({ onSendEmail }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !message) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both subject and message.",
      });
      return;
    }
    
    onSendEmail(subject, message);
    
    setSubject('');
    setMessage('');
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Contact Us
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Contact Procurement Team</DialogTitle>
            <DialogDescription>
              Send a message to invoice@loreal.com regarding your purchase orders or invoices.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., Question about PO #2023-001"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-po-blue hover:bg-blue-600">
              Send Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDashboard;
