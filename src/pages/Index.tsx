
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  DollarSign, 
  Receipt, 
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus 
} from 'lucide-react';
import PurchaseOrderCard from '@/components/PurchaseOrderCard';

// Sample data for the dashboard
const recentPOs = [
  {
    id: '1',
    poNumber: '2023-001',
    vendor: 'Apple Inc.',
    vendorId: 'v1', // Adding the missing vendorId property
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
    vendorId: 'v2', // Adding the missing vendorId property
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
    vendorId: 'v3', // Adding the missing vendorId property
    amount: 2800,
    currency: 'USD',
    date: '2023-06-20',
    status: 'pending' as const
  }
];

const Index = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to OrderFlow, your purchase order management system
          </p>
        </div>
        <Link to="/purchase-orders/create">
          <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchase Orders
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Vendors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 new this quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Budget Utilization
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              $68,000 of $100,000
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invoices
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              $24,500 total value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-amber-500" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">3</div>
            <div className="text-sm text-muted-foreground">
              Purchase orders waiting for approval
            </div>
            <Link 
              to="/purchase-orders?status=pending" 
              className="text-po-blue hover:text-blue-700 text-sm flex items-center mt-4"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">2</div>
            <div className="text-sm text-muted-foreground">
              Items requiring your attention
            </div>
            <Link 
              to="/alerts" 
              className="text-po-blue hover:text-blue-700 text-sm flex items-center mt-4"
            >
              View Alerts
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Recently Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">5</div>
            <div className="text-sm text-muted-foreground">
              Purchase orders fulfilled this month
            </div>
            <Link 
              to="/purchase-orders?status=completed" 
              className="text-po-blue hover:text-blue-700 text-sm flex items-center mt-4"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent POs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Purchase Orders</h2>
          <Link 
            to="/purchase-orders" 
            className="text-po-blue hover:text-blue-700 text-sm flex items-center"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPOs.map((po) => (
            <PurchaseOrderCard key={po.id} {...po} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/purchase-orders/create">
            <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileText className="h-10 w-10 text-po-blue mb-2" />
                <span className="text-sm font-medium">Create PO</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/vendors/new">
            <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Users className="h-10 w-10 text-po-blue mb-2" />
                <span className="text-sm font-medium">Add Vendor</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/invoices">
            <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Receipt className="h-10 w-10 text-po-blue mb-2" />
                <span className="text-sm font-medium">Check Invoices</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/reports">
            <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <TrendingUp className="h-10 w-10 text-po-blue mb-2" />
                <span className="text-sm font-medium">View Reports</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
