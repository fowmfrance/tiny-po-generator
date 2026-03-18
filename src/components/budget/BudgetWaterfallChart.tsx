import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface BudgetWaterfallChartProps {
  currency: string;
  initialAmount: number;
  sentAmount: number;       // Provisionné (BC émis)
  receivedAmount: number;   // Facturé
  availableAmount: number;  // Disponible
}

const formatMoney = (currency: string, amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface WaterfallItem {
  name: string;
  value: number;
  start: number;
  end: number;
  fill: string;
  tooltip: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const item = payload[0].payload as WaterfallItem;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="text-muted-foreground">{item.tooltip}</p>
    </div>
  );
};

export function BudgetWaterfallChart({
  currency,
  initialAmount,
  sentAmount,
  receivedAmount,
  availableAmount,
}: BudgetWaterfallChartProps) {
  const notYetInvoiced = Math.max(0, sentAmount - receivedAmount);

  const data: WaterfallItem[] = [
    {
      name: 'Budget initial',
      value: initialAmount,
      start: 0,
      end: initialAmount,
      fill: 'hsl(var(--primary))',
      tooltip: `Enveloppe totale : ${formatMoney(currency, initialAmount)}`,
    },
    {
      name: 'Facturé',
      value: -receivedAmount,
      start: initialAmount,
      end: initialAmount - receivedAmount,
      fill: 'hsl(142, 71%, 45%)',  // green
      tooltip: `Montant déjà facturé par les fournisseurs : ${formatMoney(currency, receivedAmount)}`,
    },
    {
      name: 'Engagé (non facturé)',
      value: -notYetInvoiced,
      start: initialAmount - receivedAmount,
      end: initialAmount - receivedAmount - notYetInvoiced,
      fill: 'hsl(38, 92%, 50%)',   // amber
      tooltip: `BC émis mais pas encore facturés : ${formatMoney(currency, notYetInvoiced)}`,
    },
    {
      name: 'Disponible',
      value: availableAmount,
      start: 0,
      end: availableAmount,
      fill: 'hsl(var(--primary) / 0.3)',
      tooltip: `Reste à engager : ${formatMoney(currency, availableAmount)}`,
    },
  ];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
          barCategoryGap="20%"
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatMoney(currency, v)}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          {/* Invisible bar to create the "floating" effect */}
          <Bar dataKey="start" stackId="waterfall" fill="transparent" radius={0} />
          {/* Visible bar showing the actual segment */}
          <Bar
            dataKey={(entry: WaterfallItem) => Math.abs(entry.end - entry.start)}
            stackId="waterfall"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(142, 71%, 45%)' }} />
          Facturé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(38, 92%, 50%)' }} />
          Engagé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
          Disponible
        </span>
      </div>
    </div>
  );
}
