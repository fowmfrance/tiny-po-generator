
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, FileText, Plus } from 'lucide-react';
import { mockVendors } from '@/types/vendor';
import { extendedMockPurchaseOrders, mockInvoices, PurchaseOrderWithInvoices } from '@/types/supplier';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CombinedTable from '@/components/supplier/CombinedTable';
import ContactDialog from '@/components/supplier/ContactDialog';
import { useToast } from '@/hooks/use-toast';

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

export default SupplierDashboard;
