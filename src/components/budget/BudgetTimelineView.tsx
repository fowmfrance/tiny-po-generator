import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Budget } from '@/models/Budget';
import { formatCurrency } from '@/services/budgetService';

interface BudgetTimelineViewProps {
  budgets: Budget[];
}

type TypeFilter = 'all' | 'project' | 'other';

const FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'project', label: 'Projets' },
  { key: 'other', label: 'Autres' },
];

// Code couleur par famille — aligné sur le système : mûre = projets (le cœur
// du métier), ocre = G&A, gris chaud = le reste. Le dépassement passe au carmin.
const TYPE_COLORS: Record<'project' | 'ga' | 'other', { bar: string; label: string }> = {
  project: { bar: '#9F3372', label: 'Projets' },
  ga: { bar: '#B8853A', label: 'G&A' },
  other: { bar: '#6B6860', label: 'Autres' },
};

const familyOf = (b: Budget): 'project' | 'ga' | 'other' =>
  b.type === 'Project' ? 'project' : b.type === 'G&A' ? 'ga' : 'other';

const DAY = 24 * 3600 * 1000;

const monthLabel = (d: Date) =>
  d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

const BudgetTimelineView: React.FC<BudgetTimelineViewProps> = ({ budgets }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TypeFilter>('all');

  const filtered = useMemo(() => budgets.filter(b =>
    filter === 'all' ? true : filter === 'project' ? familyOf(b) === 'project' : familyOf(b) !== 'project'
  ), [budgets, filter]);

  const dated = useMemo(() =>
    filtered
      .filter(b => b.startDate && b.endDate)
      .sort((a, b) => (a.startDate as Date).getTime() - (b.startDate as Date).getTime()),
  [filtered]);
  const undated = filtered.filter(b => !b.startDate || !b.endDate);

  // Fenêtre temporelle : de la première date de début à la dernière date de
  // fin, élargie pour toujours contenir aujourd'hui ± 1 mois.
  const { rangeStart, rangeEnd, months, todayPct } = useMemo(() => {
    const now = Date.now();
    let min = Math.min(now - 30 * DAY, ...dated.map(b => (b.startDate as Date).getTime()));
    let max = Math.max(now + 30 * DAY, ...dated.map(b => (b.endDate as Date).getTime()));
    // marge visuelle
    min -= 10 * DAY;
    max += 10 * DAY;

    const monthList: { pct: number; label: string }[] = [];
    const cursor = new Date(min);
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + 1);
    while (cursor.getTime() < max) {
      monthList.push({
        pct: ((cursor.getTime() - min) / (max - min)) * 100,
        label: monthLabel(cursor),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    // pas plus de ~14 étiquettes : on n'en garde qu'une sur n
    const stride = Math.ceil(monthList.length / 14);
    const kept = monthList.filter((_, i) => i % stride === 0);

    return {
      rangeStart: min,
      rangeEnd: max,
      months: kept,
      todayPct: ((now - min) / (max - min)) * 100,
    };
  }, [dated]);

  const span = rangeEnd - rangeStart;
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - rangeStart) / span) * 100));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === f.key ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {(Object.keys(TYPE_COLORS) as Array<keyof typeof TYPE_COLORS>).map(k => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TYPE_COLORS[k].bar }} />
              {TYPE_COLORS[k].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-destructive" />
            Dépassement
          </span>
        </div>
      </div>

      {dated.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          Aucun budget daté à afficher pour ce filtre.
        </p>
      ) : (
        <div className="relative rounded-lg border bg-card px-3 pt-7 pb-3 overflow-x-auto">
          <div className="relative min-w-[560px]">
            {/* Axe des mois */}
            {months.map((m, i) => (
              <React.Fragment key={i}>
                <div
                  className="absolute top-0 bottom-0 border-l border-border/60"
                  style={{ left: `${m.pct}%` }}
                />
                <span
                  className="absolute -top-5 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap"
                  style={{ left: `${m.pct}%` }}
                >
                  {m.label}
                </span>
              </React.Fragment>
            ))}

            {/* Aujourd'hui */}
            {todayPct >= 0 && todayPct <= 100 && (
              <>
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-foreground/70 z-10"
                  style={{ left: `${todayPct}%` }}
                />
                <span
                  className="absolute -top-5 -translate-x-1/2 text-[10px] font-semibold text-foreground z-10 bg-card px-1"
                  style={{ left: `${todayPct}%` }}
                >
                  Aujourd'hui
                </span>
              </>
            )}

            {/* Une ligne par budget */}
            <div className="relative space-y-1.5">
              {dated.map(b => {
                const start = (b.startDate as Date).getTime();
                const end = (b.endDate as Date).getTime();
                const left = pct(start);
                const width = Math.max(pct(end) - left, 1.5);
                const overspent = b.availableAmount < 0;
                const color = overspent ? 'hsl(var(--destructive))' : TYPE_COLORS[familyOf(b)].bar;
                const finished = end < Date.now();
                return (
                  <div key={b.id} className="relative h-8 group">
                    <button
                      type="button"
                      onClick={() => navigate(`/budgets/${b.id}`)}
                      title={`${b.code} — ${b.name}\n${(b.startDate as Date).toLocaleDateString('fr-FR')} → ${(b.endDate as Date).toLocaleDateString('fr-FR')}\nDisponible : ${formatCurrency(b.currency, b.availableAmount)}${overspent ? ' (dépassé)' : ''}`}
                      className="absolute top-1 h-6 rounded-md flex items-center overflow-hidden hover:ring-2 hover:ring-ring hover:ring-offset-1 transition-shadow"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background: color,
                        opacity: finished ? 0.45 : 1,
                      }}
                    >
                      <span className="px-2 text-[11px] font-medium text-white truncate">
                        {b.code} · {b.name}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {undated.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Sans dates — hors timeline (requises pour la reconnaissance et le cut-off)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {undated.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => navigate(`/budgets/${b.id}`)}
                className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted"
              >
                {b.code} · {b.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetTimelineView;
