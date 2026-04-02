import React from 'react';
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

type WaterfallItemKind = 'total' | 'change';

interface WaterfallItem {
  name: string;
  kind: WaterfallItemKind;
  start: number;
  end: number;
  invisible: number;
  visible: number;
  delta: number;
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

const COLORS = {
  initial: 'hsl(221, 83%, 53%)',
  invoiced: 'hsl(0, 72%, 51%)',
  committed: 'hsl(25, 95%, 53%)',
};

const formatChangeLabel = (currency: string, amount: number) => {
  if (amount === 0) return fmt(currency, 0);
  return `${amount > 0 ? '−' : '+'}${fmt(currency, Math.abs(amount))}`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as WaterfallItem | undefined;
  if (!item) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="text-muted-foreground">{item.tooltip}</p>
    </div>
  );
};

const DashedBarShape = ({ x, y, width, height, payload }: any) => {
  if (!payload?.isDashed) {
    return <rect x={x} y={y} width={width} height={height} fill={payload?.fill || 'transparent'} rx={4} />;
  }

  const dashedHeight = 10;
  const dashedY = y - dashedHeight / 2;

  return (
    <rect
      x={x}
      y={dashedY}
      width={width}
      height={dashedHeight}
      fill="transparent"
      stroke={payload?.fill || COLORS.invoiced}
      strokeWidth={1.5}
      strokeDasharray="4 3"
      rx={4}
    />
  );
};

const getConnectorY = (bar: any, item: WaterfallItem) => {
  if (item.kind === 'total' || item.delta > 0) return bar.y;
  return bar.y + bar.height;
};

const WaterfallConnectors = ({ formattedGraphicalItems }: any) => {
  const visibleBars = formattedGraphicalItems?.[1]?.props?.data;
  if (!Array.isArray(visibleBars) || visibleBars.length < 2) return null;

  return (
    <g>
      {visibleBars.slice(0, -1).map((currentBar: any, index: number) => {
        const nextBar = visibleBars[index + 1];
        const currentItem = currentBar?.payload as WaterfallItem | undefined;
        if (!currentBar || !nextBar || !currentItem) return null;

        const connectorY = getConnectorY(currentBar, currentItem);

        return (
          <line
            key={`connector-${index}`}
            x1={currentBar.x + currentBar.width}
            x2={nextBar.x}
            y1={connectorY}
            y2={connectorY}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.7}
          />
        );
      })}
    </g>
  );
};

export function BudgetWaterfallChart({
  currency,
  initialAmount,
  sentAmount,
  receivedAmount,
  availableAmount,
}: BudgetWaterfallChartProps) {
  const invoicedAmount = Math.max(0, receivedAmount);
  const committedAmount = Math.max(0, sentAmount - receivedAmount);
  const levelAfterInvoiced = initialAmount - invoicedAmount;

  const data: WaterfallItem[] = [
    {
      name: 'Budget',
      kind: 'total',
      start: 0,
      end: initialAmount,
      invisible: 0,
      visible: initialAmount,
      delta: initialAmount,
      fill: COLORS.initial,
      tooltip: `Enveloppe totale : ${fmt(currency, initialAmount)}`,
      label: fmt(currency, initialAmount),
    },
    {
      name: 'Facturé',
      kind: 'change',
      start: initialAmount,
      end: levelAfterInvoiced,
      invisible: levelAfterInvoiced,
      visible: invoicedAmount,
      delta: -invoicedAmount,
      fill: COLORS.invoiced,
      tooltip: `Montant facturé : ${formatChangeLabel(currency, invoicedAmount)}`,
      label: formatChangeLabel(currency, invoicedAmount),
      isDashed: invoicedAmount === 0,
    },
    {
      name: 'Engagé',
      kind: 'change',
      start: levelAfterInvoiced,
      end: availableAmount,
      invisible: availableAmount,
      visible: committedAmount,
      delta: -committedAmount,
      fill: COLORS.committed,
      tooltip: `BC émis, non facturé : ${formatChangeLabel(currency, committedAmount)}`,
      label: formatChangeLabel(currency, committedAmount),
      isDashed: committedAmount === 0,
    },
    {
      name: 'Restant',
      kind: 'total',
      start: 0,
      end: availableAmount,
      invisible: 0,
      visible: availableAmount,
      delta: availableAmount,
      fill: COLORS.initial,
      tooltip: `Reste à engager : ${fmt(currency, availableAmount)}`,
      label: fmt(currency, availableAmount),
    },
  ];

  const allLevels = data.flatMap((item) => [item.start, item.end, 0]);
  const minLevel = Math.min(...allLevels);
  const maxLevel = Math.max(...allLevels);
  const padding = Math.max((maxLevel - minLevel) * 0.08, 1);

  return (
    <div className="w-full">
      <RechartsResponsiveContainer width="100%" height={200}>
        <RechartsBarChart
          data={data}
          margin={{ top: 28, right: 6, left: 6, bottom: 8 }}
          barCategoryGap="20%"
        >
          <RechartsXAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsYAxis hide domain={[minLevel - padding, maxLevel + padding]} />
          <RechartsTooltip content={<CustomTooltip />} cursor={false} />

          <RechartsBar dataKey="invisible" stackId="waterfall" fill="transparent" isAnimationActive={false} />

          <RechartsBar
            dataKey="visible"
            stackId="waterfall"
            shape={<DashedBarShape />}
            isAnimationActive={false}
            label={({ x, y, width, index }: any) => {
              const item = data[index];
              if (!item || x == null || y == null || width == null) return null;

              return (
                <text
                  x={x + width / 2}
                  y={item.isDashed ? y - 10 : y - 6}
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

          <RechartsCustomized component={WaterfallConnectors} />
        </RechartsBarChart>
      </RechartsResponsiveContainer>

      <div className="mt-1 flex justify-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.initial }} />
          Début / Fin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.invoiced }} />
          Facturé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.committed }} />
          Engagé
        </span>
      </div>
    </div>
  );
}
