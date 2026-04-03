import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/paymentUtils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart,
} from 'recharts';
import { BarChart3, TrendingUp, Package } from 'lucide-react';

const RBar = Bar as unknown as React.ComponentType<any>;
const RXAxis = XAxis as unknown as React.ComponentType<any>;
const RYAxis = YAxis as unknown as React.ComponentType<any>;
const RTooltip = Tooltip as unknown as React.ComponentType<any>;
const RCartesianGrid = CartesianGrid as unknown as React.ComponentType<any>;
const RLine = Line as unknown as React.ComponentType<any>;
const RComposedChart = ComposedChart as unknown as React.ComponentType<any>;

export default function PriceBenchmark() {
  // Load all PO items with article_type and supplier_type info
  const { data: poItems, isLoading: loadingItems } = useQuery({
    queryKey: ['benchmark-po-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select(`
          *,
          article_type:article_types(id, name, supplier_type_id),
          purchase_order:purchase_orders(id, created_at, currency, status)
        `)
        .not('article_type_id', 'is', null);
      if (error) throw error;
      return (data || []).filter((item: any) => item.purchase_order?.status !== 'rejected');
    },
  });

  const { data: supplierTypes } = useQuery({
    queryKey: ['benchmark-supplier-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('supplier_types').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: articleTypes } = useQuery({
    queryKey: ['benchmark-article-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('article_types').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Build analytics by supplier_type -> article_type
  const analytics = useMemo(() => {
    if (!poItems || !supplierTypes || !articleTypes) return [];

    const stMap = new Map(supplierTypes.map(st => [st.id, st]));
    const atMap = new Map(articleTypes.map(at => [at.id, at]));

    // Group items by article_type
    const byArticle = new Map<string, {
      articleType: any;
      supplierType: any;
      prices: { price: number; date: string }[];
    }>();

    poItems.forEach((item: any) => {
      const at = item.article_type;
      if (!at) return;
      const key = at.id;
      if (!byArticle.has(key)) {
        byArticle.set(key, {
          articleType: atMap.get(at.id) || at,
          supplierType: stMap.get(at.supplier_type_id),
          prices: [],
        });
      }
      byArticle.get(key)!.prices.push({
        price: Number(item.unit_price),
        date: item.purchase_order?.created_at || '',
      });
    });

    // Group by supplier type
    const bySupplierType = new Map<string, {
      supplierType: any;
      articles: {
        articleType: any;
        avg: number;
        min: number;
        max: number;
        stdDev: number;
        count: number;
        monthlyData: { month: string; avg: number }[];
      }[];
    }>();

    byArticle.forEach((data) => {
      const stId = data.supplierType?.id || 'unknown';
      if (!bySupplierType.has(stId)) {
        bySupplierType.set(stId, { supplierType: data.supplierType, articles: [] });
      }

      const prices = data.prices.map(p => p.price);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const variance = prices.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);

      // Monthly evolution (last 12 months)
      const monthlyMap = new Map<string, number[]>();
      data.prices.forEach(p => {
        if (!p.date) return;
        const d = new Date(p.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap.has(key)) monthlyMap.set(key, []);
        monthlyMap.get(key)!.push(p.price);
      });
      const monthlyData = Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([month, vals]) => ({
          month,
          avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        }));

      bySupplierType.get(stId)!.articles.push({
        articleType: data.articleType,
        avg, min, max, stdDev, count: prices.length,
        monthlyData,
      });
    });

    return Array.from(bySupplierType.values()).sort((a, b) =>
      (a.supplierType?.name || '').localeCompare(b.supplierType?.name || '')
    );
  }, [poItems, supplierTypes, articleTypes]);

  if (loadingItems) {
    return <div className="flex justify-center items-center p-8">Chargement des données...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Benchmark Prix
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Analyse des prix pratiqués par métier et par livrable
        </p>
      </div>

      {analytics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Aucune donnée de prix disponible. Créez des bons de commande avec des articles du catalogue pour alimenter le benchmark.
          </CardContent>
        </Card>
      ) : (
        analytics.map((group) => (
          <Card key={group.supplierType?.id || 'unknown'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: group.supplierType?.color || '#6B7280' }}
                />
                {group.supplierType?.name || 'Non classé'}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {group.articles.reduce((s, a) => s + a.count, 0)} transactions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary table */}
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Livrable</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Nb</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Min</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Moy.</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Max</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Écart-type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {group.articles.map(art => (
                        <tr key={art.articleType.id}>
                          <td className="px-4 py-3 font-medium">{art.articleType.name}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{art.count}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(art.min)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(art.avg)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(art.max)}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {art.stdDev > 0 ? `± ${formatCurrency(art.stdDev)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Monthly evolution chart for articles with enough data */}
                {group.articles
                  .filter(a => a.monthlyData.length >= 2)
                  .map(art => (
                    <div key={`chart-${art.articleType.id}`}>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Évolution : {art.articleType.name}
                      </p>
                      <ResponsiveContainer width="100%" height={180}>
                        <RComposedChart data={art.monthlyData}>
                          <RCartesianGrid strokeDasharray="3 3" vertical={false} />
                          <RXAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <RYAxis tickFormatter={(v: number) => `${v.toFixed(0)}€`} tick={{ fontSize: 11 }} />
                          <RTooltip formatter={(v: number) => formatCurrency(v)} />
                          <RBar dataKey="avg" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.3} />
                          <RLine dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                        </RComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
