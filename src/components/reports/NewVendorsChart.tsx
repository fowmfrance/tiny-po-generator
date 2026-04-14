import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useNewVendors } from '@/hooks/useReportsData';
import { Skeleton } from '@/components/ui/skeleton';

interface NewVendorsChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const NewVendorsChart: React.FC<NewVendorsChartProps> = ({ timeRange }) => {
  const { data, isLoading } = useNewVendors(timeRange);

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground text-center py-10">Aucun nouveau fournisseur sur cette période.</p>;

  return (
    <div className="h-full">
      <ChartContainer
        config={data.reduce((acc, item) => ({ ...acc, [item.name]: { color: item.color, label: item.name } }), {})}
        className="h-[calc(100%-60px)]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => [`${value} fournisseurs`, name]} />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-sm">{item.name}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewVendorsChart;
