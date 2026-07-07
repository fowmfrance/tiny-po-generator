import React, { useMemo, useState } from 'react';
import { Landmark, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { getInitials, getMonogramColor } from '@/utils/monogram';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

// Statuts de BC considérés comme "engagés" (hors brouillon / rejeté)
const COMMITTED = new Set(['pending', 'approved', 'sent', 'matched', 'paid']);

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Row {
  supplierId: string;
  name: string;
  engaged: number;
  invoiced: number;
  realized: number;
  fnp: number;
}

const CutOffClosing = () => {
  const { purchaseOrders, isLoading: poLoading } = usePurchaseOrders();
  const { invoices, isLoading: invLoading } = useSupplierInvoices();
  const [cutoff, setCutoff] = useState<string>(todayISO());
  const [rate, setRate] = useState<number>(100);

  const rows = useMemo<Row[]>(() => {
    const cut = new Date(cutoff);
    const map = new Map<string, Row>();

    const ensure = (id: string, name: string) => {
      if (!map.has(id)) map.set(id, { supplierId: id, name, engaged: 0, invoiced: 0, realized: 0, fnp: 0 });
      return map.get(id)!;
    };

    // Engagé = BC committed, date ≤ cutoff
    for (const po of purchaseOrders as any[]) {
      if (!po.supplier_id || !COMMITTED.has(po.status)) continue;
      if (new Date(po.created_at) > cut) continue;
      const r = ensure(po.supplier_id, po.supplier?.name || 'Fournisseur inconnu');
      r.engaged += Number(po.total_amount || 0);
    }

    // Facturé = factures reçues ≤ cutoff (hors annulées)
    for (const inv of invoices as any[]) {
      if (!inv.supplier_id || inv.status === 'cancelled') continue;
      const d = inv.received_date || inv.invoice_date;
      if (d && new Date(d) > cut) continue;
      const r = ensure(inv.supplier_id, inv.supplier?.name || 'Fournisseur inconnu');
      r.invoiced += Number(inv.amount || 0);
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

  const totalFNP = useMemo(() => rows.reduce((s, r) => s + r.fnp, 0), [rows]);
  const withFNP = rows.filter((r) => r.fnp > 0);
  const isLoading = poLoading || invLoading;

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
          <input
            type="date"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            className="h-9 rounded-[10px] border border-border bg-card px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Taux réalisé par défaut (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="h-9 w-28 rounded-[10px] border border-border bg-card px-3 text-sm"
          />
        </div>
      </div>

      {/* Récap */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">FNP totale proposée</div>
          <div className="text-3xl font-bold tracking-tight text-brand mt-1">{fmt(totalFNP)}</div>
          <div className="text-xs text-muted-foreground mt-1">au {new Date(cutoff).toLocaleDateString('fr-FR')}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">Fournisseurs concernés</div>
          <div className="text-3xl font-bold tracking-tight text-foreground mt-1">{withFNP.length}</div>
          <div className="text-xs text-muted-foreground mt-1">avec un solde engagé non facturé</div>
        </div>
        <div className="rounded-xl border border-border bg-brand-subtle p-5 flex items-start gap-2">
          <Info className="h-4 w-4 text-brand mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            Génération des écritures (compte 408 + extourne) et export comptable :
            <span className="text-foreground font-medium"> increment 2</span>. Pondération fine par jalons : increment 3.
          </div>
        </div>
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-brand" />
            Détail par fournisseur
          </CardTitle>
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
                <span className="text-right">FNP proposée</span>
              </div>
              {withFNP.map((r) => {
                const mono = getMonogramColor(r.name);
                return (
                  <div
                    key={r.supplierId}
                    className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center border-b border-border/60 last:border-0 text-sm"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-medium shrink-0"
                        style={{ backgroundColor: mono.bg, color: mono.fg }}
                      >
                        {getInitials(r.name)}
                      </span>
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
    </div>
  );
};

export default CutOffClosing;
