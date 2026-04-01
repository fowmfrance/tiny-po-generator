import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
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
}

const RechartsResponsiveContainer = ResponsiveContainer as unknown as React.ComponentType<any>;
const RechartsBarChart = BarChart as unknown as React.ComponentType<any>;
const RechartsXAxis = XAxis as unknown as React.ComponentType<any>;
const RechartsYAxis = YAxis as unknown as React.ComponentType<any>;
const RechartsTooltip = Tooltip as unknown as React.ComponentType<any>;
const RechartsBar = Bar as unknown as React.ComponentType<any>;
const RechartsCell = Cell as unknown as React.ComponentType<any>;
const RechartsReferenceLine = ReferenceLine as unknown as React.ComponentType<any>;

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

export function BudgetWaterfallChart({
  currency,
  initialAmount,
  sentAmount,
  receivedAmount,
  availableAmount,
}: BudgetWaterfallChartProps) {
  const invoicedAmount = receivedAmount;
  const committedAmount = Math.max(0, sentAmount - receivedAmount);

  // Waterfall logic: cascade from top
  // Bar 1: Initial — full bar from 0 to initialAmount
  // Bar 2: Invoiced — hangs from top of initial, going down
  // Bar 3: Committed — hangs below invoiced
  // Bar 4: Available — from 0 to availableAmount

  const data: WaterfallItem[] = [
    {
      name: 'Budget initial',
      invisible: 0,
      visible: initialAmount,
      fill: COLORS.initial,
      tooltip: `Enveloppe totale : ${fmt(currency, initialAmount)}`,
      label: fmt(currency, initialAmount),
    },
    {
      name: '− Facturé',
      invisible: initialAmount - invoicedAmount,
      visible: invoicedAmount,
      fill: COLORS.invoiced,
      tooltip: `Montant facturé : −${fmt(currency, invoicedAmount)}`,
      label: `−${fmt(currency, invoicedAmount)}`,
    },
    {
      name: '− Engagé',
      invisible: availableAmount,
      visible: committedAmount,
      fill: COLORS.committed,
      tooltip: `BC émis, non facturé : −${fmt(currency, committedAmount)}`,
      label: `−${fmt(currency, committedAmount)}`,
    },
    {
      name: '= Disponible',
      invisible: 0,
      visible: availableAmount,
      fill: COLORS.available,
      tooltip: `Reste à engager : ${fmt(currency, availableAmount)}`,
      label: fmt(currency, availableAmount),
    },
  ];

  // Connector lines between bars (dashed)
  const connectors = [
    { x1: 0, x2: 1, y: initialAmount - invoicedAmount }, // bottom of invoiced = top of committed area
    { x1: 1, x2: 2, y: availableAmount + committedAmount }, // top of committed
    { x1: 2, x2: 3, y: availableAmount }, // bottom of committed = top of available
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

          {/* Visible bar */}
          <RechartsBar
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
          Budget initial
        </span>
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
