import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupplierDashboard, PeriodKey } from '@/hooks/useSupplierDashboard';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const RePieChart = PieChart as unknown as React.ComponentType<any>;
const RePie = Pie as unknown as React.ComponentType<any>;
const ReCell = Cell as unknown as React.ComponentType<any>;
const ReBarChart = BarChart as unknown as React.ComponentType<any>;
const ReBar = Bar as unknown as React.ComponentType<any>;
const ReXAxis = XAxis as unknown as React.ComponentType<any>;
const ReYAxis = YAxis as unknown as React.ComponentType<any>;
const ReCartesianGrid = CartesianGrid as unknown as React.ComponentType<any>;
const ReResponsiveContainer = ResponsiveContainer as unknown as React.ComponentType<any>;
const ReTooltip = Tooltip as unknown as React.ComponentType<any>;

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '12M', label: '12M' },
  { key: 'LTM', label: 'LTM' },
  { key: 'YTD', label: 'YTD' },
  { key: 'Tout', label: 'Tout' },
];

const fmtE = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(v)
    .replace(/\u202F/g, ' ');

const pct = (v: number, t: number) => (t > 0 ? `${((v / t) * 100).toFixed(1)}%` : '—');

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg" style={{ background: '#1a1a2e', color: '#fff' }}>
      <p className="text-xs font-semibold mb-1 opacity-70">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="opacity-80">{p.name}</span>
          <span className="ml-auto font-mono font-semibold">{fmtE(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg" style={{ background: '#1a1a2e', color: '#fff' }}>
      <div className="flex items-center gap-2 text-sm">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.payload?.fill || d.payload?.color }} />
        <span className="font-semibold">{d.name}</span>
      </div>
      <p className="font-mono font-bold text-base mt-1">{fmtE(d.value)}</p>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string; subtitle?: string; icon: any; trend?: { value: number; label: string };
}) => (
  <Card>
    <CardContent className="pt-5 pb-4 px-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold font-mono">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.value >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
        </div>
      )}
    </CardContent>
  </Card>
);

const DonutCard = ({ title, data, total }: { title: string; data: { name: string; value: number; color: string }[]; total: number }) => (
  <Card className="h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex items-center gap-4">
      <div className="w-[140px] h-[140px] flex-shrink-0">
        <ReResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <RePie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
              {data.map((d: any, i: number) => (
                <ReCell key={i} fill={d.color} />
              ))}
            </RePie>
            <ReTooltip content={<DonutTooltip />} />
          </RePieChart>
        </ReResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        {data.slice(0, 6).map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="truncate text-muted-foreground">{d.name}</span>
            <span className="ml-auto font-mono font-medium whitespace-nowrap">{pct(d.value, total)}</span>
          </div>
        ))}
        {data.length > 6 && (
          <p className="text-xs text-muted-foreground">+{data.length - 6} autres</p>
        )}
      </div>
    </CardContent>
  </Card>
);

const PeriodFilter = ({ selected, onChange }: { selected: PeriodKey; onChange: (p: PeriodKey) => void }) => (
  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
    <span className="text-xs text-muted-foreground px-2">Période</span>
    {PERIODS.map(({ key, label }) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
          selected === key
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background'
        )}
      >
        {label}
      </button>
    ))}
  </div>
);

const SupplierDashboardTab: React.FC = () => {
  const [period, setPeriod] = useState<PeriodKey>('YTD');
  const { data, isLoading } = useSupplierDashboard(period);
  const [showByTrade, setShowByTrade] = useState(false);

  if (isLoading || !data) {
    return <div className="flex items-center justify-center p-12"><p className="text-muted-foreground">Chargement du dashboard…</p></div>;
  }

  const periodLabel = period === 'Tout' ? 'Total' : period;
  const variation = data.totalPrev > 0 ? ((data.totalN - data.totalPrev) / data.totalPrev) * 100 : null;
  const poVariation = data.poCountPrev > 0 ? ((data.poCountN - data.poCountPrev) / data.poCountPrev) * 100 : null;

  const barData = showByTrade
    ? data.monthlyData.map(m => ({ month: m.month, ...m.byTrade }))
    : data.monthlyData.map(m => ({ month: m.month, Projet: m.projet, 'Hors projet': m.horsProjet }));

  const barKeys = showByTrade
    ? data.trades.map(t => t.name)
    : ['Projet', 'Hors projet'];

  const barColors = showByTrade
    ? data.trades.reduce((acc, t) => ({ ...acc, [t.name]: t.color }), {} as Record<string, string>)
    : { Projet: '#3B82F6', 'Hors projet': '#94A3B8' };

  return (
    <div className="space-y-6">
      {/* Period filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodFilter selected={period} onChange={setPeriod} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title={`Dépenses ${periodLabel}`}
          value={fmtE(data.totalN)}
          subtitle={`Période préc. : ${fmtE(data.totalPrev)}`}
          icon={TrendingUp}
          trend={variation !== null ? { value: variation, label: 'vs préc.' } : undefined}
        />
        <KPICard
          title="Bons de commande"
          value={String(data.poCountN)}
          subtitle={`Période préc. : ${data.poCountPrev}`}
          icon={FileText}
          trend={poVariation !== null ? { value: poVariation, label: 'vs préc.' } : undefined}
        />
        <KPICard
          title="Fournisseurs actifs"
          value={String(data.supplierCountN)}
          subtitle={`Période préc. : ${data.supplierCountPrev}`}
          icon={Users}
        />
      </div>

      {/* Donut charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutCard title="Projet vs Hors projet" data={data.projectSplit} total={data.totalN} />
        <DonutCard title="Par métier fournisseur" data={data.byTrade} total={data.totalN} />
        <DonutCard title="Par moyen de paiement" data={data.byPaymentMethod} total={data.totalN} />
      </div>

      {/* Monthly bar chart */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Dépenses mensuelles</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="trade-toggle" className="text-xs text-muted-foreground">Détail par métier</Label>
            <Switch id="trade-toggle" checked={showByTrade} onCheckedChange={setShowByTrade} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ReResponsiveContainer width="100%" height="100%">
              <ReBarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <ReCartesianGrid strokeDasharray="3 3" vertical={false} />
                <ReXAxis dataKey="month" tick={{ fontSize: 11 }} />
                <ReYAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <ReTooltip content={<DarkTooltip />} />
                {barKeys.map((key, i) => (
                  <ReBar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={(barColors as any)[key] || `hsl(${i * 30}, 60%, 50%)`}
                    radius={i === barKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </ReBarChart>
            </ReResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierDashboardTab;
