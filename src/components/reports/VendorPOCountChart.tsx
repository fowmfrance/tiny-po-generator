import React from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useVendorPOCount } from '@/hooks/useReportsData';
import { Skeleton } from '@/components/ui/skeleton';

interface VendorPOCountChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const VendorPOCountChart: React.FC<VendorPOCountChartProps> = ({ timeRange }) => {
  const { data, isLoading } = useVendorPOCount(timeRange);

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground text-center py-10">Aucune donnée sur cette période.</p>;

  return (
    <ChartContainer config={{ count: { theme: { light: '#64748b', dark: '#64748b' } } }} className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 120, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value} BC`} />} />
          <Bar dataKey="value" fill="var(--color-count)">
            <LabelList dataKey="value" position="right" formatter={(value: number) => `${value} BC`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default VendorPOCountChart;
