
import React from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsOverview from '@/components/dashboard/StatsOverview';
import RecentPurchaseOrders from '@/components/dashboard/RecentPurchaseOrders';
import ApprovalStatus from '@/components/dashboard/ApprovalStatus';
import QuickActions from '@/components/dashboard/QuickActions';
import SupplierDashboardTab from '@/components/vendors/SupplierDashboardTab';

const Index = () => {
  return (
    <div className="space-y-8">
      <DashboardHeader />

      <SupplierDashboardTab />

      {/* Chiffres clés */}
      <StatsOverview />

      {/* Statut & alertes */}
      <ApprovalStatus />

      {/* Bons de commande récents — pleine largeur */}
      <RecentPurchaseOrders />

      {/* Actions rapides — barre dédiée, séparée des KPIs */}
      <div className="pt-2 border-t border-border">
        <div className="pt-6">
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Index;
