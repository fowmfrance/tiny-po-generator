
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, Building, FileText, Clock, LogIn } from 'lucide-react';
import { mockVendors } from '@/pages/Vendors';

const VendorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Find the vendor with the matching ID
  const vendor = mockVendors.find(v => v.id === id);
  
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
        
        <Link to="/supplier">
          <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Supplier Portal Login
          </Button>
        </Link>
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
            <CardTitle>Supplier Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-500">
              Log in to the supplier portal to view and manage your purchase orders and invoices.
            </p>
            <Link to="/supplier" className="w-full">
              <Button className="w-full bg-po-blue hover:bg-blue-600 text-white flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                Access Portal
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendor.totalPOs > 0 ? (
              <div className="space-y-4">
                {Array.from({ length: Math.min(3, vendor.totalPOs) }).map((_, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">PO-2023-{(index + 101).toString().padStart(3, '0')}</p>
                      <p className="text-sm text-gray-500">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(Math.random() * 10000).toFixed(2)}</p>
                      <span className={`status-badge ${
                        index === 0 ? 'status-approved' : 
                        index === 1 ? 'status-pending' : 'status-draft'
                      }`}>
                        {index === 0 ? 'Approved' : 
                         index === 1 ? 'Pending' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/purchase-orders" className="text-po-blue hover:underline text-sm flex items-center">
                  View all purchase orders
                </Link>
              </div>
            ) : (
              <p className="text-center text-gray-500">No purchase orders found for this vendor.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDetail;
