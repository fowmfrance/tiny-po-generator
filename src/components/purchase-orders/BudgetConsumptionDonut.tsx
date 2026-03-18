import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface BudgetPO {
  id: string;
  total_amount: number;
  status: string;
  supplier_name?: string;
}

interface BudgetConsumptionDonutProps {
  budgetInitialAmount: number;
  budgetCurrency: string;
  existingPOs: BudgetPO[];
  currentPOAmount: number;
}

const COLORS = {
  sent: 'hsl(var(--primary))',
  draft: 'hsl(var(--muted-foreground) / 0.5)',
  currentOk: 'hsl(142, 71%, 45%)',
  currentOver: 'hsl(0, 84%, 60%)',
  available: 'hsl(var(--muted) / 0.3)',
  overBudget: 'hsl(0, 84%, 60%)',
};

const fmt = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RechartsResponsiveContainer = ResponsiveContainer as unknown as React.ComponentType<any>;
const RechartsPieChart = PieChart as unknown as React.ComponentType<any>;
const RechartsPie = Pie as unknown as React.ComponentType<any>;
const RechartsCell = Cell as unknown as React.ComponentType<any>;
const RechartsTooltip = Tooltip as unknown as React.ComponentType<any>;

export default function BudgetConsumptionDonut({
  budgetInitialAmount,
  budgetCurrency,
  existingPOs,
  currentPOAmount,
}: BudgetConsumptionDonutProps) {
  const { sentTotal, draftTotal, draftCount, available, isOverBudget, overAmount, chartData } = useMemo(() => {
    const sentPOs = existingPOs.filter((po) => po.status !== 'draft' && po.status !== 'rejected');
    const draftPOs = existingPOs.filter((po) => po.status === 'draft');

    const sentTotal = sentPOs.reduce((s, po) => s + Number(po.total_amount || 0), 0);
    const draftTotal = draftPOs.reduce((s, po) => s + Number(po.total_amount || 0), 0);
    const committed = sentTotal + draftTotal;
    const availableBeforeCurrent = Math.max(0, budgetInitialAmount - committed);
    const isOverBudget = currentPOAmount > availableBeforeCurrent;
    const overAmount = isOverBudget ? currentPOAmount - availableBeforeCurrent : 0;
    const available = Math.max(0, availableBeforeCurrent - currentPOAmount);

    const data: { name: string; value: number; color: string }[] = [];

    if (sentTotal > 0) data.push({ name: 'BC envoyés', value: sentTotal, color: COLORS.sent });
    if (draftTotal > 0) data.push({ name: 'BC brouillons', value: draftTotal, color: COLORS.draft });

    if (currentPOAmount > 0 && !isOverBudget) {
      data.push({ name: 'BC en cours', value: currentPOAmount, color: COLORS.currentOk });
    }
    if (currentPOAmount > 0 && isOverBudget) {
      const withinBudget = availableBeforeCurrent;
      if (withinBudget > 0) data.push({ name: 'BC en cours (dans budget)', value: withinBudget, color: COLORS.currentOk });
      data.push({ name: 'Dépassement', value: overAmount, color: COLORS.overBudget });
    }

    if (available > 0) data.push({ name: 'Disponible', value: available, color: COLORS.available });

    // Ensure we always have data
    if (data.length === 0) data.push({ name: 'Budget total', value: budgetInitialAmount, color: COLORS.available });

    return {
      sentTotal,
      draftTotal,
      draftCount: draftPOs.length,
      available,
      isOverBudget,
      overAmount,
      chartData: data,
    };
  }, [existingPOs, currentPOAmount, budgetInitialAmount]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const { name, value } = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground border rounded-md px-3 py-2 shadow-md text-xs">
        <p className="font-medium">{name}</p>
        <p>{fmt(value, budgetCurrency)}</p>
      </div>
    );
  };

  const draftWarningThreshold = draftTotal + currentPOAmount > budgetInitialAmount - sentTotal;

  return (
    <div className="space-y-4">
      {/* Donut */}
      <div className="h-[180px] w-full">
        <RechartsResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <RechartsPie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, i) => (
                <RechartsCell key={i} fill={entry.color} />
              ))}
            </RechartsPie>
            <RechartsTooltip content={<CustomTooltip />} />
          </RechartsPieChart>
        </RechartsResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 text-xs">
        {chartData.map((entry, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">{fmt(entry.value, budgetCurrency)}</span>
          </div>
        ))}
      </div>

      {/* Budget total */}
      <div className="border-t pt-3 flex justify-between text-sm font-bold">
        <span>Budget total</span>
        <span>{fmt(budgetInitialAmount, budgetCurrency)}</span>
      </div>

      {/* Status indicator */}
      {currentPOAmount > 0 && (
        <div className={`flex items-center gap-2 p-2.5 rounded-md text-xs font-medium ${
          isOverBudget
            ? 'bg-destructive/10 text-destructive'
            : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
        }`}>
          {isOverBudget ? (
            <>
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span>Dépassement de {fmt(overAmount, budgetCurrency)} — le BC sera enregistré en brouillon uniquement.</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Dans l'enveloppe — le BC peut être envoyé.</span>
            </>
          )}
        </div>
      )}

      {/* Draft POs warning */}
      {draftCount > 0 && draftWarningThreshold && currentPOAmount > 0 && (
        <div className="flex items-start gap-2 p-2.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            {draftCount} BC brouillon{draftCount > 1 ? 's' : ''} existant{draftCount > 1 ? 's' : ''} ({fmt(draftTotal, budgetCurrency)}).
            Avec ce BC, le total provisoire ({fmt(sentTotal + draftTotal + currentPOAmount, budgetCurrency)}) dépasse le budget.
          </span>
        </div>
      )}
    </div>
  );
}
