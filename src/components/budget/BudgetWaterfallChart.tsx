import React, { useMemo } from 'react';

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

const COLORS = {
  total: 'hsl(221, 83%, 53%)',
  invoiced: 'hsl(0, 72%, 51%)',
  committed: 'hsl(25, 95%, 53%)',
};

interface WaterfallStep {
  name: string;
  type: 'total' | 'change' | 'zero-change';
  from: number;
  to: number;
  delta: number;
  color: string;
  label: string;
}

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
  const levelAfterCommitted = levelAfterInvoiced - committedAmount;

  const steps: WaterfallStep[] = useMemo(() => [
    {
      name: 'Budget',
      type: 'total',
      from: 0,
      to: initialAmount,
      delta: initialAmount,
      color: COLORS.total,
      label: fmt(currency, initialAmount),
    },
    {
      name: 'Facturé',
      type: invoicedAmount === 0 ? 'zero-change' : 'change',
      from: initialAmount,
      to: levelAfterInvoiced,
      delta: -invoicedAmount,
      color: COLORS.invoiced,
      label: invoicedAmount === 0 ? fmt(currency, 0) : `−${fmt(currency, invoicedAmount)}`,
    },
    {
      name: 'Engagé',
      type: committedAmount === 0 ? 'zero-change' : 'change',
      from: levelAfterInvoiced,
      to: levelAfterCommitted,
      delta: -committedAmount,
      color: COLORS.committed,
      label: committedAmount === 0 ? fmt(currency, 0) : `−${fmt(currency, committedAmount)}`,
    },
    {
      name: 'Restant',
      type: 'total',
      from: 0,
      to: levelAfterCommitted,
      delta: levelAfterCommitted,
      color: COLORS.total,
      label: fmt(currency, levelAfterCommitted),
    },
  ], [currency, initialAmount, invoicedAmount, committedAmount, levelAfterInvoiced, levelAfterCommitted]);

  // SVG layout
  const svgWidth = 600;
  const svgHeight = 220;
  const marginTop = 28;
  const marginBottom = 28;
  const marginLeft = 16;
  const marginRight = 16;
  const chartWidth = svgWidth - marginLeft - marginRight;
  const chartHeight = svgHeight - marginTop - marginBottom;

  const maxValue = initialAmount || 1;
  const barCount = steps.length;
  const barGroupWidth = chartWidth / barCount;
  const barWidth = barGroupWidth * 0.55;
  const barGap = (barGroupWidth - barWidth) / 2;

  const yScale = (val: number) => marginTop + chartHeight * (1 - val / maxValue);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxHeight: 280 }}>
        {steps.map((step, i) => {
          const x = marginLeft + i * barGroupWidth + barGap;
          const centerX = x + barWidth / 2;

          // Connector from previous step
          if (i > 0) {
            const prev = steps[i - 1];
            const connectorLevel = step.type === 'total'
              ? step.to // for final total, connect at its top
              : step.from; // for changes, connect at the level they start from
            const connectorY = yScale(connectorLevel);
            const prevX = marginLeft + (i - 1) * barGroupWidth + barGap + barWidth;
            return (
              <React.Fragment key={`step-${i}`}>
                {/* Connector line */}
                <line
                  x1={prevX}
                  x2={x}
                  y1={connectorY}
                  y2={connectorY}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.6}
                />
                {/* Bar or zero-change marker */}
                {step.type === 'zero-change' ? (
                  <>
                    {/* Flat cap at current level */}
                    <rect
                      x={x}
                      y={connectorY - 2}
                      width={barWidth}
                      height={4}
                      fill="transparent"
                      stroke={step.color}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      rx={2}
                    />
                    {/* Label */}
                    <text
                      x={centerX}
                      y={connectorY - 8}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      fill="hsl(var(--foreground))"
                    >
                      {step.label}
                    </text>
                  </>
                ) : (
                  <>
                    {/* Bar */}
                    <rect
                      x={x}
                      y={yScale(Math.max(step.from, step.to))}
                      width={barWidth}
                      height={Math.abs(yScale(step.from) - yScale(step.to))}
                      fill={step.color}
                      rx={4}
                    />
                    {/* Label */}
                    <text
                      x={centerX}
                      y={yScale(Math.max(step.from, step.to)) - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      fill="hsl(var(--foreground))"
                    >
                      {step.label}
                    </text>
                  </>
                )}
                {/* X-axis label */}
                <text
                  x={centerX}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill="hsl(var(--muted-foreground))"
                >
                  {step.name}
                </text>
              </React.Fragment>
            );
          }

          // First bar (Budget)
          return (
            <React.Fragment key={`step-${i}`}>
              <rect
                x={x}
                y={yScale(step.to)}
                width={barWidth}
                height={yScale(0) - yScale(step.to)}
                fill={step.color}
                rx={4}
              />
              <text
                x={centerX}
                y={yScale(step.to) - 6}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="hsl(var(--foreground))"
              >
                {step.label}
              </text>
              <text
                x={centerX}
                y={svgHeight - 6}
                textAnchor="middle"
                fontSize={11}
                fill="hsl(var(--muted-foreground))"
              >
                {step.name}
              </text>
            </React.Fragment>
          );
        })}
      </svg>

      <div className="mt-1 flex justify-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.total }} />
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
