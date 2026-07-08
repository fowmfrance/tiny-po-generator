import React, { useEffect, useMemo, useState } from 'react';
import { Landmark, Info, FileSpreadsheet, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { supabase } from '@/integrations/supabase/client';
import { getInitials, getMonogramColor } from '@/utils/monogram';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmt2 = (n: number) => n.toFixed(2).replace('.', ',');

// Statuts de BC considérés comme "engagés" (hors brouillon / rejeté)
const COMMITTED = new Set(['pending', 'approved', 'sent', 'matched', 'paid']);

// Comptes par défaut (paramétrables dans l'UI)
const DEFAULT_CHARGE_ACCOUNT = '604000'; // Achats d'études et prestations de services
const VAT_ACCOUNT = '44586'; // TVA sur factures non parvenues
const SUPPLIER_ACCOUNT = '4081'; // Fournisseurs - factures non parvenues

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const frDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

interface Row {
  supplierId: string;
  name: string;
  engaged: number;
  invoiced: number;
  realized: number;
  fnp: number;
}
interface JournalLine {
  date: string;
  journal: string;
  compte: string;
  auxiliaire: string;
  libelle: string;
  debit: number;
  credit: number;
}

const CutOffClosing = () => {
  const { purchaseOrders, isLoading: poLoading } = usePurchaseOrders();
  const { invoices, isLoading: invLoading } = useSupplierInvoices();
  const [cutoff, setCutoff] = useState<string>(todayISO());
  const [rate, setRate] = useState<number>(100);
  const [vatRate, setVatRate] = useState<number>(20);
  const [chargeAccount, setChargeAccount] = useState<string>(DEFAULT_CHARGE_ACCOUNT);
  const [showEntries, setShowEntries] = useState(false);
  const [auxMap, setAuxMap] = useState<Map<string, string | null>>(new Map());

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('suppliers').select('id, code_auxiliaire');
      if (active && data) setAuxMap(new Map(data.map((s: any) => [s.id, s.code_auxiliaire])));
    })();
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo<Row[]>(() => {
    const cut = new Date(cutoff);
    const map = new Map<string, Row>();
    const ensure = (id: string, name: string) => {
      if (!map.has(id)) map.set(id, { supplierId: id, name, engaged: 0, invoiced: 0, realized: 0, fnp: 0 });
      return map.get(id)!;
    };
    for (const po of purchaseOrders as any[]) {
      if (!po.supplier_id || !COMMITTED.has(po.status)) continue;
      if (new Date(po.created_at) > cut) continue;
      ensure(po.supplier_id, po.supplier?.name || 'Fournisseur inconnu').engaged += Number(po.total_amount || 0);
    }
    for (const inv of invoices as any[]) {
      if (!inv.supplier_id || inv.status === 'cancelled') continue;
      const d = inv.received_date || inv.invoice_date;
      if (d && new Date(d) > cut) continue;
      ensure(inv.supplier_id, inv.supplier?.name || 'Fournisseur inconnu').invoiced += Number(inv.amount || 0);
    }
    const factor = Math.max(0, rate) / 100;
    const list: Row[] = [];
    for (const r of map.values()) {
      r.realized = r.engaged * factor;
      r.fnp = Math.max(0, r.realized - r.invoiced);
      if (r.engaged > 0 || r.fnp > 0) list.push(r);
    }
    return list.sort((a, b) => b.fnp - a.fnp);
  }, [purchaseOrders, invoices, cutoff, rate]);

  const withFNP = rows.filter((r) => r.fnp > 0);
  const totalFNP = withFNP.reduce((s, r) => s + r.fnp, 0);
  const isLoading = poLoading || invLoading;

  // --- Increment 2 : génération de l'écriture FNP + extourne ---
  const journal = useMemo<JournalLine[]>(() => {
    const reversal = addDaysISO(cutoff, 1);
    const vf = Math.max(0, vatRate) / 100;
    const lines: JournalLine[] = [];
    for (const r of withFNP) {
      const ht = r.fnp;
      const tva = Math.round(ht * vf * 100) / 100;
      const ttc = Math.round((ht + tva) * 100) / 100;
      const aux = auxMap.get(r.supplierId) || r.name;
      const lib = `FNP ${frDate(cutoff)} - ${r.name}`;
      const libX = `Extourne FNP ${frDate(cutoff)} - ${r.name}`;
      // Écriture de clôture
      lines.push({ date: cutoff, journal: 'OD', compte: chargeAccount, auxiliaire: '', libelle: lib, debit: ht, credit: 0 });
      if (tva > 0)
        lines.push({ date: cutoff, journal: 'OD', compte: VAT_ACCOUNT, auxiliaire: '', libelle: lib, debit: tva, credit: 0 });
      lines.push({ date: cutoff, journal: 'OD', compte: SUPPLIER_ACCOUNT, auxiliaire: aux, libelle: lib, debit: 0, credit: ttc });
      // Extourne à l'ouverture (J+1)
      lines.push({ date: reversal, journal: 'OD', compte: chargeAccount, auxiliaire: '', libelle: libX, debit: 0, credit: ht });
      if (tva > 0)
        lines.push({ date: reversal, journal: 'OD', compte: VAT_ACCOUNT, auxiliaire: '', libelle: libX, debit: 0, credit: tva });
      lines.push({ date: reversal, journal: 'OD', compte: SUPPLIER_ACCOUNT, auxiliaire: aux, libelle: libX, debit: ttc, credit: 0 });
    }
    return lines;
  }, [withFNP, cutoff, vatRate, chargeAccount, auxMap]);

  const totalDebit = journal.reduce((s, l) => s + l.debit, 0);
  const totalCredit = journal.reduce((s, l) => s + l.credit, 0);

  const exportCSV = () => {
    const header = ['Date', 'Journal', 'Compte', 'Auxiliaire', 'Libellé', 'Débit', 'Crédit'];
    const body = journal.map((l) =>
      [frDate(l.date), l.journal, l.compte, l.auxiliaire, l.libelle, l.debit ? fmt2(l.debit) : '', l.credit ? fmt2(l.credit) : ''].join(';')
    );
    const csv = [header.join(';'), ...body].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FNP_${cutoff}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Clôture — Factures Non Parvenues</h1>
        <p className="text-sm text-muted-foreground mt-1">
          FNP calculées automatiquement par différentiel d'engagement (BC engagés − facturé), sans saisie du montant.
        </p>
      </div>

      {/* Contrôles */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Date de cut-off</label>
          <input type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)}
            className="h-9 rounded-[10px] border border-border bg-card px-3 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Taux réalisé (%)</label>
          <input type="number" min={0} max={100} value={rate} onChange={(e) => setRate(Number(e.target.value))}
            className="h-9 w-24 rounded-[10px] border border-border bg-card px-3 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">TVA (%)</label>
          <input type="number" min={0} max={100} value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))}
            className="h-9 w-24 rounded-[10px] border border-border bg-card px-3 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Compte de charge</label>
          <input type="text" value={chargeAccount} onChange={(e) => setChargeAccount(e.target.value)}
            className="h-9 w-28 rounded-[10px] border border-border bg-card px-3 text-sm" />
        </div>
      </div>

      {/* Récap */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">FNP totale proposée (HT)</div>
          <div className="text-3xl font-bold tracking-tight text-brand mt-1">{fmt(totalFNP)}</div>
          <div className="text-xs text-muted-foreground mt-1">au {frDate(cutoff)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">Fournisseurs concernés</div>
          <div className="text-3xl font-bold tracking-tight text-foreground mt-1">{withFNP.length}</div>
          <div className="text-xs text-muted-foreground mt-1">avec un solde engagé non facturé</div>
        </div>
        <div className="rounded-xl border border-border bg-brand-subtle p-5 flex items-start gap-2">
          <Info className="h-4 w-4 text-brand mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            Écriture compte 408 + TVA {VAT_ACCOUNT} + charge, avec <span className="text-foreground font-medium">extourne à J+1</span>.
            Pondération fine par jalons : increment 3.
          </div>
        </div>
      </div>

      {/* Détail par fournisseur */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-brand" />
            Détail par fournisseur
          </CardTitle>
          {withFNP.length > 0 && (
            <button
              onClick={() => setShowEntries(true)}
              className="inline-flex items-center gap-2 rounded-[10px] bg-brand text-brand-foreground px-3.5 py-2 text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Générer les écritures
            </button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Chargement…</p>
          ) : withFNP.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Aucune FNP à cette date : tout l'engagé réalisé est déjà facturé.
            </p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 text-xs text-muted-foreground bg-muted/40 border-b border-border">
                <span>Fournisseur</span>
                <span className="text-right">Engagé (BC)</span>
                <span className="text-right">Réalisé</span>
                <span className="text-right">Facturé</span>
                <span className="text-right">FNP (HT)</span>
              </div>
              {withFNP.map((r) => {
                const mono = getMonogramColor(r.name);
                return (
                  <div key={r.supplierId}
                    className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center border-b border-border/60 last:border-0 text-sm">
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-medium shrink-0"
                        style={{ backgroundColor: mono.bg, color: mono.fg }}>{getInitials(r.name)}</span>
                      <span className="truncate">{r.name}</span>
                    </span>
                    <span className="text-right tabular-nums text-muted-foreground">{fmt(r.engaged)}</span>
                    <span className="text-right tabular-nums text-muted-foreground">{fmt(r.realized)}</span>
                    <span className="text-right tabular-nums text-muted-foreground">{fmt(r.invoiced)}</span>
                    <span className="text-right tabular-nums font-semibold text-brand">{fmt(r.fnp)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Écritures comptables (increment 2) */}
      {showEntries && journal.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Journal des écritures FNP + extourne</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Clôture au {frDate(cutoff)} · extourne au {frDate(addDaysISO(cutoff, 1))} ·
                équilibre débit/crédit&nbsp;: {fmt2(totalDebit)} / {fmt2(totalCredit)}
                {Math.abs(totalDebit - totalCredit) < 0.01 ? ' ✓' : ' ⚠'}
              </p>
            </div>
            <button onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-[10px] bg-card border border-border px-3.5 py-2 text-sm font-medium text-foreground hover:border-slate-300 hover:bg-muted/50 transition-colors">
              <Download className="h-4 w-4 text-muted-foreground" />
              Exporter le journal (CSV)
            </button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground bg-muted/40 border-b border-border">
                    <th className="text-left font-normal px-3 py-2">Date</th>
                    <th className="text-left font-normal px-3 py-2">Jnl</th>
                    <th className="text-left font-normal px-3 py-2">Compte</th>
                    <th className="text-left font-normal px-3 py-2">Auxiliaire</th>
                    <th className="text-left font-normal px-3 py-2">Libellé</th>
                    <th className="text-right font-normal px-3 py-2">Débit</th>
                    <th className="text-right font-normal px-3 py-2">Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.map((l, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">{frDate(l.date)}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{l.journal}</td>
                      <td className="px-3 py-1.5 font-medium tabular-nums">{l.compte}</td>
                      <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[140px]">{l.auxiliaire}</td>
                      <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[220px]">{l.libelle}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{l.debit ? fmt2(l.debit) : ''}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{l.credit ? fmt2(l.credit) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CutOffClosing;
