import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { format, subMonths } from 'date-fns';

// Generate mock data for monthly metrics
const getMockData = (timeRange: string) => {
  // Determine how many months to show based on timeRange
  let monthsCount = 3;
  switch (timeRange) {
    case '1m': monthsCount = 1; break;
    case '3m': monthsCount = 3; break;
    case '6m': monthsCount = 6; break;
    case '1y': monthsCount = 12; break;
  }

  const now = new Date();
  const data = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const monthName = format(date, 'MMM yyyy'); // e.g. "Jan 2023"

    const baseValue = 100000 - (i * 5000) + Math.random() * 20000;
    const invoicesReceived = baseValue * 0.85 + Math.random() * 10000;
    const dueInvoices = baseValue * 0.6 + Math.random() * 10000;
    const recognizedCharges = baseValue * 0.75 + Math.random() * 10000;

    data.push({
      name: monthName,
      'BC envoyés': Math.round(baseValue / 1000) * 1000,
      'Factures reçues': Math.round(invoicesReceived / 1000) * 1000,
      'Factures échues': Math.round(dueInvoices / 1000) * 1000,
      'Charges reconnues': Math.round(recognizedCharges / 1000) * 1000,
    });
  }

  return data;
};

interface MonthlyMetricsChartProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const RechartsResponsiveContainer = ResponsiveContainer as unknown as React.ComponentType<any>;
const RechartsLineChart = LineChart as unknown as React.ComponentType<any>;
const RechartsLine = Line as unknown as React.ComponentType<any>;
const RechartsXAxis = XAxis as unknown as React.ComponentType<any>;
const RechartsYAxis = YAxis as unknown as React.ComponentType<any>;
const RechartsCartesianGrid = CartesianGrid as unknown as React.ComponentType<any>;
const RechartsChartTooltip = ChartTooltip as unknown as React.ComponentType<any>;
const RechartsChartTooltipContent = ChartTooltipContent as unknown as React.ComponentType<any>;

const MonthlyMetricsChart: React.FC<MonthlyMetricsChartProps> = ({ timeRange }) => {
  const data = getMockData(timeRange);
  const [metrics, setMetrics] = useState({
    bc: true,
    invoices: true,
    dueInvoices: true,
    charges: true,
  });

  const formatEuro = (value: number) => {
    return `${value.toLocaleString()} €`;
  };

  return (
    <div className="h-full">
      <div className="flex flex-wrap gap-2 mb-4">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={metrics.bc}
            onChange={() => setMetrics({ ...metrics, bc: !metrics.bc })}
          />
          <span className="text-sm">BC envoyés</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={metrics.invoices}
            onChange={() => setMetrics({ ...metrics, invoices: !metrics.invoices })}
          />
          <span className="text-sm">Factures reçues</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={metrics.dueInvoices}
            onChange={() => setMetrics({ ...metrics, dueInvoices: !metrics.dueInvoices })}
          />
          <span className="text-sm">Factures échues</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={metrics.charges}
            onChange={() => setMetrics({ ...metrics, charges: !metrics.charges })}
          />
          <span className="text-sm">Charges reconnues</span>
        </label>
      </div>

      <ChartContainer
        config={{
          'BC envoyés': { theme: { light: '#3b82f6', dark: '#3b82f6' } },
          'Factures reçues': { theme: { light: '#ef4444', dark: '#ef4444' } },
          'Factures échues': { theme: { light: '#f59e0b', dark: '#f59e0b' } },
          'Charges reconnues': { theme: { light: '#8b5cf6', dark: '#8b5cf6' } },
        }}
        className="h-[calc(100%-40px)]"
      >
        <RechartsResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <RechartsCartesianGrid strokeDasharray="3 3" />
            <RechartsXAxis dataKey="name" />
            <RechartsYAxis tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k €`} />
            <RechartsChartTooltip
              content={
                <RechartsChartTooltipContent
                  formatter={(value: unknown) => formatEuro(Number(value))}
                />
              }
            />
            {metrics.bc && (
              <RechartsLine
                type="monotone"
                dataKey="BC envoyés"
                stroke="var(--color-BC envoyés)"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            )}
            {metrics.invoices && (
              <RechartsLine
                type="monotone"
                dataKey="Factures reçues"
                stroke="var(--color-Factures reçues)"
                strokeWidth={2}
              />
            )}
            {metrics.dueInvoices && (
              <RechartsLine
                type="monotone"
                dataKey="Factures échues"
                stroke="var(--color-Factures échues)"
                strokeWidth={2}
              />
            )}
            {metrics.charges && (
              <RechartsLine
                type="monotone"
                dataKey="Charges reconnues"
                stroke="var(--color-Charges reconnues)"
                strokeWidth={2}
              />
            )}
          </RechartsLineChart>
        </RechartsResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default MonthlyMetricsChart;
