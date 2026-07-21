// Onglet Reporting du module Notes de frais.
// Croise les frais d'une PÉRIODE LIBRE selon trois axes : entreprise (via les
// participants), type de frais, contact. Chaque ligne est un filtre cliquable
// (drill-down cumulable) — c'est le même objet « contact » que celui rendu
// cliquable sur les cartes frais et agenda.
//
// ⚠️ Attribution par entreprise/contact : un frais à plusieurs participants est
// compté ENTIÈREMENT pour chacun (c'est le coût de la relation, pas une clé de
// répartition comptable). La somme des lignes peut donc dépasser le total —
// signalé explicitement sous le tableau quand c'est le cas.
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Download, ReceiptText, UserRound, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CATEGORY_META } from './categoryMeta';

export interface ReportGuest { display_name: string; company_name: string | null }

export interface ReportExpense {
  id: string;
  merchant_clean: string | null;
  merchant_raw: string | null;
  amount: number;
  amount_ht: number | null;
  vat_amount: number | null;
  occurred_at: string;
  te_category: string | null;
  status: string;
  te_expense_guests: ReportGuest[] | null;
}

export interface ReportFilter {
  company?: string;
  category?: string;
  contact?: string;
}

const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

// Présélections de période — « Personnalisé » dès qu'on touche aux dates.
const PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  {
    key: 'month',
    label: 'Ce mois-ci',
    range: () => {
      const n = new Date();
      return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(n)];
    },
  },
  {
    key: 'last-month',
    label: 'Mois dernier',
    range: () => {
      const n = new Date();
      return [
        iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)),
        iso(new Date(n.getFullYear(), n.getMonth(), 0)),
      ];
    },
  },
  {
    key: 'quarter',
    label: '3 derniers mois',
    range: () => {
      const n = new Date();
      return [iso(new Date(n.getFullYear(), n.getMonth() - 2, 1)), iso(n)];
    },
  },
  {
    key: 'year',
    label: 'Année en cours',
    range: () => {
      const n = new Date();
      return [iso(new Date(n.getFullYear(), 0, 1)), iso(n)];
    },
  },
];

const NO_VALUE = '—';

interface Row { key: string; label: string; count: number; total: number }

// Agrège les frais par clé ; `keys()` peut renvoyer plusieurs clés par frais
// (un dîner à 3 entreprises alimente 3 lignes).
function aggregate(expenses: ReportExpense[], keys: (e: ReportExpense) => string[]): Row[] {
  const map = new Map<string, Row>();
  for (const e of expenses) {
    for (const k of keys(e)) {
      const row = map.get(k) ?? { key: k, label: k, count: 0, total: 0 };
      row.count += 1;
      row.total += Number(e.amount) || 0;
      map.set(k, row);
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

const companiesOf = (e: ReportExpense) => {
  const cs = (e.te_expense_guests ?? [])
    .map((g) => (g.company_name ?? '').trim())
    .filter(Boolean);
  return cs.length ? [...new Set(cs)] : [NO_VALUE];
};

const contactsOf = (e: ReportExpense) => {
  const cs = (e.te_expense_guests ?? [])
    .map((g) => g.display_name.trim())
    .filter(Boolean);
  return cs.length ? [...new Set(cs)] : [NO_VALUE];
};

interface Props {
  expenses: ReportExpense[];
  filter: ReportFilter;
  setFilter: (f: ReportFilter) => void;
  onOpenExpense: (id: string) => void;
}

const FraisReporting: React.FC<Props> = ({ expenses, filter, setFilter, onOpenExpense }) => {
  const [preset, setPreset] = useState('quarter');
  const [[from, to], setRange] = useState<[string, string]>(() => PRESETS[2].range());

  const applyPreset = (key: string) => {
    const p = PRESETS.find((x) => x.key === key);
    if (!p) return;
    setPreset(key);
    setRange(p.range());
  };

  // Frais de la période (les rejetés ne comptent pas comme dépense analysable).
  const inPeriod = useMemo(() => expenses.filter((e) => {
    if (e.status === 'rejected') return false;
    const d = e.occurred_at.slice(0, 10);
    return (!from || d >= from) && (!to || d <= to);
  }), [expenses, from, to]);

  // Puis les filtres croisés (cumulables).
  const filtered = useMemo(() => inPeriod.filter((e) => {
    if (filter.company && !companiesOf(e).includes(filter.company)) return false;
    if (filter.category && (e.te_category ?? NO_VALUE) !== filter.category) return false;
    if (filter.contact && !contactsOf(e).includes(filter.contact)) return false;
    return true;
  }), [inPeriod, filter]);

  const totals = useMemo(() => ({
    ttc: filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    ht: filtered.reduce((s, e) => s + (Number(e.amount_ht) || 0), 0),
    tva: filtered.reduce((s, e) => s + (Number(e.vat_amount) || 0), 0),
    count: filtered.length,
  }), [filtered]);

  const byCompany = useMemo(() => aggregate(filtered, companiesOf), [filtered]);
  const byCategory = useMemo(
    () => aggregate(filtered, (e) => [e.te_category ?? NO_VALUE]), [filtered]);
  const byContact = useMemo(() => aggregate(filtered, contactsOf), [filtered]);

  // Un frais multi-entreprises fausse la somme des lignes : on le dit.
  const multiCompany = filtered.filter((e) => companiesOf(e).length > 1).length;
  const multiContact = filtered.filter((e) => contactsOf(e).length > 1).length;

  const toggle = (k: keyof ReportFilter, v: string) =>
    setFilter({ ...filter, [k]: filter[k] === v ? undefined : v });

  const activeFilters = ([
    ['company', filter.company, Building2],
    ['category', filter.category, ReceiptText],
    ['contact', filter.contact, UserRound],
  ] as const).filter(([, v]) => !!v);

  const exportCsv = () => {
    const head = ['Date', 'Fournisseur', 'Type', 'Participants', 'Entreprises', 'HT', 'TVA', 'TTC'];
    const rows = filtered.map((e) => [
      e.occurred_at.slice(0, 10),
      e.merchant_clean ?? e.merchant_raw ?? '',
      e.te_category ? CATEGORY_META[e.te_category]?.label ?? e.te_category : '',
      contactsOf(e).filter((c) => c !== NO_VALUE).join(' / '),
      companiesOf(e).filter((c) => c !== NO_VALUE).join(' / '),
      e.amount_ht ?? '',
      e.vat_amount ?? '',
      e.amount,
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `frais_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTable = (
    title: string, icon: React.ElementType, rows: Row[],
    field: keyof ReportFilter, warn: number,
    labelOf: (k: string) => string = (k) => k,
  ) => {
    const Icon = icon;
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {rows.length === 0 ? (
            <div className="text-xs text-muted-foreground py-3 text-center">Aucun frais sur la période.</div>
          ) : (
            <div className="space-y-1">
              {rows.slice(0, 8).map((r) => {
                const share = totals.ttc > 0 ? (r.total / totals.ttc) * 100 : 0;
                const active = filter[field] === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => toggle(field, r.key)}
                    className={`w-full text-left rounded-md px-2 py-1.5 transition-colors ${active ? 'bg-brand/10' : 'hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                      <span className={`truncate ${active ? 'font-medium text-brand' : ''}`}>
                        {labelOf(r.label)}
                      </span>
                      <span className="shrink-0 tabular-nums">{euro(r.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-brand/60" style={{ width: `${Math.max(2, share)}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {r.count} frais · {Math.round(share)} %
                      </span>
                    </div>
                  </button>
                );
              })}
              {warn > 0 && (
                <p className="text-[10px] text-muted-foreground pt-1">
                  {warn} frais à plusieurs {field === 'company' ? 'entreprises' : 'participants'} :
                  compté en entier pour chacun, la somme dépasse donc le total.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Période */}
      <Card>
        <CardContent className="pt-4 pb-4 flex flex-wrap items-end gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map((p) => (
              <Button
                key={p.key}
                type="button"
                size="sm"
                variant={preset === p.key ? 'default' : 'outline'}
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex items-end gap-2 ml-auto">
            <div className="space-y-1">
              <Label htmlFor="rep-from" className="text-[11px] text-muted-foreground">Du</Label>
              <Input id="rep-from" type="date" className="h-8 w-[150px]" value={from}
                onChange={(e) => { setPreset('custom'); setRange([e.target.value, to]); }} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rep-to" className="text-[11px] text-muted-foreground">Au</Label>
              <Input id="rep-to" type="date" className="h-8 w-[150px]" value={to}
                onChange={(e) => { setPreset('custom'); setRange([from, e.target.value]); }} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-1.5" /> CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtres actifs */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">Filtres :</span>
          {activeFilters.map(([field, value, Icon]) => (
            <Badge key={field} variant="secondary" className="gap-1 pr-1">
              <Icon className="h-3 w-3" />
              {field === 'category' && value
                ? CATEGORY_META[value]?.label ?? value
                : value}
              <button type="button" className="ml-0.5 rounded hover:bg-background/60"
                onClick={() => setFilter({ ...filter, [field]: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs"
            onClick={() => setFilter({})}>
            Tout effacer
          </Button>
        </div>
      )}

      {/* Totaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total TTC', value: euro(totals.ttc) },
          { label: 'Total HT', value: totals.ht > 0 ? euro(totals.ht) : '—' },
          { label: 'TVA', value: totals.tva > 0 ? euro(totals.tva) : '—' },
          { label: 'Frais', value: String(totals.count) },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="py-3">
              <div className="text-[11px] text-muted-foreground">{k.label}</div>
              <div className="text-xl font-semibold tabular-nums">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Axes d'analyse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {renderTable('Par entreprise', Building2, byCompany, 'company', multiCompany)}
        {renderTable('Par type de frais', ReceiptText, byCategory, 'category', 0,
          (k) => CATEGORY_META[k]?.label ?? k)}
        {renderTable('Par contact', UserRound, byContact, 'contact', multiContact)}
      </div>

      {/* Détail */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Détail{filtered.length > 0 && ` (${filtered.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Aucun frais ne correspond à ces critères.
            </div>
          ) : (
            <div className="divide-y">
              {filtered
                .slice()
                .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onOpenExpense(e.id)}
                    className="w-full text-left py-2 flex items-center gap-3 hover:bg-muted/40 px-2 -mx-2 rounded"
                  >
                    <span className="text-xs text-muted-foreground w-24 shrink-0 tabular-nums">
                      {format(new Date(e.occurred_at), 'd MMM yyyy', { locale: fr })}
                    </span>
                    <span className="text-sm font-medium truncate min-w-0 flex-1">
                      {e.merchant_clean ?? e.merchant_raw ?? 'Marchand inconnu'}
                    </span>
                    <span className="hidden md:flex gap-1 shrink-0">
                      {contactsOf(e).filter((c) => c !== NO_VALUE).slice(0, 2).map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                      ))}
                    </span>
                    <span className="text-sm font-semibold shrink-0 tabular-nums">{euro(e.amount)}</span>
                  </button>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FraisReporting;
