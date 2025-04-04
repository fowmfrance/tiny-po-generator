
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

// Mock data for vendors with pending invoices
const getMockData = (timeRange: string) => {
  // In a real application, this would be fetched from an API based on the timeRange
  return [
    { name: 'Accenture', value: 8 },
    { name: 'Microsoft', value: 6 },
    { name: 'Samsung', value: 5 },
    { name: 'Dell', value: 4 },
    { name: 'Oracle', value: 4 },
    { name: 'Amazon Web Services', value: 3 },
    { name: 'IBM', value: 3 },
    { name: 'Google Cloud', value: 2 },
    { name: 'Salesforce', value: 2 },
    { name: 'Adobe', value: 1 },
  ].sort((a, b) => b.value - a.value);
};

interface PendingInvoicesChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const PendingInvoicesChart: React.FC<PendingInvoicesChartProps> = ({ timeRange }) => {
  const data = getMockData(timeRange);
  
  return (
    <ChartContainer 
      config={{ 
        pending: { 
          theme: { 
            light: '#f59e0b',
            dark: '#f59e0b' 
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
            tickFormatter={(value) => `${value}`}
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
                  formatter={(value) => `${value} factures en attente`}
                />
              ) : null
            } 
          />
          <Bar dataKey="value" fill="var(--color-pending)">
            <LabelList dataKey="value" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default PendingInvoicesChart;
