import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, startOfMonth } from 'date-fns';

function getStartDate(timeRange: string): string {
  const months = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
  return subMonths(new Date(), months).toISOString();
}

export function useVendorSpending(timeRange: string) {
  return useQuery({
    queryKey: ['reports', 'vendor-spending', timeRange],
    queryFn: async () => {
      const since = getStartDate(timeRange);
      const { data: pos, error } = await supabase
        .from('purchase_orders')
        .select('supplier_id, supplier_name, total_amount')
        .gte('created_at', since)
        .not('supplier_name', 'is', null);

      if (error) throw error;

      const byVendor: Record<string, { name: string; value: number }> = {};
      for (const po of pos || []) {
        const key = po.supplier_id || po.supplier_name || 'Inconnu';
        if (!byVendor[key]) byVendor[key] = { name: po.supplier_name || 'Inconnu', value: 0 };
        byVendor[key].value += Number(po.total_amount) || 0;
      }
      return Object.values(byVendor).sort((a, b) => b.value - a.value).slice(0, 10);
    },
  });
}

export function useVendorPOCount(timeRange: string) {
  return useQuery({
    queryKey: ['reports', 'vendor-po-count', timeRange],
    queryFn: async () => {
      const since = getStartDate(timeRange);
      const { data: pos, error } = await supabase
        .from('purchase_orders')
        .select('supplier_id, supplier_name')
        .gte('created_at', since)
        .not('supplier_name', 'is', null);

      if (error) throw error;

      const byVendor: Record<string, { name: string; value: number }> = {};
      for (const po of pos || []) {
        const key = po.supplier_id || po.supplier_name || 'Inconnu';
        if (!byVendor[key]) byVendor[key] = { name: po.supplier_name || 'Inconnu', value: 0 };
        byVendor[key].value += 1;
      }
      return Object.values(byVendor).sort((a, b) => b.value - a.value).slice(0, 10);
    },
  });
}

export function useNewVendors(timeRange: string) {
  return useQuery({
    queryKey: ['reports', 'new-vendors', timeRange],
    queryFn: async () => {
      const since = getStartDate(timeRange);
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('id, supplier_type_id')
        .gte('created_at', since);

      if (error) throw error;

      const { data: types } = await supabase
        .from('supplier_types')
        .select('id, name, color');

      const typeMap: Record<string, { name: string; color: string }> = {};
      for (const t of types || []) {
        typeMap[t.id] = { name: t.name, color: t.color || '#64748b' };
      }

      const byType: Record<string, { name: string; value: number; color: string }> = {};
      for (const s of suppliers || []) {
        const typeInfo = s.supplier_type_id ? typeMap[s.supplier_type_id] : null;
        const key = typeInfo?.name || 'Autre';
        if (!byType[key]) byType[key] = { name: key, value: 0, color: typeInfo?.color || '#64748b' };
        byType[key].value += 1;
      }
      return Object.values(byType).sort((a, b) => b.value - a.value);
    },
  });
}

export function usePendingInvoices(timeRange: string) {
  return useQuery({
    queryKey: ['reports', 'pending-invoices', timeRange],
    queryFn: async () => {
      const since = getStartDate(timeRange);
      const { data: invoices, error } = await supabase
        .from('supplier_invoices')
        .select('supplier_id, supplier_name')
        .eq('status', 'pending')
        .gte('created_at', since);

      if (error) throw error;

      const byVendor: Record<string, { name: string; value: number }> = {};
      for (const inv of invoices || []) {
        const key = inv.supplier_id || inv.supplier_name || 'Inconnu';
        if (!byVendor[key]) byVendor[key] = { name: inv.supplier_name || 'Inconnu', value: 0 };
        byVendor[key].value += 1;
      }
      return Object.values(byVendor).sort((a, b) => b.value - a.value).slice(0, 10);
    },
  });
}

export function useMonthlyMetrics(timeRange: string) {
  return useQuery({
    queryKey: ['reports', 'monthly-metrics', timeRange],
    queryFn: async () => {
      const months = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
      const now = new Date();
      const results: any[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = startOfMonth(subMonths(now, i - 1));
        const startStr = monthStart.toISOString();
        const endStr = monthEnd.toISOString();

        const [posRes, invReceivedRes, invDueRes] = await Promise.all([
          supabase.from('purchase_orders').select('total_amount').gte('created_at', startStr).lt('created_at', endStr),
          supabase.from('supplier_invoices').select('amount').gte('received_date', startStr.slice(0, 10)).lt('received_date', endStr.slice(0, 10)),
          supabase.from('supplier_invoices').select('amount').gte('due_date', startStr.slice(0, 10)).lt('due_date', endStr.slice(0, 10)).eq('status', 'pending'),
        ]);

        const poTotal = (posRes.data || []).reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
        const invTotal = (invReceivedRes.data || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
        const dueTotal = (invDueRes.data || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);

        const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        results.push({
          name: monthName,
          'BC envoyés': Math.round(poTotal),
          'Factures reçues': Math.round(invTotal),
          'Factures échues': Math.round(dueTotal),
        });
      }
      return results;
    },
  });
}

export function useBudgetPerformance(timeRange: string) {
  return useQuery({
    queryKey: ['reports', 'budget-performance', timeRange],
    queryFn: async () => {
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select('id, name, initial_amount')
        .eq('status', 'active');

      if (error) throw error;

      const results: { name: string; value: number }[] = [];
      for (const b of budgets || []) {
        const { data: pos } = await supabase
          .from('purchase_orders')
          .select('total_amount')
          .eq('budget_id', b.id);

        const spent = (pos || []).reduce((s, p) => s + (Number(p.total_amount) || 0), 0);
        const remaining = Number(b.initial_amount) - spent;
        results.push({ name: b.name, value: Math.round(remaining) });
      }
      return results.sort((a, b) => b.value - a.value).slice(0, 10);
    },
  });
}
