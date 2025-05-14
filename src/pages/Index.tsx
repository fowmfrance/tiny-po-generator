
import React from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ApprovalStatus from '@/components/dashboard/ApprovalStatus';
import RecentPurchaseOrders from '@/components/dashboard/RecentPurchaseOrders';
import QuickActions from '@/components/dashboard/QuickActions';

const Index = () => {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <StatsOverview />
      <ApprovalStatus />
      <RecentPurchaseOrders />
      <QuickActions />
    </div>
  );
};

export default Index;
