
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building, Lock, Mail } from 'lucide-react';

// Mock vendor credentials for demonstration
const mockVendorCredentials = [
  { email: 'vendor@apple.com', vendorId: 'vendor-1', name: 'Apple Inc.' },
  { email: 'vendor@microsoft.com', vendorId: 'vendor-2', name: 'Microsoft Corp' },
  { email: 'vendor@dell.com', vendorId: 'vendor-3', name: 'Dell Technologies' },
  { email: 'vendor@amazon.com', vendorId: 'vendor-4', name: 'Amazon Business' },
  { email: 'vendor@samsung.com', vendorId: 'vendor-5', name: 'Samsung Electronics' },
  { email: 'vendor@logitech.com', vendorId: 'vendor-6', name: 'Logitech' }
];

const SupplierPortal = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email exists in our mock vendor data
    const vendor = mockVendorCredentials.find(v => v.email.toLowerCase() === email.toLowerCase());
    
    if (vendor && password) {
      // Store vendor info in session storage for demonstration
      sessionStorage.setItem('currentVendor', JSON.stringify(vendor));
      
      // Show success toast
      toast({
        title: "Login successful",
        description: `Welcome back, ${vendor.name}!`,
      });
      
      // Navigate to supplier dashboard
      navigate('/supplier/dashboard');
    } else {
      // Show error toast
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Building className="h-12 w-12 text-po-blue" />
          </div>
          <CardTitle className="text-2xl text-center">Supplier Portal</CardTitle>
          <CardDescription className="text-center">
            Log in to view your purchase orders and manage invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="vendor@company.com" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="text-xs text-muted-foreground">
                For demo: try vendor@apple.com
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-xs text-muted-foreground">
                For demo: any password will work
              </div>
            </div>
            <Button type="submit" className="w-full bg-po-blue hover:bg-blue-600">
              Log in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Need help? Contact your procurement team
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SupplierPortal;
