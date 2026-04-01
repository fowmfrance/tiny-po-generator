import React, { useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Customized,
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
const RechartsCustomized = Customized as unknown as React.ComponentType<any>;

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
  // For zero-value bars, draw a dashed outline at the full height
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

// Custom connector lines between bars
const WaterfallConnectors = (props: any) => {
  const { formattedGraphicalItems } = props;
  if (!formattedGraphicalItems?.length) return null;

  // The visible bar is the second item (index 1) in the stacked bars
  const visibleBars = formattedGraphicalItems[1]?.props?.data;
  if (!visibleBars || visibleBars.length < 2) return null;

  const lines: React.ReactElement[] = [];

  for (let i = 0; i < visibleBars.length - 1; i++) {
    const current = visibleBars[i];
    const next = visibleBars[i + 1];
    if (!current || !next) continue;

    // The connector y is at the bottom of the current visible bar = top of invisible of next
    // For "Budget" → "Facturé": connect at the level where the next bar starts
    // The transition level is: invisible[i+1] + visible[i+1] top, which equals invisible[i] for totals
    // Simpler: connect at the y coordinate of the bottom of current visible bar
    const currentX = current.x + current.width;
    const nextX = next.x;

    // The transition level (in data coords) is the top of the next bar
    // For descent bars: bottom of current = top of next
    // y coordinate = top of invisible bar of next entry = next.y + next.height (bottom of visible)
    // Actually we want the level where they connect:
    // Budget→Facturé: level = initialAmount (top of both)
    // Facturé→Engagé: level = levelAfterInvoiced (bottom of facturé = top of engagé visible)
    // Engagé→Restant: level = availableAmount (bottom of engagé = top of restant)

    // The y of visible bar bottom = y + height
    // But for the invisible+visible stack, the transition is at the TOP of the next visible bar
    const connectorY = next.y; // top of next visible bar

    lines.push(
      <line
        key={`connector-${i}`}
        x1={currentX}
        x2={nextX}
        y1={connectorY}
        y2={connectorY}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.5}
      />
    );
  }

  return <g>{lines}</g>;
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

  const isInvoicedZero = invoicedAmount === 0;
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
      tooltip: `Montant facturé : ${invoicedAmount > 0 ? '−' : ''}${fmt(currency, invoicedAmount)}`,
      label: invoicedAmount > 0 ? `−${fmt(currency, invoicedAmount)}` : fmt(currency, 0),
      isDashed: isInvoicedZero,
    },
    {
      name: 'Engagé',
      invisible: availableAmount,
      visible: committedAmount,
      fill: COLORS.committed,
      tooltip: `BC émis, non facturé : −${fmt(currency, committedAmount)}`,
      label: committedAmount > 0 ? `−${fmt(currency, committedAmount)}` : fmt(currency, 0),
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

          {/* Dashed connectors between bars */}
          {(BarChart as any).prototype ? null : null}
        </RechartsBarChart>
      </RechartsResponsiveContainer>
      <div className="flex justify-center gap-5 text-xs text-muted-foreground mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.initial }} />
          Début / Fin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.invoiced }} />
          Facturé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.committed }} />
          Engagé
        </span>
      </div>
    </div>
  );
}
