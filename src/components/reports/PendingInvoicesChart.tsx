import React from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { usePendingInvoices } from '@/hooks/useReportsData';
import { Skeleton } from '@/components/ui/skeleton';

interface PendingInvoicesChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const PendingInvoicesChart: React.FC<PendingInvoicesChartProps> = ({ timeRange }) => {
  const { data, isLoading } = usePendingInvoices(timeRange);

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground text-center py-10">Aucune facture en attente.</p>;

  return (
    <ChartContainer config={{ pending: { theme: { light: '#f59e0b', dark: '#f59e0b' } } }} className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 120, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value} factures en attente`} />} />
          <Bar dataKey="value" fill="var(--color-pending)">
            <LabelList dataKey="value" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default PendingInvoicesChart;
