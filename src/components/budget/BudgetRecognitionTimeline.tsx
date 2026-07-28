import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

/**
 * Reconnaissance entre les dates du projet — doctrine Sapajoo : reco linéaire
 * (défaut), provisions par DIFFÉRENTIEL de lissage.
 *
 * Charges : comptabilisé (factures fournisseurs HT) + FNP hachurée jusqu'au
 * curseur reco ; CCA (comptabilisé > reco) en transparence AU-DELÀ du curseur,
 * flèche arrière — la provision rabote, elle ne gonfle pas la barre.
 * CA : facturé (factures clients − avoirs, HT, miroir Qonto) + FAE ; PCA en
 * rabot symétrique. Marge : trois repères (reconnue / constatée / cible).
 */

interface BudgetRecognitionTimelineProps {
  budgetId: string;
  budgetCode: string;
  currency: string;
  initialAmount: number;
  resalePrice?: number | null;
  startDate: string | null;
  endDate: string | null;
}

type Aggregate = 'ca' | 'charges' | 'marge';

const C = {
  compta: '#B8853A',   // ocre — charges comptabilisées
  facture: '#4A7C59',  // vert — CA facturé
  rabot: '#9F3372',    // mûre translucide — provision qui rabote (CCA/PCA)
  reco: '#1A1914',     // encre — curseur reconnu
  po: '#6B6860',       // gris chaud — ticks BdC
  invoice: '#BF2237',  // carmin — factures hors BdC / avoirs
};

const DAY = 24 * 3600 * 1000;

const fmt = (currency: string, n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 0 }).format(n);

interface Marker { pct: number; label: string; kind: 'po' | 'invoice' | 'credit'; big?: boolean; count?: number }

/** Barre générique constaté + provision (hachuré) / rabot (transparence ←) */
function RecoBar({ currency, total, constate, reconnu, elapsed, solidColor, provisionLabel, rabotLabel, constateLabel }: {
  currency: string; total: number; constate: number; reconnu: number; elapsed: number;
  solidColor: string; provisionLabel: string; rabotLabel: string; constateLabel: string;
}) {
  const provision = Math.max(0, reconnu - constate);
  const rabot = Math.max(0, constate - reconnu);
  const scaleMax = Math.max(total, constate) || 1;
  const pct = (n: number) => Math.min(100, Math.max(0, (n / scaleMax) * 100));

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Reconnu à date : <span className="font-semibold text-foreground">{fmt(currency, reconnu)}</span></span>
        <span>Total : {fmt(currency, total)}</span>
      </div>
      <div className="relative h-9 rounded-md bg-muted/50 overflow-visible">
        <div
          className="absolute inset-y-0 left-0 rounded-l-md"
          style={{ width: `${pct(Math.min(constate, reconnu))}%`, background: solidColor }}
          title={`${constateLabel} : ${fmt(currency, constate)}`}
        />
        {provision > 0 && (
          <div
            className="absolute inset-y-0"
            style={{
              left: `${pct(constate)}%`,
              width: `${pct(reconnu) - pct(constate)}%`,
              background: `repeating-linear-gradient(45deg, ${solidColor}55, ${solidColor}55 6px, transparent 6px, transparent 12px)`,
              borderRight: `2px solid ${C.reco}`,
            }}
            title={`${provisionLabel} (différentiel d'engagement) : ${fmt(currency, provision)}`}
          />
        )}
        {rabot > 0 && (
          <div
            className="absolute inset-y-0 flex items-center justify-center"
            style={{
              left: `${pct(reconnu)}%`,
              width: `${pct(constate) - pct(reconnu)}%`,
              background: `${C.rabot}33`,
              borderLeft: `2px solid ${C.reco}`,
            }}
            title={`${rabotLabel} : ${fmt(currency, rabot)} constatés au-delà du reconnu — la provision rabote la reco`}
          >
            <span className="text-[10px] font-semibold" style={{ color: C.rabot }}>← {rabotLabel}</span>
          </div>
        )}
        <div
          className="absolute -top-1 -bottom-1 w-0.5"
          style={{ left: `${pct(reconnu)}%`, background: C.reco }}
          title={`Reconnu à date : ${fmt(currency, reconnu)}`}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: solidColor }} /> {constateLabel} {fmt(currency, constate)}</span>
        {provision > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: `${solidColor}88` }} /> {provisionLabel} {fmt(currency, provision)}</span>}
        {rabot > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: `${C.rabot}55` }} /> {rabotLabel} {fmt(currency, rabot)}</span>}
        <span className="flex items-center gap-1"><span className="h-2 w-0.5" style={{ background: C.reco }} /> Reconnu ({Math.round(elapsed * 100)} % de la période)</span>
      </div>
    </div>
  );
}

const BudgetRecognitionTimeline: React.FC<BudgetRecognitionTimelineProps> = ({
  budgetId, budgetCode, currency, initialAmount, resalePrice, startDate, endDate,
}) => {
  const [aggregate, setAggregate] = useState<Aggregate>('charges');
  const hasResale = typeof resalePrice === 'number' && resalePrice > 0;

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
      invQuery = poIds.length > 0
        ? invQuery.or(`purchase_order_id.in.(${poIds.join(',')}),and(project_code.eq.${budgetCode},purchase_order_id.is.null)`)
        : invQuery.eq('project_code', budgetCode).is('purchase_order_id', null);
      const { data: invoices, error: invErr } = await invQuery;
      if (invErr) throw invErr;

      return { pos: pos || [], invoices: invoices || [] };
    },
  });

  // CA : factures clients (miroir Qonto) rattachées au budget
  const { data: caInvoices = [] } = useQuery({
    queryKey: ['budget-reco-ca', budgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_invoices')
        .select('id, number, amount_ht, issue_date, is_credit_note, client_name')
        .eq('budget_id', budgetId);
      if (error) throw error;
      return data || [];
    },
  });

  const model = useMemo(() => {
    if (!startDate || !endDate || !data) return null;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end <= start) return null;
    const now = Date.now();
    const elapsed = Math.min(1, Math.max(0, (now - start) / (end - start)));
    const timePct = (t: number) => ((t - start) / (end - start)) * 100;

    const htOf = (row: { amount_ht: number | null; amount?: number | null }) =>
      Number(row.amount_ht ?? row.amount ?? 0);

    // ——— Charges ———
    const comptabilise = data.invoices.reduce((s, inv) => s + htOf(inv), 0);

    const posM = data.pos.map(po => ({
      t: new Date(po.created_at).getTime(),
      amount: Number(po.amount_ht ?? po.total_amount ?? 0),
      label: `${po.po_number} · ${po.supplier_name ?? ''}`,
    })).filter(m => m.t >= start - 15 * DAY && m.t <= end + 15 * DAY);

    let chargeMarkers: Marker[];
    if (posM.length > 12) {
      const byMonth = new Map<string, { t: number; amount: number; count: number }>();
      for (const m of posM) {
        const d = new Date(m.t);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const e = byMonth.get(key) || { t: new Date(d.getFullYear(), d.getMonth(), 15).getTime(), amount: 0, count: 0 };
        e.amount += m.amount; e.count += 1;
        byMonth.set(key, e);
      }
      chargeMarkers = [...byMonth.values()].map(e => ({
        pct: timePct(e.t), label: `${e.count} BdC · ${fmt(currency, e.amount)}`, kind: 'po' as const, count: e.count,
      }));
    } else {
      chargeMarkers = posM.map(m => ({ pct: timePct(m.t), label: `${m.label} · ${fmt(currency, m.amount)}`, kind: 'po' as const, count: 1 }));
    }

    const bigThreshold = Math.max(initialAmount * 0.05, 500);
    chargeMarkers.push(...data.invoices
      .filter(inv => !inv.purchase_order_id && inv.invoice_date)
      .map(inv => ({
        pct: timePct(new Date(inv.invoice_date as string).getTime()),
        label: `${inv.invoice_number ?? 'Facture'} · ${inv.supplier_name ?? ''} · ${fmt(currency, htOf(inv))} (hors BdC)`,
        kind: 'invoice' as const,
        big: htOf(inv) >= bigThreshold,
      }))
      .filter(m => m.pct >= -3 && m.pct <= 103));

    // ——— CA ———
    const facture = caInvoices.reduce((s, inv) => s + Number(inv.amount_ht ?? 0), 0);
    const caMarkers: Marker[] = caInvoices
      .filter(inv => inv.issue_date)
      .map(inv => ({
        pct: timePct(new Date(inv.issue_date as string).getTime()),
        label: `${inv.number ?? (inv.is_credit_note ? 'Avoir' : 'Facture')} · ${inv.client_name ?? ''} · ${fmt(currency, Number(inv.amount_ht ?? 0))}`,
        kind: inv.is_credit_note ? 'credit' as const : 'invoice' as const,
        big: true,
      }))
      .filter(m => m.pct >= -3 && m.pct <= 103);

    return { start, end, elapsed, comptabilise, facture, chargeMarkers, caMarkers };
  }, [data, caInvoices, startDate, endDate, initialAmount, currency]);

  const clampPct = (n: number) => Math.min(100, Math.max(0, n));

  const disabledReason = (k: Aggregate): string | null => {
    if (k === 'charges') return null;
    if (!hasResale) return 'Renseigner un prix de vente sur le budget pour suivre le CA et la marge.';
    return null;
  };

  const markers = aggregate === 'ca' ? (model?.caMarkers ?? []) : (model?.chargeMarkers ?? []);

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
              const reason = disabledReason(k);
              return (
                <button
                  key={k}
                  type="button"
                  disabled={!!reason}
                  title={reason ?? undefined}
                  onClick={() => setAggregate(k)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    aggregate === k ? 'bg-background shadow-sm font-medium'
                      : reason ? 'text-muted-foreground/40 cursor-not-allowed'
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
            {aggregate === 'charges' && (
              <RecoBar
                currency={currency}
                total={initialAmount}
                constate={model.comptabilise}
                reconnu={initialAmount * model.elapsed}
                elapsed={model.elapsed}
                solidColor={C.compta}
                constateLabel="Comptabilisé HT"
                provisionLabel="FNP"
                rabotLabel="CCA"
              />
            )}
            {aggregate === 'ca' && hasResale && (
              <>
                <RecoBar
                  currency={currency}
                  total={resalePrice as number}
                  constate={model.facture}
                  reconnu={(resalePrice as number) * model.elapsed}
                  elapsed={model.elapsed}
                  solidColor={C.facture}
                  constateLabel="Facturé HT (net d'avoirs)"
                  provisionLabel="FAE"
                  rabotLabel="PCA"
                />
                {caInvoices.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Aucune facture client rattachée à ce budget — rattachez-les depuis la page Factures clients.
                  </p>
                )}
              </>
            )}
            {aggregate === 'marge' && hasResale && (() => {
              const caReco = (resalePrice as number) * model.elapsed;
              const chargesReco = initialAmount * model.elapsed;
              const rows = [
                { label: 'Marge reconnue', hint: 'CA reconnu − charges reconnues (lissage)', value: caReco - chargesReco },
                { label: 'Marge constatée', hint: 'Facturé − comptabilisé (pièces)', value: model.facture - model.comptabilise },
                { label: 'Marge cible', hint: 'Prix de vente − charges budgétées', value: (resalePrice as number) - initialAmount },
              ];
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {rows.map(r => (
                    <div key={r.label} className="rounded-lg border bg-muted/30 px-3 py-2" title={r.hint}>
                      <p className="text-[11px] text-muted-foreground">{r.label}</p>
                      <p className={`text-sm font-semibold ${r.value < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {fmt(currency, r.value)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{r.hint}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ——— Axe du temps : jalons ——— */}
            {aggregate !== 'marge' && (
              <div>
                <div className="relative h-12 border-t border-border mt-2">
                  <div
                    className="absolute top-0 h-full w-0.5 bg-foreground/60"
                    style={{ left: `${clampPct(model.elapsed * 100)}%` }}
                    title="Aujourd'hui"
                  />
                  {markers.map((m, i) => (
                    m.kind === 'po' ? (
                      <div
                        key={i}
                        className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${clampPct(m.pct)}%` }}
                        title={m.label}
                      >
                        <span className="h-3 w-1 rounded-sm" style={{ background: C.po }} />
                        {(m.count ?? 1) > 1 && <span className="text-[9px] text-muted-foreground leading-tight">×{m.count}</span>}
                      </div>
                    ) : (
                      <div
                        key={i}
                        className="absolute -translate-x-1/2"
                        style={{ left: `${clampPct(m.pct)}%`, top: m.big ? '14px' : '20px' }}
                        title={m.label}
                      >
                        <span
                          className="block rotate-45"
                          style={{
                            width: m.big ? 10 : 6,
                            height: m.big ? 10 : 6,
                            background: m.kind === 'credit' ? C.invoice : aggregate === 'ca' ? C.facture : C.invoice,
                            opacity: m.big ? 1 : 0.6,
                          }}
                        />
                      </div>
                    )
                  ))}
                  <span className="absolute left-0 -bottom-0.5 text-[10px] text-muted-foreground">
                    {new Date(model.start).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="absolute right-0 -bottom-0.5 text-[10px] text-muted-foreground">
                    {new Date(model.end).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  {aggregate === 'charges' ? (
                    <>
                      <span className="flex items-center gap-1"><span className="h-3 w-1 rounded-sm" style={{ background: C.po }} /> BdC envoyés</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rotate-45" style={{ background: C.invoice }} /> Factures hors BdC (grosses en plein)</span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rotate-45" style={{ background: C.facture }} /> Factures émises</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rotate-45" style={{ background: C.invoice }} /> Avoirs</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetRecognitionTimeline;
