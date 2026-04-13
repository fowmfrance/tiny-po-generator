
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, ArrowLeft, FileUp, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockPurchaseOrders, PurchaseOrder } from '@/pages/PurchaseOrders';

const SupplierInvoiceCreate = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if user is authenticated
    const vendorData = sessionStorage.getItem('currentVendor');
    if (!vendorData) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to access this page",
      });
      navigate('/supplier');
      return;
    }
    
    // Get PO ID from URL query params
    const params = new URLSearchParams(location.search);
    const poId = params.get('po');
    
    if (!poId) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "No purchase order specified",
      });
      navigate('/supplier/dashboard');
      return;
    }
    
    // Find the purchase order
    const po = mockPurchaseOrders.find(p => p.id === poId);
    
    if (!po) {
      toast({
        variant: "destructive",
        title: "Invalid purchase order",
        description: "The specified purchase order could not be found",
      });
      navigate('/supplier/dashboard');
      return;
    }
    
    // Set the purchase order
    setPurchaseOrder(po);
    
    // Pre-fill the amount with PO amount
    setAmount(po.amount.toString());
    
  }, [location.search, navigate, toast]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!purchaseOrder || !invoiceNumber || !amount || !file) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields and upload an invoice file.",
      });
      return;
    }
    
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      toast({
        title: "Invoice submitted",
        description: `Invoice ${invoiceNumber} has been submitted successfully.`,
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/supplier/dashboard');
      }, 2000);
    }, 1500);
  };
  
  if (!purchaseOrder) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto p-4 flex items-center">
          <Button 
            variant="ghost" 
            className="mr-4"
            onClick={() => navigate('/supplier/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-4">
            <Building className="h-6 w-6 text-po-blue" />
            <div>
              <h1 className="text-xl font-semibold">Upload Invoice</h1>
              <p className="text-sm text-gray-500">For Purchase Order #{purchaseOrder.poNumber}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Upload Invoice</CardTitle>
            <CardDescription>
              Please fill in the invoice details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Invoice Uploaded Successfully</h3>
                <p className="text-gray-500 mb-4">
                  Your invoice has been submitted and is pending approval.
                </p>
                <Button 
                  className="bg-po-blue hover:bg-blue-600"
                  onClick={() => navigate('/supplier/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="po-reference">Purchase Order</Label>
                    <Input 
                      id="po-reference"
                      value={purchaseOrder.poNumber}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="po-amount">PO Amount</Label>
                    <Input 
                      id="po-amount"
                      value={`${purchaseOrder.currency} ${purchaseOrder.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoice-number">Invoice Number *</Label>
                    <Input 
                      id="invoice-number"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g., INV-2023-001"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Invoice Amount *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">{purchaseOrder.currency}</span>
                      </div>
                      <Input 
                        id="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invoice-file">Upload Invoice Document *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center">
                    <FileUp className="h-12 w-12 text-gray-400 mb-3" />
                    {file ? (
                      <p className="text-sm font-medium">{file.name}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Supports PDF, JPG, PNG (max 10MB)
                    </p>
                    <input
                      id="invoice-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => e.target.files && setFile(e.target.files[0])}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => document.getElementById('invoice-file')?.click()}
                    >
                      Select File
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
          {!success && (
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate('/supplier/dashboard')}
              >
                Cancel
              </Button>
              <Button 
                className="bg-po-blue hover:bg-blue-600"
                onClick={handleSubmit}
                disabled={loading || !invoiceNumber || !amount || !file}
              >
                {loading ? 'Uploading...' : 'Upload Invoice'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
};

export default SupplierInvoiceCreate;
