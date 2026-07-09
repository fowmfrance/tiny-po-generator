import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupplierDashboard, PeriodKey } from '@/hooks/useSupplierDashboard';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Line, ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText, Calendar } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RePieChart = PieChart as unknown as React.ComponentType<any>;
const RePie = Pie as unknown as React.ComponentType<any>;
const ReCell = Cell as unknown as React.ComponentType<any>;
const ReComposedChart = ComposedChart as unknown as React.ComponentType<any>;
const ReBar = Bar as unknown as React.ComponentType<any>;
const ReLine = Line as unknown as React.ComponentType<any>;
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
  { key: 'Custom', label: 'Custom' },
];

const fmtE = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(v)
    .replace(/\u202F/g, ' ');

const pct = (v: number, t: number) => (t > 0 ? `${((v / t) * 100).toFixed(1)}%` : '—');

// Palette de charts Kiosco (terracotta en tête + tons terroir)
const KIOSCO_CHART = ['#D97757', '#B8853A', '#4A7C59', '#4A5568', '#9B3B2A', '#6B6860', '#C08A5E', '#8AA98F'];

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg" style={{ background: '#1A1914', color: '#FAF8F3' }}>
      <p className="text-xs font-semibold mb-1 opacity-70">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || p.fill || p.stroke }} />
          <span className="opacity-80">{p.name}</span>
          <span className="ml-auto font-mono font-semibold whitespace-nowrap">{fmtE(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg" style={{ background: '#1A1914', color: '#FAF8F3' }}>
      <div className="flex items-center gap-2 text-sm">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.payload?.fill || d.payload?.color }} />
        <span className="font-semibold">{d.name}</span>
      </div>
      <p className="font-mono font-bold text-base mt-1">{fmtE(d.value)}</p>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon: Icon, trend, hasComparison }: {
  title: string; value: string; subtitle?: string; icon: any;
  trend?: { value: number; label: string }; hasComparison?: boolean;
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
      {hasComparison && trend && (
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

const PeriodFilter = ({ selected, onChange, customFrom, customTo, onCustomFromChange, onCustomToChange }: {
  selected: PeriodKey; onChange: (p: PeriodKey) => void;
  customFrom: string; customTo: string;
  onCustomFromChange: (v: string) => void; onCustomToChange: (v: string) => void;
}) => (
  <div className="flex items-center gap-2 flex-wrap">
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <span className="text-xs text-muted-foreground px-2">Période</span>
      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            selected === key
              ? 'bg-brand text-brand-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background'
          )}
        >
          {label}
        </button>
      ))}
    </div>
    {selected === 'Custom' && (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            {customFrom && customTo ? `${customFrom} → ${customTo}` : 'Choisir dates'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 space-y-2" align="start">
          <div className="space-y-1">
            <Label className="text-xs">Du</Label>
            <Input type="date" value={customFrom} onChange={e => onCustomFromChange(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Au</Label>
            <Input type="date" value={customTo} onChange={e => onCustomToChange(e.target.value)} className="h-8 text-xs" />
          </div>
        </PopoverContent>
      </Popover>
    )}
  </div>
);

const SupplierDashboardTab: React.FC = () => {
  const [period, setPeriod] = useState<PeriodKey>('YTD');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const { data, isLoading } = useSupplierDashboard(period, customFrom, customTo);
  const [showByTrade, setShowByTrade] = useState(false);

  if (isLoading || !data) {
    return <div className="flex items-center justify-center p-12"><p className="text-muted-foreground">Chargement du dashboard…</p></div>;
  }

  const periodLabel = period === 'Tout' ? 'Total' : period === 'Custom' ? 'Custom' : period;
  const variation = data.hasComparison && data.totalPrev > 0 ? ((data.totalN - data.totalPrev) / data.totalPrev) * 100 : null;
  const poVariation = data.hasComparison && data.poCountPrev > 0 ? ((data.poCountN - data.poCountPrev) / data.poCountPrev) * 100 : null;

  const hasCA = data.monthlyData.some(m => m.caLinearise > 0);

  const barData = showByTrade
    ? data.monthlyData.map(m => ({ month: m.month, ...m.byTrade, 'CA linéarisé': m.caLinearise }))
    : data.monthlyData.map(m => ({ month: m.month, Projet: m.projet, 'Hors projet': m.horsProjet, 'CA linéarisé': m.caLinearise }));

  const barKeys = showByTrade
    ? data.trades.map(t => t.name)
    : ['Projet', 'Hors projet'];

  const barColors = showByTrade
    ? data.trades.reduce((acc, t) => ({ ...acc, [t.name]: t.color }), {} as Record<string, string>)
    : { Projet: '#D97757', 'Hors projet': '#6B6860' };

  const hasCumulative = data.cumulativeData.some(m => m.ca > 0 || m.chargesInternes > 0 || m.chargesExternes > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodFilter
          selected={period} onChange={setPeriod}
          customFrom={customFrom} customTo={customTo}
          onCustomFromChange={setCustomFrom} onCustomToChange={setCustomTo}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title={`Dépenses ${periodLabel}`}
          value={fmtE(data.totalN)}
          subtitle={data.hasComparison ? `N-1 : ${fmtE(data.totalPrev)}` : undefined}
          icon={TrendingUp}
          hasComparison={data.hasComparison}
          trend={variation !== null ? { value: variation, label: 'vs N-1' } : undefined}
        />
        <KPICard
          title="Bons de commande"
          value={String(data.poCountN)}
          subtitle={data.hasComparison ? `N-1 : ${data.poCountPrev}` : undefined}
          icon={FileText}
          hasComparison={data.hasComparison}
          trend={poVariation !== null ? { value: poVariation, label: 'vs N-1' } : undefined}
        />
        <KPICard
          title="Fournisseurs actifs"
          value={String(data.supplierCountN)}
          subtitle={data.hasComparison ? `N-1 : ${data.supplierCountPrev}` : undefined}
          icon={Users}
          hasComparison={data.hasComparison}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutCard title="Projet vs Hors projet" data={data.projectSplit} total={data.totalN} />
        <DonutCard title="Par métier fournisseur" data={data.byTrade} total={data.totalN} />
        <DonutCard title="Par moyen de paiement" data={data.byPaymentMethod} total={data.totalN} />
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Dépenses mensuelles</CardTitle>
          <div className="flex items-center gap-4">
            {hasCA && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-4 h-0.5 bg-emerald-500 rounded" />
                CA linéarisé
              </div>
            )}
            <div className="flex items-center gap-2">
              <Label htmlFor="trade-toggle" className="text-xs text-muted-foreground">Détail par métier</Label>
              <Switch id="trade-toggle" checked={showByTrade} onCheckedChange={setShowByTrade} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ReResponsiveContainer width="100%" height="100%">
              <ReComposedChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <ReCartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1D6" />
                <ReXAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6860' }} axisLine={false} tickLine={false} />
                <ReYAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6B6860' }} axisLine={false} tickLine={false} />
                <ReTooltip content={<DarkTooltip />} />
                {barKeys.map((key, i) => (
                  <ReBar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={(barColors as any)[key] || KIOSCO_CHART[i % KIOSCO_CHART.length]}
                    radius={i === barKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
                {hasCA && (
                  <ReLine
                    type="monotone"
                    dataKey="CA linéarisé"
                    stroke="#4A7C59"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#4A7C59' }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </ReComposedChart>
            </ReResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {hasCumulative && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Marge cumulée (CA − Charges)</CardTitle>
            <p className="text-xs text-muted-foreground">CA linéarisé des projets externes − Charges internes (linéarisées) − Charges externes (date BC)</p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ReResponsiveContainer width="100%" height="100%">
                <ReComposedChart data={data.cumulativeData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <ReCartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1D6" />
                  <ReXAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6860' }} axisLine={false} tickLine={false} />
                  <ReYAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6B6860' }} axisLine={false} tickLine={false} />
                  <ReTooltip content={<DarkTooltip />} />
                  <ReBar dataKey="ca" name="CA" fill="#4A7C59" radius={[4, 4, 0, 0]} />
                  <ReBar dataKey="chargesInternes" name="Charges internes" fill="#B8853A" radius={[4, 4, 0, 0]} />
                  <ReBar dataKey="chargesExternes" name="Charges externes" fill="#9B3B2A" radius={[4, 4, 0, 0]} />
                  <ReLine
                    type="monotone"
                    dataKey="cumul"
                    name="Cumul"
                    stroke="#D97757"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#D97757' }}
                    activeDot={{ r: 5 }}
                  />
                </ReComposedChart>
              </ReResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupplierDashboardTab;
