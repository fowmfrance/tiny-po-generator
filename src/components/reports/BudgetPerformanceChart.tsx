
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

// Mock data for budget performance
const getMockData = (timeRange: string) => {
  // In a real application, this would be fetched from an API based on the timeRange
  return [
    { name: 'Marketing Q1', value: 12000 },
    { name: 'IT Infrastructure', value: -8000 },
    { name: 'Formation', value: 5000 },
    { name: 'R&D Projet A', value: -15000 },
    { name: 'Recrutement', value: 7500 },
    { name: 'Logiciels', value: -4000 },
    { name: 'Consultants', value: 9000 },
    { name: 'Événements', value: -11000 },
    { name: 'Support Client', value: 6500 },
    { name: 'Matériel Bureau', value: 3000 },
  ];
};

interface BudgetPerformanceChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const BudgetPerformanceChart: React.FC<BudgetPerformanceChartProps> = ({ timeRange }) => {
  const data = getMockData(timeRange);
  
  const formatEuro = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toLocaleString()} €`;
  };
  
  return (
    <ChartContainer
      config={{
        positive: { theme: { light: '#22c55e', dark: '#22c55e' } },
        negative: { theme: { light: '#ef4444', dark: '#ef4444' } },
      }}
      className="h-80"
    >
      {/* Using a Fragment to wrap multiple children */}
      <>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={60} 
            />
            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`} />
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
            <ReferenceLine y={0} stroke="#000" />
            <Bar 
              dataKey="value" 
              fill="var(--color-positive)"
              className="fill-[var(--color-positive)] [&[value^='-']]:fill-[var(--color-negative)]"
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#22c55e] mr-2"></div>
            <span className="text-sm">Ajustements favorables</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#ef4444] mr-2"></div>
            <span className="text-sm">Dépassements validés</span>
          </div>
        </div>
      </>
    </ChartContainer>
  );
};

export default BudgetPerformanceChart;
