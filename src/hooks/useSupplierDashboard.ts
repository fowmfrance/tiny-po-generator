import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfYear, subYears, format } from 'date-fns';

export interface SupplierDashboardData {
  // Donut: projet vs hors projet
  projectSplit: { name: string; value: number; color: string }[];
  // Donut: par métier
  byTrade: { name: string; value: number; color: string }[];
  // Donut: par moyen de paiement
  byPaymentMethod: { name: string; value: number; color: string }[];
  // Monthly bar chart
  monthlyData: {
    month: string;
    sortKey: string;
    projet: number;
    horsProjet: number;
    byTrade: Record<string, number>;
  }[];
  // N-1 monthly
  monthlyDataN1: {
    month: string;
    sortKey: string;
    projet: number;
    horsProjet: number;
    byTrade: Record<string, number>;
  }[];
  // Totals
  totalN: number;
  totalN1: number;
  poCountN: number;
  poCountN1: number;
  supplierCountN: number;
  trades: { name: string; color: string }[];
}

const PAYMENT_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

export function useSupplierDashboard() {
  return useQuery({
    queryKey: ['supplier-dashboard'],
    queryFn: async (): Promise<SupplierDashboardData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const now = new Date();
      const yearStart = format(startOfYear(now), 'yyyy-MM-dd');
      const prevYearStart = format(startOfYear(subYears(now, 1)), 'yyyy-MM-dd');
      const prevYearEnd = format(subYears(now, 0), 'yyyy-MM-dd'); // same day last year approx
      const yearEndN1 = format(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
        'yyyy-MM-dd'
      );

      // Fetch all POs with supplier info
      const { data: pos, error } = await supabase
        .from('purchase_orders')
        .select('id, total_amount, budget_id, created_at, supplier_id')
        .order('created_at');
      if (error) throw error;

      // Fetch suppliers with types and payment methods
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, supplier_type_id, default_payment_method_id, supplier_type:supplier_types(name, color), payment_method:payment_methods(name)');

      const supplierMap = new Map<string, any>();
      (suppliers || []).forEach((s: any) => supplierMap.set(s.id, s));

      const currentYear = now.getFullYear();
      const prevYear = currentYear - 1;

      // Filter N and N-1
      const posN = (pos || []).filter((p: any) => new Date(p.created_at).getFullYear() === currentYear);
      const posN1 = (pos || []).filter((p: any) => new Date(p.created_at).getFullYear() === prevYear);

      // --- Project split donut ---
      let projetTotal = 0, horsProjetTotal = 0;
      posN.forEach((p: any) => {
        const amt = Number(p.total_amount) || 0;
        if (p.budget_id) projetTotal += amt; else horsProjetTotal += amt;
      });
      const projectSplit = [
        { name: 'Projet', value: projetTotal, color: '#3B82F6' },
        { name: 'Hors projet', value: horsProjetTotal, color: '#94A3B8' },
      ].filter(d => d.value > 0);

      // --- By trade donut ---
      const tradeMap = new Map<string, { total: number; color: string }>();
      posN.forEach((p: any) => {
        const s = supplierMap.get(p.supplier_id);
        const tradeName = s?.supplier_type?.name || 'Non classé';
        const tradeColor = s?.supplier_type?.color || '#6B7280';
        const existing = tradeMap.get(tradeName) || { total: 0, color: tradeColor };
        existing.total += Number(p.total_amount) || 0;
        tradeMap.set(tradeName, existing);
      });
      const byTrade = Array.from(tradeMap.entries())
        .map(([name, d]) => ({ name, value: d.total, color: d.color }))
        .sort((a, b) => b.value - a.value);

      // --- By payment method donut ---
      const pmMap = new Map<string, number>();
      posN.forEach((p: any) => {
        const s = supplierMap.get(p.supplier_id);
        const pmName = s?.payment_method?.name || 'Non défini';
        pmMap.set(pmName, (pmMap.get(pmName) || 0) + (Number(p.total_amount) || 0));
      });
      const byPaymentMethod = Array.from(pmMap.entries())
        .map(([name, value], i) => ({ name, value, color: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }))
        .sort((a, b) => b.value - a.value);

      // --- Monthly bar chart ---
      const buildMonthly = (posList: any[]) => {
        const monthMap = new Map<string, { projet: number; horsProjet: number; byTrade: Record<string, number> }>();
        posList.forEach((p: any) => {
          const d = new Date(p.created_at);
          const key = format(d, 'yyyy-MM');
          const entry = monthMap.get(key) || { projet: 0, horsProjet: 0, byTrade: {} };
          const amt = Number(p.total_amount) || 0;
          if (p.budget_id) entry.projet += amt; else entry.horsProjet += amt;
          const s = supplierMap.get(p.supplier_id);
          const tradeName = s?.supplier_type?.name || 'Non classé';
          entry.byTrade[tradeName] = (entry.byTrade[tradeName] || 0) + amt;
          monthMap.set(key, entry);
        });
        return Array.from(monthMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, data]) => {
            const [y, m] = key.split('-');
            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            return {
              month: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`,
              sortKey: key,
              ...data,
            };
          });
      };

      const monthlyData = buildMonthly(posN);
      const monthlyDataN1 = buildMonthly(posN1);

      // Unique suppliers this year
      const uniqueSuppliers = new Set(posN.map((p: any) => p.supplier_id));

      // Trades list
      const trades = byTrade.map(t => ({ name: t.name, color: t.color }));

      return {
        projectSplit,
        byTrade,
        byPaymentMethod,
        monthlyData,
        monthlyDataN1,
        totalN: posN.reduce((s: number, p: any) => s + (Number(p.total_amount) || 0), 0),
        totalN1: posN1.reduce((s: number, p: any) => s + (Number(p.total_amount) || 0), 0),
        poCountN: posN.length,
        poCountN1: posN1.length,
        supplierCountN: uniqueSuppliers.size,
        trades,
      };
    },
  });
}
