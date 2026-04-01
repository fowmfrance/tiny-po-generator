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
  label: string;
  isDashed?: boolean;
}

const RechartsResponsiveContainer = ResponsiveContainer as unknown as React.ComponentType<any>;
const RechartsBarChart = BarChart as unknown as React.ComponentType<any>;
const RechartsXAxis = XAxis as unknown as React.ComponentType<any>;
const RechartsYAxis = YAxis as unknown as React.ComponentType<any>;
const RechartsTooltip = Tooltip as unknown as React.ComponentType<any>;
const RechartsBar = Bar as unknown as React.ComponentType<any>;
const RechartsCell = Cell as unknown as React.ComponentType<any>;

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
  initial: 'hsl(221, 83%, 53%)',
  invoiced: 'hsl(0, 72%, 51%)',
  committed: 'hsl(25, 95%, 53%)',
  available: 'hsl(221, 83%, 80%)',
};

// Custom bar shape that renders dashed outline when amount is 0
const DashedBarShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload?.isDashed) {
    return <rect x={x} y={y} width={width} height={height} fill={payload?.fill || 'transparent'} rx={4} />;
  }
  // For zero-value bars, draw a dashed outline at the full initial height
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="transparent"
      stroke={COLORS.invoiced}
      strokeWidth={1.5}
      strokeDasharray="4 3"
      rx={4}
    />
  );
};

export function BudgetWaterfallChart({
  currency,
  initialAmount,
  sentAmount,
  receivedAmount,
  availableAmount,
}: BudgetWaterfallChartProps) {
  const invoicedAmount = receivedAmount;
  const committedAmount = Math.max(0, sentAmount - receivedAmount);

  // When invoiced is 0, show a dashed bar at the same height as initial
  const isInvoicedZero = invoicedAmount === 0;

  // Waterfall cascade logic:
  // Bar 1: Initial — full bar from 0 to initialAmount
  // Bar 2: Facturé — if 0, dashed outline at initialAmount height; else subtract from top
  // Bar 3: Engagé — hangs below facturé, from (initialAmount - invoicedAmount - committedAmount) to (initialAmount - invoicedAmount)
  // Bar 4: Disponible — from 0 to availableAmount, top aligns with bottom of engagé

  // After initial, each step subtracts from the running total:
  // Level after invoiced = initialAmount - invoicedAmount
  // Level after committed = initialAmount - invoicedAmount - committedAmount = availableAmount
  const levelAfterInvoiced = initialAmount - invoicedAmount;

  const data: WaterfallItem[] = [
    {
      name: 'Budget',
      invisible: 0,
      visible: initialAmount,
      fill: COLORS.initial,
      tooltip: `Enveloppe totale : ${fmt(currency, initialAmount)}`,
      label: fmt(currency, initialAmount),
    },
    {
      name: 'Facturé',
      invisible: isInvoicedZero ? 0 : levelAfterInvoiced,
      visible: isInvoicedZero ? initialAmount : invoicedAmount,
      fill: isInvoicedZero ? 'transparent' : COLORS.invoiced,
      tooltip: `Montant facturé : −${fmt(currency, invoicedAmount)}`,
      label: fmt(currency, isInvoicedZero ? initialAmount : invoicedAmount),
      isDashed: isInvoicedZero,
    },
    {
      name: 'Engagé',
      invisible: availableAmount,
      visible: committedAmount,
      fill: COLORS.invoiced,
      tooltip: `BC émis, non facturé : −${fmt(currency, committedAmount)}`,
      label: fmt(currency, availableAmount),
    },
    {
      name: 'Restant',
      invisible: 0,
      visible: availableAmount,
      fill: COLORS.initial,
      tooltip: `Reste à engager : ${fmt(currency, availableAmount)}`,
      label: fmt(currency, availableAmount),
    },
  ];

  return (
    <div className="w-full">
      <RechartsResponsiveContainer width="100%" height={200}>
        <RechartsBarChart
          data={data}
          margin={{ top: 24, right: 5, left: 5, bottom: 5 }}
          barCategoryGap="20%"
        >
          <RechartsXAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsYAxis hide domain={[0, initialAmount * 1.05]} />
          <RechartsTooltip content={<CustomTooltip />} cursor={false} />

          {/* Invisible spacer bar */}
          <RechartsBar dataKey="invisible" stackId="waterfall" fill="transparent" isAnimationActive={false} />

          {/* Visible bar with custom shape for dashed zero-value bars */}
          <RechartsBar
            dataKey="visible"
            stackId="waterfall"
            shape={<DashedBarShape />}
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
                  {item.label}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <RechartsCell key={index} fill={entry.fill} />
            ))}
          </RechartsBar>
        </RechartsBarChart>
      </RechartsResponsiveContainer>
      <div className="flex justify-center gap-5 text-xs text-muted-foreground mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.initial }} />
          Début / Fin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.invoiced }} />
          Diminution
        </span>
      </div>
    </div>
  );
}
