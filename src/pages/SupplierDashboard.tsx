
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Building, FileText, LogOut } from 'lucide-react';
import SupplierPurchaseOrders from '@/components/supplier/SupplierPurchaseOrders';
import SupplierInvoices from '@/components/supplier/SupplierInvoices';

interface Vendor {
  vendorId: string;
  name: string;
  email: string;
}

const SupplierDashboard = () => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get vendor data from session storage on component mount
    const vendorData = sessionStorage.getItem('currentVendor');
    if (!vendorData) {
      // If no vendor data, redirect to login
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please log in to access the supplier dashboard",
      });
      navigate('/supplier');
      return;
    }
    
    try {
      const parsedData = JSON.parse(vendorData);
      setVendor(parsedData);
    } catch (error) {
      console.error('Error parsing vendor data:', error);
      navigate('/supplier');
    }
  }, [navigate, toast]);

  const handleLogout = () => {
    // Clear vendor data from session storage
    sessionStorage.removeItem('currentVendor');
    
    // Show toast
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    
    // Redirect to login page
    navigate('/supplier');
  };

  if (!vendor) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building className="h-8 w-8 text-po-blue" />
            <div>
              <h1 className="text-xl font-semibold">Supplier Portal</h1>
              <p className="text-sm text-gray-500">{vendor.name}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome, {vendor.name}</CardTitle>
            <CardDescription>
              Manage your purchase orders and invoices through this portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <FileText className="h-6 w-6 text-po-blue" />
                </div>
                <div>
                  <h3 className="font-medium">Purchase Orders</h3>
                  <p className="text-sm text-gray-500">View all your purchase orders</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Invoices</h3>
                  <p className="text-sm text-gray-500">Manage your invoices and payments</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="purchase-orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          <TabsContent value="purchase-orders" className="space-y-4">
            <SupplierPurchaseOrders vendorId={vendor.vendorId} />
          </TabsContent>
          <TabsContent value="invoices" className="space-y-4">
            <SupplierInvoices vendorId={vendor.vendorId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SupplierDashboard;
