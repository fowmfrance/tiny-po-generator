
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartBar, ChartPie, FileChartLine, FolderOpen, FileMinus } from 'lucide-react';
import VendorSpendingChart from '@/components/reports/VendorSpendingChart';
import VendorPOCountChart from '@/components/reports/VendorPOCountChart';
import NewVendorsChart from '@/components/reports/NewVendorsChart';
import PendingInvoicesChart from '@/components/reports/PendingInvoicesChart';
import MonthlyMetricsChart from '@/components/reports/MonthlyMetricsChart';
import BudgetPerformanceChart from '@/components/reports/BudgetPerformanceChart';

const Reports = () => {
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rapports & Analyses</h1>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Période :</span>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-sm"
          >
            <option value="1m">30 derniers jours</option>
            <option value="3m">3 derniers mois</option>
            <option value="6m">6 derniers mois</option>
            <option value="1y">12 derniers mois</option>
          </select>
        </div>
      </div>
      
      <Tabs defaultValue="vendors" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>Fournisseurs</span>
          </TabsTrigger>
          <TabsTrigger value="finances" className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span>Finances</span>
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <ChartPie className="h-4 w-4" />
            <span>Budgets</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <FileChartLine className="h-4 w-4" />
            <span>Tendances</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 10 Fournisseurs par Montant Dépensé</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorSpendingChart timeRange={timeRange} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 10 Fournisseurs par Nombre de BC</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorPOCountChart timeRange={timeRange} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nouveaux Fournisseurs par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <NewVendorsChart timeRange={timeRange} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 10 Fournisseurs - Factures en Attente</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingInvoicesChart timeRange={timeRange} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="finances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métriques Mensuelles</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <MonthlyMetricsChart timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="budgets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance des Budgets</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <BudgetPerformanceChart timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <div className="bg-white rounded-lg p-8 text-center">
            <FileMinus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Tendances à venir</h3>
            <p className="text-gray-500">
              Cette section sera bientôt disponible avec des analyses de tendances et des prévisions.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
