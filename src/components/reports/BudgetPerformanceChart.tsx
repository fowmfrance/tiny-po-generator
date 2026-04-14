import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useBudgetPerformance } from '@/hooks/useReportsData';
import { Skeleton } from '@/components/ui/skeleton';

const RechartsResponsiveContainer = ResponsiveContainer as unknown as React.ComponentType<any>;
const RechartsBarChart = BarChart as unknown as React.ComponentType<any>;
const RechartsCartesianGrid = CartesianGrid as unknown as React.ComponentType<any>;
const RechartsXAxis = XAxis as unknown as React.ComponentType<any>;
const RechartsYAxis = YAxis as unknown as React.ComponentType<any>;
const RechartsReferenceLine = ReferenceLine as unknown as React.ComponentType<any>;
const RechartsBar = Bar as unknown as React.ComponentType<any>;
const RechartsChartTooltip = ChartTooltip as unknown as React.ComponentType<any>;
const RechartsChartTooltipContent = ChartTooltipContent as unknown as React.ComponentType<any>;

interface BudgetPerformanceChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const BudgetPerformanceChart: React.FC<BudgetPerformanceChartProps> = ({ timeRange }) => {
  const { data, isLoading } = useBudgetPerformance(timeRange);

  const formatEuro = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toLocaleString('fr-FR')} €`;
  };

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground text-center py-10">Aucun budget actif.</p>;

  return (
    <ChartContainer
      config={{
        positive: { theme: { light: '#22c55e', dark: '#22c55e' } },
        negative: { theme: { light: '#ef4444', dark: '#ef4444' } },
      }}
      className="h-80"
    >
      <>
        <RechartsResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <RechartsCartesianGrid strokeDasharray="3 3" />
            <RechartsXAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
            <RechartsYAxis tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k €`} />
            <RechartsChartTooltip content={<RechartsChartTooltipContent formatter={(value: unknown) => formatEuro(Number(value))} />} />
            <RechartsReferenceLine y={0} stroke="#000" />
            <RechartsBar dataKey="value" fill="var(--color-positive)" />
          </RechartsBarChart>
        </RechartsResponsiveContainer>
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#22c55e] mr-2"></div>
            <span className="text-sm">Solde positif (sous-budget)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#ef4444] mr-2"></div>
            <span className="text-sm">Dépassement</span>
          </div>
        </div>
      </>
    </ChartContainer>
  );
};

export default BudgetPerformanceChart;
