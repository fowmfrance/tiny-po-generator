import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, Euro, Package, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface KPIs {
  organizations: number;
  users: number;
  purchaseOrders: number;
  budgets: number;
  suppliers: number;
  invoices: number;
}

const BackofficeDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KPIs>({ organizations: 0, users: 0, purchaseOrders: 0, budgets: 0, suppliers: 0, invoices: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      const [orgs, profiles, pos, budgets, suppliers, invoices] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('purchase_orders').select('id', { count: 'exact', head: true }),
        supabase.from('budgets').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('supplier_invoices').select('id', { count: 'exact', head: true }),
      ]);

      setKpis({
        organizations: orgs.count ?? 0,
        users: profiles.count ?? 0,
        purchaseOrders: pos.count ?? 0,
        budgets: budgets.count ?? 0,
        suppliers: suppliers.count ?? 0,
        invoices: invoices.count ?? 0,
      });
      setLoading(false);
    };
    fetchKPIs();
  }, []);

  const cards = [
    { label: 'Organisations', value: kpis.organizations, icon: Building2, color: 'text-blue-600' },
    { label: 'Utilisateurs', value: kpis.users, icon: Users, color: 'text-emerald-600' },
    { label: 'Bons de commande', value: kpis.purchaseOrders, icon: FileText, color: 'text-orange-600' },
    { label: 'Budgets / Projets', value: kpis.budgets, icon: Euro, color: 'text-purple-600' },
    { label: 'Fournisseurs', value: kpis.suppliers, icon: Package, color: 'text-pink-600' },
    { label: 'Factures', value: kpis.invoices, icon: TrendingUp, color: 'text-cyan-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Back-office</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble cross-tenant de l'activité plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold">{card.value.toLocaleString('fr-FR')}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BackofficeDashboard;
