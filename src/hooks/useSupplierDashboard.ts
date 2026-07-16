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
    caLinearise: number;
  }[];
  cumulativeData: {
    month: string;
    sortKey: string;
    ca: number;
    chargesInternes: number;
    chargesExternes: number;
    cumul: number;
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

// Palette Kiosco (terracotta en tête + tons terroir)
const PAYMENT_COLORS = ['#D97757', '#B8853A', '#4A7C59', '#4A5568', '#9B3B2A', '#6B6860'];

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

/** Spread an amount linearly across months between start and end (inclusive). */
function spreadLinearMonthly(amount: number, startDate: string | null, endDate: string | null): Map<string, number> {
  const result = new Map<string, number>();
  if (!startDate || !endDate || amount <= 0) return result;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return result;

  // Count months (inclusive)
  const months: string[] = [];
  const cursor = new Date(s.getFullYear(), s.getMonth(), 1);
  const endMonth = new Date(e.getFullYear(), e.getMonth(), 1);
  while (cursor <= endMonth) {
    months.push(format(cursor, 'yyyy-MM'));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  if (months.length === 0) return result;
  const perMonth = amount / months.length;
  months.forEach(m => result.set(m, perMonth));
  return result;
}

function buildAggregation(
  posList: any[],
  supplierMap: Map<string, any>,
  budgetMap: Map<string, any>
) {
  let projetTotal = 0, horsProjetTotal = 0;
  const tradeMap = new Map<string, { total: number; color: string }>();
  const pmMap = new Map<string, number>();
  const monthMap = new Map<string, { projet: number; horsProjet: number; byTrade: Record<string, number>; budgetVentes: number; chargesExternes: number }>();
  const uniqueSuppliers = new Set<string>();

  // « Projet » = rattaché à un budget de type Project (les budgets G&A comme
  // « Visibilité LinkedIn » sont hors-projet, tout comme les BdC sans budget).
  const isProjet = (budgetId: string | null | undefined) => {
    if (!budgetId) return false;
    const b = budgetMap.get(budgetId);
    return !!b && b.budget_type_id === 'project';
  };

  posList.forEach((p: any) => {
    const amt = Number(p.amt ?? p.total_amount) || 0;
    const s = supplierMap.get(p.supplier_id);
    const tradeName = s?.supplier_type?.name || 'Non classé';
    const tradeColor = s?.supplier_type?.color || '#B8853A';
    const pmName = s?.payment_method?.name || 'Non défini';
    const projet = isProjet(p.budget_id);

    if (projet) projetTotal += amt; else horsProjetTotal += amt;

    const existing = tradeMap.get(tradeName) || { total: 0, color: tradeColor };
    existing.total += amt;
    tradeMap.set(tradeName, existing);

    pmMap.set(pmName, (pmMap.get(pmName) || 0) + amt);
    uniqueSuppliers.add(p.supplier_id);

    const d = new Date(p.created_at);
    const key = format(d, 'yyyy-MM');
    const entry = monthMap.get(key) || { projet: 0, horsProjet: 0, byTrade: {}, budgetVentes: 0, chargesExternes: 0 };
    if (projet) entry.projet += amt; else entry.horsProjet += amt;
    entry.byTrade[tradeName] = (entry.byTrade[tradeName] || 0) + amt;

    // External project charges = PO-date based
    if (p.budget_id) {
      const budget = budgetMap.get(p.budget_id);
      if (budget) {
        const resale = Number(budget.resale_price) || 0;
        if (resale > 0) {
          entry.chargesExternes += amt;
        }
      }
    }

    monthMap.set(key, entry);
  });

  // Compute linearized revenue (CA) and internal charges from budgets
  const caMonthly = new Map<string, number>();
  const chargesInternesMonthly = new Map<string, number>();

  budgetMap.forEach((budget) => {
    const resale = Number(budget.resale_price) || 0;
    const initial = Number(budget.initial_amount) || 0;
    if (resale > 0) {
      // External project → spread resale_price as revenue
      const spread = spreadLinearMonthly(resale, budget.start_date, budget.end_date);
      spread.forEach((v, m) => caMonthly.set(m, (caMonthly.get(m) || 0) + v));
    } else if (initial > 0) {
      // Internal project → spread initial_amount as charges
      const spread = spreadLinearMonthly(initial, budget.start_date, budget.end_date);
      spread.forEach((v, m) => chargesInternesMonthly.set(m, (chargesInternesMonthly.get(m) || 0) + v));
    }
  });

  // Merge all month keys
  const allMonthKeys = new Set<string>();
  monthMap.forEach((_, k) => allMonthKeys.add(k));
  caMonthly.forEach((_, k) => allMonthKeys.add(k));
  chargesInternesMonthly.forEach((_, k) => allMonthKeys.add(k));

  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const projectSplit = [
    { name: 'Projet', value: projetTotal, color: '#D97757' },
    { name: 'Hors projet', value: horsProjetTotal, color: '#6B6860' },
  ].filter(d => d.value > 0);

  const byTrade = Array.from(tradeMap.entries())
    .map(([name, d]) => ({ name, value: d.total, color: d.color }))
    .sort((a, b) => b.value - a.value);

  const byPaymentMethod = Array.from(pmMap.entries())
    .map(([name, value], i) => ({ name, value, color: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  const sortedKeys = Array.from(allMonthKeys).sort();

  const monthlyData = sortedKeys.map(key => {
    const data = monthMap.get(key) || { projet: 0, horsProjet: 0, byTrade: {}, budgetVentes: 0, chargesExternes: 0 };
    const [y, m] = key.split('-');
    return {
      month: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`,
      sortKey: key,
      projet: data.projet,
      horsProjet: data.horsProjet,
      byTrade: data.byTrade,
      budgetVentes: 0, // kept for compatibility
      caLinearise: caMonthly.get(key) || 0,
    };
  });

  // Build cumulative data
  let cumul = 0;
  const cumulativeData = sortedKeys.map(key => {
    const ca = caMonthly.get(key) || 0;
    const ci = chargesInternesMonthly.get(key) || 0;
    const ce = (monthMap.get(key)?.chargesExternes) || 0;
    cumul += ca - ci - ce;
    const [y, m] = key.split('-');
    return {
      month: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`,
      sortKey: key,
      ca,
      chargesInternes: ci,
      chargesExternes: ce,
      cumul,
    };
  });

  const total = posList.reduce((s: number, p: any) => s + (Number(p.amt ?? p.total_amount) || 0), 0);
  const trades = byTrade.map(t => ({ name: t.name, color: t.color }));

  return { projectSplit, byTrade, byPaymentMethod, monthlyData, cumulativeData, total, poCount: posList.length, supplierCount: uniqueSuppliers.size, trades };
}

export type DashboardLens = 'po' | 'invoice';
export type AmountBasis = 'ht' | 'ttc';

export function useSupplierDashboard(
  period: PeriodKey = 'YTD',
  customFrom?: string,
  customTo?: string,
  lens: DashboardLens = 'po',
  basis: AmountBasis = 'ht',
) {
  return useQuery({
    queryKey: ['supplier-dashboard', period, customFrom || '', customTo || '', lens, basis],
    queryFn: async (): Promise<SupplierDashboardData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const [posRes, invRes, suppRes, budgetsRes] = await Promise.all([
        supabase.from('purchase_orders').select('id, total_amount, amount_ht, amount_ttc, budget_id, created_at, supplier_id').order('created_at'),
        supabase.from('supplier_invoices').select('id, amount, amount_ht, amount_ttc, vat_amount, supplier_id, invoice_date, purchase_order_id, status'),
        supabase.from('suppliers').select('id, supplier_type_id, default_payment_method_id, supplier_type:supplier_types(name, color), payment_method:payment_methods(name)'),
        supabase.from('budgets').select('id, initial_amount, resale_price, start_date, end_date, budget_type_id'),
      ]);

      if (posRes.error) throw posRes.error;

      const supplierMap = new Map<string, any>();
      (suppRes.data || []).forEach((s: any) => supplierMap.set(s.id, s));

      const budgetMap = new Map<string, any>();
      (budgetsRes.data || []).forEach((b: any) => budgetMap.set(b.id, b));

      // budget_id d'une facture = via son BdC (les factures ne portent pas budget_id)
      const poBudget = new Map<string, string | null>();
      (posRes.data || []).forEach((p: any) => poBudget.set(p.id, p.budget_id ?? null));

      // Normalise chaque source en lignes { supplier_id, budget_id, created_at, amt }
      const poAmt = (p: any) => (basis === 'ttc' ? (p.amount_ttc ?? p.total_amount) : (p.amount_ht ?? p.total_amount));
      const invAmt = (i: any) => (basis === 'ttc'
        ? (i.amount_ttc ?? i.amount)
        : (i.amount_ht ?? (Number(i.amount || 0) - Number(i.vat_amount || 0))));

      const num = (x: any) => Number(x) || 0;
      const rows: any[] = lens === 'invoice'
        ? (invRes.data || [])
            .filter((i: any) => i.status !== 'cancelled')
            .map((i: any) => ({
              supplier_id: i.supplier_id,
              budget_id: i.purchase_order_id ? (poBudget.get(i.purchase_order_id) ?? null) : null,
              created_at: i.invoice_date,
              amt: num(invAmt(i)),
            }))
        : (posRes.data || []).map((p: any) => ({ ...p, amt: num(poAmt(p)) }));

      const { start, end, prevStart, prevEnd, comparable } = getDateRange(period, customFrom, customTo);

      const allPos = rows;
      const posN = allPos.filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= start && d <= end;
      });

      let prev = { projectSplit: [], byTrade: [], byPaymentMethod: [], monthlyData: [], cumulativeData: [], total: 0, poCount: 0, supplierCount: 0, trades: [] };

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
        cumulativeData: current.cumulativeData,
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
