import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useMonthlyMetrics } from '@/hooks/useReportsData';
import { Skeleton } from '@/components/ui/skeleton';

const RechartsResponsiveContainer = ResponsiveContainer as unknown as React.ComponentType<any>;
const RechartsLineChart = LineChart as unknown as React.ComponentType<any>;
const RechartsLine = Line as unknown as React.ComponentType<any>;
const RechartsXAxis = XAxis as unknown as React.ComponentType<any>;
const RechartsYAxis = YAxis as unknown as React.ComponentType<any>;
const RechartsCartesianGrid = CartesianGrid as unknown as React.ComponentType<any>;
const RechartsChartTooltip = ChartTooltip as unknown as React.ComponentType<any>;
const RechartsChartTooltipContent = ChartTooltipContent as unknown as React.ComponentType<any>;

interface MonthlyMetricsChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const MonthlyMetricsChart: React.FC<MonthlyMetricsChartProps> = ({ timeRange }) => {
  const { data, isLoading } = useMonthlyMetrics(timeRange);
  const [metrics, setMetrics] = useState({ bc: true, invoices: true, dueInvoices: true });

  const formatEuro = (value: number) => `${value.toLocaleString('fr-FR')} €`;

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground text-center py-10">Aucune donnée sur cette période.</p>;

  return (
    <div className="h-full">
      <div className="flex flex-wrap gap-2 mb-4">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={metrics.bc} onChange={() => setMetrics({ ...metrics, bc: !metrics.bc })} />
          <span className="text-sm">BC envoyés</span>
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={metrics.invoices} onChange={() => setMetrics({ ...metrics, invoices: !metrics.invoices })} />
          <span className="text-sm">Factures reçues</span>
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={metrics.dueInvoices} onChange={() => setMetrics({ ...metrics, dueInvoices: !metrics.dueInvoices })} />
          <span className="text-sm">Factures échues</span>
        </label>
      </div>

      <ChartContainer
        config={{
          'BC envoyés': { theme: { light: '#3b82f6', dark: '#3b82f6' } },
          'Factures reçues': { theme: { light: '#ef4444', dark: '#ef4444' } },
          'Factures échues': { theme: { light: '#f59e0b', dark: '#f59e0b' } },
        }}
        className="h-[calc(100%-40px)]"
      >
        <RechartsResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <RechartsCartesianGrid strokeDasharray="3 3" />
            <RechartsXAxis dataKey="name" />
            <RechartsYAxis tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k €`} />
            <RechartsChartTooltip content={<RechartsChartTooltipContent formatter={(value: unknown) => formatEuro(Number(value))} />} />
            {metrics.bc && <RechartsLine type="monotone" dataKey="BC envoyés" stroke="var(--color-BC envoyés)" strokeWidth={2} activeDot={{ r: 8 }} />}
            {metrics.invoices && <RechartsLine type="monotone" dataKey="Factures reçues" stroke="var(--color-Factures reçues)" strokeWidth={2} />}
            {metrics.dueInvoices && <RechartsLine type="monotone" dataKey="Factures échues" stroke="var(--color-Factures échues)" strokeWidth={2} />}
          </RechartsLineChart>
        </RechartsResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default MonthlyMetricsChart;
