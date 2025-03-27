
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Plus, Building, Mail, Phone, ArrowRight, LogIn } from 'lucide-react';

// Define vendor type
export interface Vendor {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  status: 'active' | 'pending' | 'inactive';
  totalPOs: number;
  poIds: string[]; // Add poIds property
}

// Mock data for demonstration - Export this for use in other components
export const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Apple Inc.',
    category: 'Technology',
    email: 'procurement@apple.com',
    phone: '+1 (800) 275-2273',
    status: 'active',
    totalPOs: 12,
    poIds: ['1', '2'] // Add corresponding PO IDs
  },
  {
    id: '2',
    name: 'Microsoft Corp',
    category: 'Software',
    email: 'vendor@microsoft.com',
    phone: '+1 (800) 642-7676',
    status: 'active',
    totalPOs: 8,
    poIds: ['3', '4']
  },
  {
    id: '3',
    name: 'Dell Technologies',
    category: 'Hardware',
    email: 'sales@dell.com',
    phone: '+1 (800) 624-9897',
    status: 'active',
    totalPOs: 5,
    poIds: ['5']
  },
  {
    id: '4',
    name: 'Amazon Business',
    category: 'Office Supplies',
    email: 'business@amazon.com',
    phone: '+1 (866) 486-2360',
    status: 'pending',
    totalPOs: 0,
    poIds: []
  },
  {
    id: '5',
    name: 'Samsung Electronics',
    category: 'Electronics',
    email: 'b2b@samsung.com',
    phone: '+1 (800) 726-7864',
    status: 'active',
    totalPOs: 3,
    poIds: ['6']
  },
  {
    id: '6',
    name: 'Logitech',
    category: 'Computer Accessories',
    email: 'sales@logitech.com',
    phone: '+1 (800) 231-7717',
    status: 'inactive',
    totalPOs: 2,
    poIds: ['7', '8']
  }
];

const Vendors = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter vendors based on search term
  const filteredVendors = mockVendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <div className="flex gap-2">
          <Link to="/supplier">
            <Button variant="outline" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Supplier Portal
            </Button>
          </Link>
          <Link to="/vendors/new">
            <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Vendor
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{vendor.name}</CardTitle>
                    <CardDescription>{vendor.category}</CardDescription>
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
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{vendor.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{vendor.totalPOs} Purchase Orders</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 pt-3">
                <Link 
                  to={`/vendors/${vendor.id}`} 
                  className="text-po-blue hover:text-blue-700 text-sm flex items-center ml-auto"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">No vendors found.</p>
          <Link to="/vendors/new">
            <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Vendor
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Vendors;
