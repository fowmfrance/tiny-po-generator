
import React from 'react';
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

// Mock data for top vendors by spending
const getMockData = (timeRange: string) => {
  // In a real application, this would be fetched from an API based on the timeRange
  return [
    { name: 'Accenture', value: 85000 },
    { name: 'Microsoft', value: 68000 },
    { name: 'Amazon Web Services', value: 62000 },
    { name: 'Oracle', value: 54000 },
    { name: 'Samsung', value: 48000 },
    { name: 'Dell', value: 42000 },
    { name: 'Google Cloud', value: 38000 },
    { name: 'Salesforce', value: 34000 },
    { name: 'IBM', value: 30000 },
    { name: 'Adobe', value: 28000 },
  ].sort((a, b) => b.value - a.value);
};

interface VendorSpendingChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const VendorSpendingChart: React.FC<VendorSpendingChartProps> = ({ timeRange }) => {
  const data = getMockData(timeRange);
  
  const formatEuro = (value: number) => {
    return `${value.toLocaleString()} €`;
  };
  
  return (
    <ChartContainer 
      config={{ 
        spending: { 
          theme: { 
            light: '#3b82f6',
            dark: '#3b82f6' 
          } 
        } 
      }}
      className="h-80"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 120,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            tickFormatter={formatEuro}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            content={
              ({ active, payload }) => active && payload && payload.length ? (
                <ChartTooltipContent 
                  active={active}
                  payload={payload}
                  formatter={(value) => formatEuro(Number(value))}
                />
              ) : null
            } 
          />
          <Bar dataKey="value" fill="var(--color-spending)">
            <LabelList dataKey="value" position="right" formatter={formatEuro} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default VendorSpendingChart;
