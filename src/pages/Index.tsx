
import React from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsOverview from '@/components/dashboard/StatsOverview';
import RecentPurchaseOrders from '@/components/dashboard/RecentPurchaseOrders';
import ApprovalStatus from '@/components/dashboard/ApprovalStatus';
import QuickActions from '@/components/dashboard/QuickActions';
import SupplierDashboardTab from '@/components/vendors/SupplierDashboardTab';

const Index = () => {
  return (
    <div className="space-y-6">
      <DashboardHeader />

      <SupplierDashboardTab />
      
      <StatsOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <ApprovalStatus />
          <QuickActions />
        </div>
        <div className="lg:col-span-2">
          <RecentPurchaseOrders />
        </div>
      </div>
    </div>
  );
};

export default Index;
