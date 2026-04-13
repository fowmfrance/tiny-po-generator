import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, subYears, startOfYear, startOfMonth } from 'date-fns';

export type PeriodKey = '1M' | '3M' | '6M' | '12M' | 'LTM' | 'YTD' | 'Tout';

export interface SupplierDashboardData {
  projectSplit: { name: string; value: number; color: string }[];
  byTrade: { name: string; value: number; color: string }[];
  byPaymentMethod: { name: string; value: number; color: string }[];
  monthlyData: {
    month: string;
    sortKey: string;
    projet: number;
    horsProjet: number;
    byTrade: Record<string, number>;
  }[];
  totalN: number;
  totalPrev: number;
  poCountN: number;
  poCountPrev: number;
  supplierCountN: number;
  supplierCountPrev: number;
  trades: { name: string; color: string }[];
}

const PAYMENT_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

function getDateRange(period: PeriodKey): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const end = now;
  let start: Date;

  switch (period) {
    case '1M':
      start = subMonths(now, 1);
      break;
    case '3M':
      start = subMonths(now, 3);
      break;
    case '6M':
      start = subMonths(now, 6);
      break;
    case '12M':
      start = subMonths(now, 12);
      break;
    case 'LTM':
      start = subMonths(startOfMonth(now), 12);
      break;
    case 'YTD':
      start = startOfYear(now);
      break;
    case 'Tout':
    default:
      start = new Date(2000, 0, 1);
      break;
  }

  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start, end, prevStart, prevEnd };
}

function buildAggregation(
  posList: any[],
  supplierMap: Map<string, any>
) {
  let projetTotal = 0, horsProjetTotal = 0;
  const tradeMap = new Map<string, { total: number; color: string }>();
  const pmMap = new Map<string, number>();
  const monthMap = new Map<string, { projet: number; horsProjet: number; byTrade: Record<string, number> }>();
  const uniqueSuppliers = new Set<string>();

  posList.forEach((p: any) => {
    const amt = Number(p.total_amount) || 0;
    const s = supplierMap.get(p.supplier_id);
    const tradeName = s?.supplier_type?.name || 'Non classé';
    const tradeColor = s?.supplier_type?.color || '#6B7280';
    const pmName = s?.payment_method?.name || 'Non défini';

    if (p.budget_id) projetTotal += amt; else horsProjetTotal += amt;

    const existing = tradeMap.get(tradeName) || { total: 0, color: tradeColor };
    existing.total += amt;
    tradeMap.set(tradeName, existing);

    pmMap.set(pmName, (pmMap.get(pmName) || 0) + amt);

    uniqueSuppliers.add(p.supplier_id);

    const d = new Date(p.created_at);
    const key = format(d, 'yyyy-MM');
    const entry = monthMap.get(key) || { projet: 0, horsProjet: 0, byTrade: {} };
    if (p.budget_id) entry.projet += amt; else entry.horsProjet += amt;
    entry.byTrade[tradeName] = (entry.byTrade[tradeName] || 0) + amt;
    monthMap.set(key, entry);
  });

  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const projectSplit = [
    { name: 'Projet', value: projetTotal, color: '#3B82F6' },
    { name: 'Hors projet', value: horsProjetTotal, color: '#94A3B8' },
  ].filter(d => d.value > 0);

  const byTrade = Array.from(tradeMap.entries())
    .map(([name, d]) => ({ name, value: d.total, color: d.color }))
    .sort((a, b) => b.value - a.value);

  const byPaymentMethod = Array.from(pmMap.entries())
    .map(([name, value], i) => ({ name, value, color: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const [y, m] = key.split('-');
      return {
        month: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`,
        sortKey: key,
        ...data,
      };
    });

  const total = posList.reduce((s: number, p: any) => s + (Number(p.total_amount) || 0), 0);
  const trades = byTrade.map(t => ({ name: t.name, color: t.color }));

  return { projectSplit, byTrade, byPaymentMethod, monthlyData, total, poCount: posList.length, supplierCount: uniqueSuppliers.size, trades };
}

export function useSupplierDashboard(period: PeriodKey = 'YTD') {
  return useQuery({
    queryKey: ['supplier-dashboard', period],
    queryFn: async (): Promise<SupplierDashboardData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: pos, error } = await supabase
        .from('purchase_orders')
        .select('id, total_amount, budget_id, created_at, supplier_id')
        .order('created_at');
      if (error) throw error;

      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, supplier_type_id, default_payment_method_id, supplier_type:supplier_types(name, color), payment_method:payment_methods(name)');

      const supplierMap = new Map<string, any>();
      (suppliers || []).forEach((s: any) => supplierMap.set(s.id, s));

      const { start, end, prevStart, prevEnd } = getDateRange(period);

      const allPos = pos || [];
      const posN = allPos.filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= start && d <= end;
      });
      const posPrev = allPos.filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= prevStart && d <= prevEnd;
      });

      const current = buildAggregation(posN, supplierMap);
      const prev = buildAggregation(posPrev, supplierMap);

      return {
        projectSplit: current.projectSplit,
        byTrade: current.byTrade,
        byPaymentMethod: current.byPaymentMethod,
        monthlyData: current.monthlyData,
        totalN: current.total,
        totalPrev: prev.total,
        poCountN: current.poCount,
        poCountPrev: prev.poCount,
        supplierCountN: current.supplierCount,
        supplierCountPrev: prev.supplierCount,
        trades: current.trades,
      };
    },
  });
}
