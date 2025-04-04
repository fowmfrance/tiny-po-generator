
import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip
} from 'recharts';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';

// Mock data for new vendors by category
const getMockData = (timeRange: string) => {
  // In a real application, this would be fetched from an API based on the timeRange
  return [
    { name: 'Conseil', value: 12, color: '#3b82f6' },
    { name: 'Graphisme', value: 8, color: '#ef4444' },
    { name: 'Outils', value: 10, color: '#22c55e' },
    { name: 'Marketing', value: 5, color: '#f59e0b' },
    { name: 'IT', value: 7, color: '#8b5cf6' },
    { name: 'Autre', value: 3, color: '#64748b' },
  ];
};

interface NewVendorsChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const NewVendorsChart: React.FC<NewVendorsChartProps> = ({ timeRange }) => {
  const data = getMockData(timeRange);
  const COLORS = data.map(item => item.color);
  
  return (
    <ChartContainer
      config={data.reduce((acc, item) => ({
        ...acc,
        [item.name]: { color: item.color, label: item.name }
      }), {})}
      className="h-80"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={
              ({ active, payload }) => active && payload && payload.length ? (
                <ChartTooltipContent 
                  active={active}
                  payload={payload}
                  formatter={(value, name) => [`${value} fournisseurs`, name]}
                />
              ) : null
            }
          />
          <Legend 
            content={(props) => {
              // Type assertion to handle the complexity of recharts types
              return <ChartLegendContent {...props as any} />;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default NewVendorsChart;
