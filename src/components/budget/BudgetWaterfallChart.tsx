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

// Palette alignée sur les donuts (KIOSCO_CHART, cf. SupplierDashboardTab) :
// terracotta / ocre / vert / gris chaud / brique — cohérence de marque.
const COLORS = {
  revenue: '#D97757', // terracotta — Prix de vente / Budget (barre d'en-tête)
  invoiced: '#9B3B2A', // brique — coût facturé / écart défavorable
  committed: '#B8853A', // ocre — charges budgétées / BdC engagé
  remaining: '#6B6860', // gris chaud — budget non alloué (neutre)
  margin: '#4A7C59', // vert — marge brute (résultat positif)
};

interface WaterfallStep {
  name: string;
  // total = barre pleine depuis 0 · change = marche · zero-change = tiret 0 €
  // target = barre repère depuis 0, en POINTILLÉS (marge cible, pas un flux)
  type: 'total' | 'change' | 'zero-change' | 'target';
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
  const engagedCosts = invoicedAmount + committedAmount;

  // If resalePrice is set, bridge vs budget :
  //   Vente → -Charges budgétées → Marge cible (pointillés) → ±Écart vs budget → Marge à date
  // Otherwise fallback to cost-only view: Budget → -Facturé → -Engagé → Restant
  const hasResale = typeof resalePrice === 'number' && resalePrice > 0;

  const steps: WaterfallStep[] = useMemo(() => {
    if (hasResale) {
      const sale = resalePrice!;
      // Bridge vs BUDGET : la marge cible (CA − provision de charges) est le repère ;
      // l'écart budget vs coûts engagés (factures + BdC) la dégrade (dépassement)
      // ou l'améliore (économie), pour atterrir sur la marge à date.
      const targetMargin = sale - initialAmount; // marge cible initiale
      const variance = initialAmount - engagedCosts; // <0 = dépassement, >0 = économie
      const currentMargin = sale - engagedCosts; // marge à date (= cible + écart)

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
          name: 'Charges budgétées',
          type: initialAmount === 0 ? 'zero-change' : 'change',
          from: sale,
          to: targetMargin,
          delta: -initialAmount,
          color: COLORS.committed,
          label: initialAmount === 0 ? fmt(currency, 0) : `−${fmt(currency, initialAmount)}`,
        },
        {
          name: 'Marge cible',
          type: 'target',
          from: 0,
          to: targetMargin,
          delta: targetMargin,
          color: COLORS.margin,
          label: fmt(currency, targetMargin),
        },
        {
          name: variance < 0 ? 'Dépassement' : variance > 0 ? 'Écart favorable' : 'Écart vs budget',
          type: variance === 0 ? 'zero-change' : 'change',
          from: targetMargin,
          to: currentMargin,
          delta: variance,
          color: variance < 0 ? COLORS.invoiced : COLORS.margin,
          label: variance === 0
            ? fmt(currency, 0)
            : `${variance < 0 ? '−' : '+'}${fmt(currency, Math.abs(variance))}`,
        },
        {
          name: 'Marge à date',
          type: 'total',
          from: 0,
          to: currentMargin,
          delta: currentMargin,
          color: currentMargin >= 0 ? COLORS.margin : COLORS.invoiced,
          label: fmt(currency, currentMargin),
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
  }, [currency, initialAmount, invoicedAmount, committedAmount, engagedCosts, hasResale, resalePrice]);

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

  // Clamp ≥ 0 : une marge négative s'affiche via le label, pas sous l'axe.
  const yScale = (val: number) => marginTop + chartHeight * (1 - Math.max(0, val) / maxValue);

  const variance = hasResale ? initialAmount - engagedCosts : 0;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxHeight: 280 }}>
        {steps.map((step, i) => {
          const x = marginLeft + i * barGroupWidth + barGap;
          const centerX = x + barWidth / 2;

          if (i > 0) {
            const connectorLevel = step.type === 'change' ? step.from : step.to;
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
                ) : step.type === 'target' ? (
                  <>
                    {/* Marge cible : repère en pointillés depuis 0, pas un flux */}
                    <rect
                      x={x} y={yScale(step.to)}
                      width={barWidth}
                      height={Math.max(0, yScale(0) - yScale(step.to))}
                      fill={step.color} fillOpacity={0.08}
                      stroke={step.color} strokeWidth={1.5}
                      strokeDasharray="5 4" rx={4}
                    />
                    <text x={centerX} y={yScale(step.to) - 6} textAnchor="middle"
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
        {hasResale ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.revenue }} />
              Prix de vente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.committed }} />
              Charges budgétées
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border-2 border-dashed"
                style={{ borderColor: COLORS.margin, background: 'transparent' }} />
              Marge cible
            </span>
            {variance !== 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: variance < 0 ? COLORS.invoiced : COLORS.margin }} />
                {variance < 0 ? 'Dépassement' : 'Écart favorable'}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.margin }} />
              Marge à date
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.invoiced }} />
              Factures reçues
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.committed }} />
              BdC engagé
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.margin }} />
              Restant
            </span>
          </>
        )}
      </div>

      {hasResale && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Coûts engagés : <span className="font-medium text-foreground">{fmt(currency, engagedCosts)}</span>
          {' '}(factures {fmt(currency, invoicedAmount)} + BdC {fmt(currency, committedAmount)})
          {' · '}Charges budgétées : <span className="font-medium text-foreground">{fmt(currency, initialAmount)}</span>
          {engagedCosts > initialAmount
            ? <span className="text-red-600 font-medium"> · dépassement {fmt(currency, engagedCosts - initialAmount)}</span>
            : <span> · reste {fmt(currency, initialAmount - engagedCosts)}</span>}
        </p>
      )}
    </div>
  );
}
