import React from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useVendorSpending } from '@/hooks/useReportsData';
import { Skeleton } from '@/components/ui/skeleton';

interface VendorSpendingChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const VendorSpendingChart: React.FC<VendorSpendingChartProps> = ({ timeRange }) => {
  const { data, isLoading } = useVendorSpending(timeRange);

  const formatEuro = (value: number) => `${value.toLocaleString('fr-FR')} €`;

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground text-center py-10">Aucune donnée sur cette période.</p>;

  return (
    <ChartContainer config={{ spending: { theme: { light: '#3b82f6', dark: '#3b82f6' } } }} className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 120, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
          <XAxis type="number" tickFormatter={formatEuro} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatEuro(Number(value))} />} />
          <Bar dataKey="value" fill="var(--color-spending)">
            <LabelList dataKey="value" position="right" formatter={formatEuro} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default VendorSpendingChart;
