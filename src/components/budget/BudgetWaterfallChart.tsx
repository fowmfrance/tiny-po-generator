import React, { useMemo } from 'react';

interface BudgetWaterfallChartProps {
  currency: string;
  initialAmount: number;
  sentAmount: number;
  receivedAmount: number;
  availableAmount: number;
  resalePrice?: number;
}

const fmt = (currency: string, amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const COLORS = {
  revenue: 'hsl(221, 83%, 53%)',
  invoiced: 'hsl(0, 72%, 51%)',
  committed: 'hsl(25, 95%, 53%)',
  remaining: 'hsl(45, 93%, 47%)',
  margin: 'hsl(142, 71%, 45%)',
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
  resalePrice,
}: BudgetWaterfallChartProps) {
  const invoicedAmount = Math.max(0, receivedAmount);
  const committedAmount = Math.max(0, sentAmount - receivedAmount);
  const unallocated = Math.max(0, initialAmount - sentAmount);

  // If resalePrice is set, waterfall: Vente → -Facturé → -Engagé → -Restant → Marge
  // Otherwise fallback to cost-only view: Budget → -Facturé → -Engagé → Restant
  const hasResale = typeof resalePrice === 'number' && resalePrice > 0;

  const steps: WaterfallStep[] = useMemo(() => {
    if (hasResale) {
      const sale = resalePrice!;
      const margin = sale - initialAmount;

      const lvl1 = sale - invoicedAmount;
      const lvl2 = lvl1 - committedAmount;
      const lvl3 = lvl2 - unallocated; // = margin

      return [
        {
          name: 'Prix de vente',
          type: 'total',
          from: 0,
          to: sale,
          delta: sale,
          color: COLORS.revenue,
          label: fmt(currency, sale),
        },
        {
          name: 'Factures reçues',
          type: invoicedAmount === 0 ? 'zero-change' : 'change',
          from: sale,
          to: lvl1,
          delta: -invoicedAmount,
          color: COLORS.invoiced,
          label: invoicedAmount === 0 ? fmt(currency, 0) : `−${fmt(currency, invoicedAmount)}`,
        },
        {
          name: 'BdC en attente',
          type: committedAmount === 0 ? 'zero-change' : 'change',
          from: lvl1,
          to: lvl2,
          delta: -committedAmount,
          color: COLORS.committed,
          label: committedAmount === 0 ? fmt(currency, 0) : `−${fmt(currency, committedAmount)}`,
        },
        {
          name: 'Budget non alloué',
          type: unallocated === 0 ? 'zero-change' : 'change',
          from: lvl2,
          to: lvl3,
          delta: -unallocated,
          color: COLORS.remaining,
          label: unallocated === 0 ? fmt(currency, 0) : `−${fmt(currency, unallocated)}`,
        },
        {
          name: 'Marge brute',
          type: 'total',
          from: 0,
          to: Math.max(0, margin),
          delta: margin,
          color: margin >= 0 ? COLORS.margin : COLORS.invoiced,
          label: fmt(currency, margin),
        },
      ];
    }

    // Fallback: cost-only waterfall
    const levelAfterInvoiced = initialAmount - invoicedAmount;
    const levelAfterCommitted = levelAfterInvoiced - committedAmount;

    return [
      {
        name: 'Budget',
        type: 'total',
        from: 0,
        to: initialAmount,
        delta: initialAmount,
        color: COLORS.revenue,
        label: fmt(currency, initialAmount),
      },
      {
        name: 'Factures reçues',
        type: invoicedAmount === 0 ? 'zero-change' : 'change',
        from: initialAmount,
        to: levelAfterInvoiced,
        delta: -invoicedAmount,
        color: COLORS.invoiced,
        label: invoicedAmount === 0 ? fmt(currency, 0) : `−${fmt(currency, invoicedAmount)}`,
      },
      {
        name: 'BdC en attente',
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
        color: COLORS.margin,
        label: fmt(currency, levelAfterCommitted),
      },
    ];
  }, [currency, initialAmount, invoicedAmount, committedAmount, unallocated, hasResale, resalePrice]);

  // SVG layout
  const svgWidth = 700;
  const svgHeight = 220;
  const marginTop = 28;
  const marginBottom = 28;
  const marginLeft = 16;
  const marginRight = 16;
  const chartWidth = svgWidth - marginLeft - marginRight;
  const chartHeight = svgHeight - marginTop - marginBottom;

  const maxValue = hasResale ? Math.max(resalePrice!, initialAmount) : (initialAmount || 1);
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

          if (i > 0) {
            const connectorLevel = step.type === 'total' ? step.to : step.from;
            const connectorY = yScale(connectorLevel);
            const prevX = marginLeft + (i - 1) * barGroupWidth + barGap + barWidth;
            return (
              <React.Fragment key={`step-${i}`}>
                <line
                  x1={prevX} x2={x} y1={connectorY} y2={connectorY}
                  stroke="hsl(var(--muted-foreground))" strokeWidth={1.5}
                  strokeDasharray="4 4" opacity={0.6}
                />
                {step.type === 'zero-change' ? (
                  <>
                    <rect x={x} y={connectorY - 2} width={barWidth} height={4}
                      fill="transparent" stroke={step.color} strokeWidth={1.5}
                      strokeDasharray="4 3" rx={2}
                    />
                    <text x={centerX} y={connectorY - 8} textAnchor="middle"
                      fontSize={11} fontWeight={600} fill="hsl(var(--foreground))">
                      {step.label}
                    </text>
                  </>
                ) : (
                  <>
                    <rect
                      x={x} y={yScale(Math.max(step.from, step.to))}
                      width={barWidth}
                      height={Math.abs(yScale(step.from) - yScale(step.to))}
                      fill={step.color} rx={4}
                    />
                    <text x={centerX} y={yScale(Math.max(step.from, step.to)) - 6}
                      textAnchor="middle" fontSize={11} fontWeight={600}
                      fill="hsl(var(--foreground))">
                      {step.label}
                    </text>
                  </>
                )}
                <text x={centerX} y={svgHeight - 6} textAnchor="middle"
                  fontSize={10} fill="hsl(var(--muted-foreground))">
                  {step.name}
                </text>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={`step-${i}`}>
              <rect x={x} y={yScale(step.to)} width={barWidth}
                height={yScale(0) - yScale(step.to)} fill={step.color} rx={4}
              />
              <text x={centerX} y={yScale(step.to) - 6} textAnchor="middle"
                fontSize={11} fontWeight={600} fill="hsl(var(--foreground))">
                {step.label}
              </text>
              <text x={centerX} y={svgHeight - 6} textAnchor="middle"
                fontSize={10} fill="hsl(var(--muted-foreground))">
                {step.name}
              </text>
            </React.Fragment>
          );
        })}
      </svg>

      <div className="mt-1 flex justify-center gap-4 text-xs text-muted-foreground flex-wrap">
        {hasResale && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.revenue }} />
            Prix de vente
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.invoiced }} />
          Factures reçues
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.committed }} />
          BdC en attente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.remaining }} />
          Non alloué
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.margin }} />
          Marge brute
        </span>
      </div>
    </div>
  );
}
