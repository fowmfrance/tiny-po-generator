import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

/**
 * Reconnaissance des charges entre les dates du projet — doctrine Sapajoo :
 * reco linéaire (défaut), provisions par DIFFÉRENTIEL de lissage :
 *   FNP = reconnu − comptabilisé (quand positif) : segment hachuré qui
 *         complète le comptabilisé jusqu'au curseur reco ;
 *   CCA = comptabilisé − reconnu (quand positif) : la provision RABOTE la
 *         reco → segment en transparence AU-DELÀ du curseur, flèche arrière.
 * Milestones sur l'axe du temps : BdC envoyés (petits ticks, regroupés par
 * mois si nombreux) et factures HORS BdC (les gros montants ressortent).
 *
 * CA & Marge : désactivés tant que la facturation client n'est pas connectée
 * (POC facturation Qonto sur FOWM, ou plateforme agréée).
 */

interface BudgetRecognitionTimelineProps {
  budgetId: string;
  budgetCode: string;
  currency: string;
  initialAmount: number;
  startDate: string | null;
  endDate: string | null;
}

type Aggregate = 'ca' | 'charges' | 'marge';

const C = {
  compta: '#B8853A',      // ocre — charges comptabilisées (factures HT)
  fnp: '#B8853A',         // même teinte, rendu hachuré/translucide
  cca: '#9F3372',         // mûre translucide — provision qui rabote
  reco: '#1A1914',        // encre — curseur reconnu
  po: '#6B6860',          // gris chaud — ticks BdC
  invoice: '#BF2237',     // carmin — grosses factures hors BdC
};

const DAY = 24 * 3600 * 1000;

const fmt = (currency: string, n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 0 }).format(n);

const BudgetRecognitionTimeline: React.FC<BudgetRecognitionTimelineProps> = ({
  budgetId, budgetCode, currency, initialAmount, startDate, endDate,
}) => {
  const [aggregate, setAggregate] = useState<Aggregate>('charges');

  const { data } = useQuery({
    queryKey: ['budget-reco-timeline', budgetId],
    queryFn: async () => {
      const { data: pos, error: poErr } = await supabase
        .from('purchase_orders')
        .select('id, po_number, total_amount, amount_ht, status, created_at, supplier_name')
        .eq('budget_id', budgetId)
        .neq('status', 'cancelled');
      if (poErr) throw poErr;

      const poIds = (pos || []).map(p => p.id);
      let invQuery = supabase
        .from('supplier_invoices')
        .select('id, invoice_number, amount, amount_ht, invoice_date, supplier_name, purchase_order_id, status')
        .neq('status', 'cancelled');
      // Factures liées au budget : par BdC, ou hors BdC via project_code
      invQuery = poIds.length > 0
        ? invQuery.or(`purchase_order_id.in.(${poIds.join(',')}),and(project_code.eq.${budgetCode},purchase_order_id.is.null)`)
        : invQuery.eq('project_code', budgetCode).is('purchase_order_id', null);
      const { data: invoices, error: invErr } = await invQuery;
      if (invErr) throw invErr;

      return { pos: pos || [], invoices: invoices || [] };
    },
  });

  const model = useMemo(() => {
    if (!startDate || !endDate || !data) return null;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end <= start) return null;
    const now = Date.now();
    const elapsed = Math.min(1, Math.max(0, (now - start) / (end - start)));

    const reconnu = initialAmount * elapsed;
    // HT partout — amount = TTC (convention app), amount_ht explicite
    const htOf = (row: { amount_ht: number | null; amount: number | null }) =>
      Number(row.amount_ht ?? row.amount ?? 0);
    const comptabilise = data.invoices.reduce((s, inv) => s + htOf(inv), 0);
    const fnp = Math.max(0, reconnu - comptabilise);
    const cca = Math.max(0, comptabilise - reconnu);

    // Milestones temps : BdC (regroupés par mois si > 12) + factures hors BdC
    const posM = data.pos.map(po => ({
      t: new Date(po.created_at).getTime(),
      amount: Number(po.amount_ht ?? po.total_amount ?? 0),
      label: `${po.po_number} · ${po.supplier_name ?? ''}`,
    })).filter(m => m.t >= start - 15 * DAY && m.t <= end + 15 * DAY);

    let poMarkers: { pct: number; label: string; count: number }[];
    if (posM.length > 12) {
      const byMonth = new Map<string, { t: number; amount: number; count: number }>();
      for (const m of posM) {
        const d = new Date(m.t);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const e = byMonth.get(key) || { t: new Date(d.getFullYear(), d.getMonth(), 15).getTime(), amount: 0, count: 0 };
        e.amount += m.amount; e.count += 1;
        byMonth.set(key, e);
      }
      poMarkers = [...byMonth.values()].map(e => ({
        pct: ((e.t - start) / (end - start)) * 100,
        label: `${e.count} BdC · ${fmt(currency, e.amount)}`,
        count: e.count,
      }));
    } else {
      poMarkers = posM.map(m => ({
        pct: ((m.t - start) / (end - start)) * 100,
        label: `${m.label} · ${fmt(currency, m.amount)}`,
        count: 1,
      }));
    }

    const bigThreshold = Math.max(initialAmount * 0.05, 500);
    const horsBdc = data.invoices
      .filter(inv => !inv.purchase_order_id && inv.invoice_date)
      .map(inv => ({
        pct: ((new Date(inv.invoice_date as string).getTime() - start) / (end - start)) * 100,
        amount: htOf(inv),
        big: htOf(inv) >= bigThreshold,
        label: `${inv.invoice_number ?? 'Facture'} · ${inv.supplier_name ?? ''} · ${fmt(currency, htOf(inv))} (hors BdC)`,
      }))
      .filter(m => m.pct >= -3 && m.pct <= 103);

    return { start, end, elapsed, reconnu, comptabilise, fnp, cca, poMarkers, horsBdc };
  }, [data, startDate, endDate, initialAmount, currency]);

  const clampPct = (n: number) => Math.min(100, Math.max(0, n));
  // Échelle de la barre montants : max(budget, comptabilisé) pour absorber un dépassement
  const scaleMax = model ? Math.max(initialAmount, model.comptabilise) || 1 : 1;
  const amountPct = (n: number) => clampPct((n / scaleMax) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg">Reconnaissance</CardTitle>
            <CardDescription>
              Linéaire entre les dates du projet — provisions par différentiel d'engagement.
            </CardDescription>
          </div>
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            {([['ca', 'CA'], ['charges', 'Charges'], ['marge', 'Marge']] as const).map(([k, label]) => {
              const disabled = k !== 'charges';
              return (
                <button
                  key={k}
                  type="button"
                  disabled={disabled}
                  title={disabled ? 'À venir — nécessite la facturation client (POC facturation Qonto ou plateforme agréée).' : undefined}
                  onClick={() => setAggregate(k)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    aggregate === k ? 'bg-background shadow-sm font-medium'
                      : disabled ? 'text-muted-foreground/40 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!startDate || !endDate ? (
          <p className="text-sm text-destructive py-4 text-center">
            Dates de projet manquantes — la reconnaissance ne peut pas être calculée.
          </p>
        ) : !model ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Chargement…</p>
        ) : (
          <div className="space-y-5">
            {/* ——— Barre de reconnaissance (montants, HT) ——— */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Charges reconnues à date : <span className="font-semibold text-foreground">{fmt(currency, model.reconnu)}</span></span>
                <span>Budget : {fmt(currency, initialAmount)}</span>
              </div>
              <div className="relative h-9 rounded-md bg-muted/50 overflow-visible">
                {/* comptabilisé (plein) — jusqu'au reco au plus, le surplus = CCA */}
                <div
                  className="absolute inset-y-0 left-0 rounded-l-md"
                  style={{ width: `${amountPct(Math.min(model.comptabilise, model.reconnu))}%`, background: C.compta }}
                  title={`Charges comptabilisées (factures HT) : ${fmt(currency, model.comptabilise)}`}
                />
                {/* FNP : complète le comptabilisé jusqu'au reco, hachuré */}
                {model.fnp > 0 && (
                  <div
                    className="absolute inset-y-0"
                    style={{
                      left: `${amountPct(model.comptabilise)}%`,
                      width: `${amountPct(model.reconnu) - amountPct(model.comptabilise)}%`,
                      background: `repeating-linear-gradient(45deg, ${C.fnp}55, ${C.fnp}55 6px, transparent 6px, transparent 12px)`,
                      borderRight: `2px solid ${C.reco}`,
                    }}
                    title={`FNP (différentiel d'engagement) : ${fmt(currency, model.fnp)}`}
                  />
                )}
                {/* CCA : le comptabilisé dépasse le reco — provision qui rabote,
                    en transparence AU-DELÀ du curseur, flèche vers l'arrière */}
                {model.cca > 0 && (
                  <div
                    className="absolute inset-y-0 flex items-center justify-center"
                    style={{
                      left: `${amountPct(model.reconnu)}%`,
                      width: `${amountPct(model.comptabilise) - amountPct(model.reconnu)}%`,
                      background: `${C.cca}33`,
                      borderLeft: `2px solid ${C.reco}`,
                    }}
                    title={`CCA : ${fmt(currency, model.cca)} comptabilisés au-delà du reconnu — la provision rabote la reco`}
                  >
                    <span className="text-[10px] font-semibold" style={{ color: C.cca }}>← CCA</span>
                  </div>
                )}
                {/* curseur reconnu */}
                <div
                  className="absolute -top-1 -bottom-1 w-0.5"
                  style={{ left: `${amountPct(model.reconnu)}%`, background: C.reco }}
                  title={`Reconnu à date : ${fmt(currency, model.reconnu)}`}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: C.compta }} /> Comptabilisé HT {fmt(currency, model.comptabilise)}</span>
                {model.fnp > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: `${C.fnp}88` }} /> FNP {fmt(currency, model.fnp)}</span>}
                {model.cca > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: `${C.cca}55` }} /> CCA {fmt(currency, model.cca)}</span>}
                <span className="flex items-center gap-1"><span className="h-2 w-0.5" style={{ background: C.reco }} /> Reconnu ({Math.round(model.elapsed * 100)} % de la période)</span>
              </div>
            </div>

            {/* ——— Axe du temps : jalons BdC + factures hors BdC ——— */}
            <div>
              <div className="relative h-12 border-t border-border mt-2">
                {/* aujourd'hui */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/60"
                  style={{ left: `${clampPct(model.elapsed * 100)}%` }}
                  title="Aujourd'hui"
                />
                {/* BdC */}
                {model.poMarkers.map((m, i) => (
                  <div
                    key={`po-${i}`}
                    className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${clampPct(m.pct)}%` }}
                    title={m.label}
                  >
                    <span className="h-3 w-1 rounded-sm" style={{ background: C.po }} />
                    {m.count > 1 && <span className="text-[9px] text-muted-foreground leading-tight">×{m.count}</span>}
                  </div>
                ))}
                {/* factures hors BdC (les grosses ressortent) */}
                {model.horsBdc.map((m, i) => (
                  <div
                    key={`inv-${i}`}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${clampPct(m.pct)}%`, top: m.big ? '14px' : '20px' }}
                    title={m.label}
                  >
                    <span
                      className="block rotate-45"
                      style={{
                        width: m.big ? 10 : 6,
                        height: m.big ? 10 : 6,
                        background: C.invoice,
                        opacity: m.big ? 1 : 0.6,
                      }}
                    />
                  </div>
                ))}
                <span className="absolute left-0 -bottom-0.5 text-[10px] text-muted-foreground">
                  {new Date(model.start).toLocaleDateString('fr-FR')}
                </span>
                <span className="absolute right-0 -bottom-0.5 text-[10px] text-muted-foreground">
                  {new Date(model.end).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-3 w-1 rounded-sm" style={{ background: C.po }} /> BdC envoyés</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rotate-45" style={{ background: C.invoice }} /> Factures hors BdC (grosses en plein)</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetRecognitionTimeline;
