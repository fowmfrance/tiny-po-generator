import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfYear, startOfMonth, endOfMonth, subDays } from 'date-fns';

export type PeriodKey = '1M' | '3M' | '6M' | '12M' | 'LTM' | 'YTD' | 'Tout' | 'Custom';

const COMPARABLE_PERIODS = new Set<PeriodKey>(['1M', '3M', '6M', '12M', 'LTM', 'YTD']);

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
    budgetVentes: number;
  }[];
  totalN: number;
  totalPrev: number;
  poCountN: number;
  poCountPrev: number;
  supplierCountN: number;
  supplierCountPrev: number;
  trades: { name: string; color: string }[];
  hasComparison: boolean;
}

const PAYMENT_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

function shiftYearMinus1(d: Date): Date {
  const shifted = new Date(d);
  shifted.setFullYear(shifted.getFullYear() - 1);
  return shifted;
}

function getDateRange(period: PeriodKey, customFrom?: string, customTo?: string): {
  start: Date; end: Date;
  prevStart: Date | null; prevEnd: Date | null;
  comparable: boolean;
} {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (period) {
    case '1M':
    case '3M':
    case '6M':
    case '12M': {
      const months = period === '1M' ? 1 : period === '3M' ? 3 : period === '6M' ? 6 : 12;
      // EOM rule: last complete month
      const lastCompleteMonth = endOfMonth(subMonths(startOfMonth(now), 1));
      end = lastCompleteMonth;
      start = startOfMonth(subMonths(end, months - 1));
      break;
    }
    case 'LTM':
      start = subDays(now, 365);
      break;
    case 'YTD':
      start = startOfYear(now);
      break;
    case 'Custom':
      if (customFrom && customTo) {
        start = new Date(customFrom);
        end = new Date(customTo);
      } else {
        start = startOfYear(now);
      }
      break;
    case 'Tout':
    default:
      start = new Date(2000, 0, 1);
      break;
  }

  const comparable = COMPARABLE_PERIODS.has(period);
  const prevStart = comparable ? shiftYearMinus1(start) : null;
  const prevEnd = comparable ? shiftYearMinus1(end) : null;

  return { start, end, prevStart, prevEnd, comparable };
}

function buildAggregation(
  posList: any[],
  supplierMap: Map<string, any>,
  budgetMap: Map<string, any>
) {
  let projetTotal = 0, horsProjetTotal = 0;
  const tradeMap = new Map<string, { total: number; color: string }>();
  const pmMap = new Map<string, number>();
  const monthMap = new Map<string, { projet: number; horsProjet: number; byTrade: Record<string, number>; budgetVentes: number }>();
  const uniqueSuppliers = new Set<string>();
  const seenBudgets = new Set<string>();

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
    const entry = monthMap.get(key) || { projet: 0, horsProjet: 0, byTrade: {}, budgetVentes: 0 };
    if (p.budget_id) entry.projet += amt; else entry.horsProjet += amt;
    entry.byTrade[tradeName] = (entry.byTrade[tradeName] || 0) + amt;

    // Add budget ventes (resale_price) once per budget per month
    if (p.budget_id && !seenBudgets.has(`${p.budget_id}-${key}`)) {
      seenBudgets.add(`${p.budget_id}-${key}`);
      const budget = budgetMap.get(p.budget_id);
      if (budget) {
        const resale = Number(budget.resale_price) || 0;
        const initial = Number(budget.initial_amount) || 0;
        // Budget de ventes = resale_price if set, otherwise initial_amount (internal project = no margin)
        entry.budgetVentes += resale > 0 ? resale : initial;
      }
    }

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

export function useSupplierDashboard(period: PeriodKey = 'YTD', customFrom?: string, customTo?: string) {
  return useQuery({
    queryKey: ['supplier-dashboard', period, customFrom || '', customTo || ''],
    queryFn: async (): Promise<SupplierDashboardData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const [posRes, suppRes, budgetsRes] = await Promise.all([
        supabase.from('purchase_orders').select('id, total_amount, budget_id, created_at, supplier_id').order('created_at'),
        supabase.from('suppliers').select('id, supplier_type_id, default_payment_method_id, supplier_type:supplier_types(name, color), payment_method:payment_methods(name)'),
        supabase.from('budgets').select('id, initial_amount, resale_price'),
      ]);

      if (posRes.error) throw posRes.error;

      const supplierMap = new Map<string, any>();
      (suppRes.data || []).forEach((s: any) => supplierMap.set(s.id, s));

      const budgetMap = new Map<string, any>();
      (budgetsRes.data || []).forEach((b: any) => budgetMap.set(b.id, b));

      const { start, end, prevStart, prevEnd, comparable } = getDateRange(period, customFrom, customTo);

      const allPos = posRes.data || [];
      const posN = allPos.filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= start && d <= end;
      });

      let prev = { projectSplit: [], byTrade: [], byPaymentMethod: [], monthlyData: [], total: 0, poCount: 0, supplierCount: 0, trades: [] };

      if (comparable && prevStart && prevEnd) {
        const posPrev = allPos.filter((p: any) => {
          const d = new Date(p.created_at);
          return d >= prevStart && d <= prevEnd;
        });
        prev = buildAggregation(posPrev, supplierMap, budgetMap);
      }

      const current = buildAggregation(posN, supplierMap, budgetMap);

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
        hasComparison: comparable,
      };
    },
  });
}
