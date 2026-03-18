import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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

const RechartsResponsiveContainer = ResponsiveContainer as unknown as React.ComponentType<any>;
const RechartsBarChart = BarChart as unknown as React.ComponentType<any>;
const RechartsCartesianGrid = CartesianGrid as unknown as React.ComponentType<any>;
const RechartsXAxis = XAxis as unknown as React.ComponentType<any>;
const RechartsYAxis = YAxis as unknown as React.ComponentType<any>;
const RechartsReferenceLine = ReferenceLine as unknown as React.ComponentType<any>;
const RechartsBar = Bar as unknown as React.ComponentType<any>;
const RechartsChartTooltip = ChartTooltip as unknown as React.ComponentType<any>;
const RechartsChartTooltipContent = ChartTooltipContent as unknown as React.ComponentType<any>;

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
      <>
        <RechartsResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <RechartsCartesianGrid strokeDasharray="3 3" />
            <RechartsXAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <RechartsYAxis tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k €`} />
            <RechartsChartTooltip
              content={
                <RechartsChartTooltipContent
                  formatter={(value: unknown) => formatEuro(Number(value))}
                />
              }
            />
            <RechartsReferenceLine y={0} stroke="#000" />
            <RechartsBar
              dataKey="value"
              fill="var(--color-positive)"
              className="fill-[var(--color-positive)] [&[value^='-']]:fill-[var(--color-negative)]"
            />
          </RechartsBarChart>
        </RechartsResponsiveContainer>
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
