import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface BudgetWaterfallChartProps {
  currency: string;
  initialAmount: number;
  sentAmount: number;
  receivedAmount: number;
  availableAmount: number;
}

const fmt = (currency: string, amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

interface WaterfallItem {
  name: string;
  invisible: number;
  visible: number;
  fill: string;
  tooltip: string;
  amount: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as WaterfallItem;
  if (!item) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="text-muted-foreground">{item.tooltip}</p>
    </div>
  );
};

const COLORS = {
  initial: 'hsl(221, 83%, 53%)',    // blue
  invoiced: 'hsl(142, 71%, 45%)',   // green
  committed: 'hsl(38, 92%, 50%)',   // amber
  available: 'hsl(221, 83%, 80%)',  // light blue
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
      invisible: 0,
      visible: initialAmount,
      fill: COLORS.initial,
      tooltip: `Enveloppe totale : ${fmt(currency, initialAmount)}`,
      amount: fmt(currency, initialAmount),
    },
    {
      name: 'Facturé',
      invisible: initialAmount - receivedAmount,
      visible: receivedAmount,
      fill: COLORS.invoiced,
      tooltip: `Déjà facturé par les fournisseurs : ${fmt(currency, receivedAmount)}`,
      amount: fmt(currency, receivedAmount),
    },
    {
      name: 'Engagé',
      invisible: availableAmount,
      visible: notYetInvoiced,
      fill: COLORS.committed,
      tooltip: `BC émis, en attente de facturation : ${fmt(currency, notYetInvoiced)}`,
      amount: fmt(currency, notYetInvoiced),
    },
    {
      name: 'Disponible',
      invisible: 0,
      visible: availableAmount,
      fill: COLORS.available,
      tooltip: `Reste à engager : ${fmt(currency, availableAmount)}`,
      amount: fmt(currency, availableAmount),
    },
  ];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 5, left: 5, bottom: 5 }}
          barCategoryGap="25%"
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="invisible" stackId="waterfall" fill="transparent" isAnimationActive={false} />
          <Bar
            dataKey="visible"
            stackId="waterfall"
            radius={[4, 4, 0, 0]}
            label={({ x, y, width, index }: any) => {
              const item = data[index];
              return (
                <text
                  x={x + width / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="hsl(var(--foreground))"
                >
                  {item.amount}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.invoiced }} />
          Facturé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.committed }} />
          Engagé (non facturé)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.available }} />
          Disponible
        </span>
      </div>
    </div>
  );
}
