
import React from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ApprovalStatus from '@/components/dashboard/ApprovalStatus';
import QuickActions from '@/components/dashboard/QuickActions';
import SupplierDashboardTab from '@/components/vendors/SupplierDashboardTab';

const Index = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <DashboardHeader />
        {/* Actions rapides — barre compacte, en haut */}
        <QuickActions />
      </div>

      <SupplierDashboardTab />

      {/* Chiffres clés */}
      <StatsOverview />

      {/* Statut & alertes */}
      <ApprovalStatus />
    </div>
  );
};

export default Index;
