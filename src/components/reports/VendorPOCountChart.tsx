
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

// Mock data for top vendors by PO count
const getMockData = (timeRange: string) => {
  // In a real application, this would be fetched from an API based on the timeRange
  return [
    { name: 'Accenture', value: 24 },
    { name: 'Microsoft', value: 18 },
    { name: 'Dell', value: 15 },
    { name: 'Amazon Web Services', value: 12 },
    { name: 'Oracle', value: 10 },
    { name: 'Salesforce', value: 9 },
    { name: 'Google Cloud', value: 8 },
    { name: 'IBM', value: 7 },
    { name: 'Samsung', value: 6 },
    { name: 'Adobe', value: 5 },
  ].sort((a, b) => b.value - a.value);
};

interface VendorPOCountChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const VendorPOCountChart: React.FC<VendorPOCountChartProps> = ({ timeRange }) => {
  const data = getMockData(timeRange);
  
  return (
    <ChartContainer 
      config={{ 
        count: { 
          theme: { 
            light: '#64748b',
            dark: '#64748b' 
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
                  formatter={(value) => `${value} BC`}
                />
              ) : null
            } 
          />
          <Bar dataKey="value" fill="var(--color-count)">
            <LabelList dataKey="value" position="right" formatter={(value) => `${value} BC`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default VendorPOCountChart;
