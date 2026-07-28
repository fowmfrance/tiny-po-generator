// Rapprochement notes de frais ↔ transactions carte Qonto (écran Banques).
// Deux volets, dans l'esprit des passes post-sync de l'écran Banques :
// 1. Frais existants sans transaction → proposition au MONTANT EXACT (au
//    centime, anti faux-positifs) dans une fenêtre de ±3 jours.
// 2. Transactions carte T&E (resto, hôtel, transport) sans frais → création
//    du frais en 1 clic (source card_platform, non remboursable : payé par la
//    carte société), puis matching RDV en arrière-plan.
// Le lien est porté par te_expenses.transaction_id (colonne prévue dès le
// schéma initial) — la transaction reste intacte.
import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Check, CreditCard, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

// Catégories Qonto qui relèvent des frais terrain — le reste (courses,
// abonnements, matériel…) n'a rien à faire dans les notes de frais.
const TE_QONTO_CATEGORIES: Record<string, string> = {
  restaurant_and_bar: 'restaurant',
  hotel_and_lodging: 'hebergement',
  transport: 'transport',
};

const MATCH_WINDOW_DAYS = 3;

interface BankTxn {
  id: string;
  qonto_transaction_id: string;
  qonto_label: string | null;
  qonto_raw_label: string | null;
  qonto_amount: number;
  qonto_currency: string;
  qonto_category: string | null;
  qonto_settled_at: string | null;
  qonto_emitted_at: string | null;
  supplier_id: string | null;
  supplier_invoice_id: string | null;
}

// Sous-ensemble de TeExpense nécessaire au rapprochement.
export interface MatchableExpense {
  id: string;
  merchant_clean: string | null;
  merchant_raw: string | null;
  amount: number;
  occurred_at: string;
  status: string;
  transaction_id?: string | null;
}

interface Proposal {
  expense: MatchableExpense;
  txn: BankTxn;
}

const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const txnDate = (t: BankTxn) => t.qonto_emitted_at ?? t.qonto_settled_at ?? '';

interface Props {
  open: boolean;
  userId: string;
  expenses: MatchableExpense[];
  onClose: () => void;
  onSaved: () => void;
}

const BankMatchDialog: React.FC<Props> = ({ open, userId, expenses, onClose, onSaved }) => {
  const { toast } = useToast();
  const [txns, setTxns] = useState<BankTxn[]>([]);
  const [usedTxnIds, setUsedTxnIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: rows, error }, { data: used }] = await Promise.all([
        db.from('transactions')
          .select('id, qonto_transaction_id, qonto_label, qonto_raw_label, qonto_amount, qonto_currency, qonto_category, qonto_settled_at, qonto_emitted_at, supplier_id, supplier_invoice_id')
          .eq('qonto_side', 'debit')
          .eq('qonto_operation_type', 'card')
          .eq('qonto_currency', 'EUR')
          .order('qonto_emitted_at', { ascending: false })
          .limit(500),
        // Transactions déjà rattachées à un frais (les nôtres — RLS).
        db.from('te_expenses').select('transaction_id').not('transaction_id', 'is', null),
      ]);
      if (cancelled) return;
      if (error) toast({ title: 'Erreur de lecture des transactions', description: error.message, variant: 'destructive' });
      setTxns(rows ?? []);
      setUsedTxnIds(new Set((used ?? []).map((r: any) => r.transaction_id)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, toast]);

  // Volet 1 — frais sans transaction ↔ transaction au même centime, ±3 jours.
  // Chaque transaction ne sert qu'une fois (le candidat le plus proche gagne).
  const proposals = useMemo<Proposal[]>(() => {
    const free = txns.filter((t) => !usedTxnIds.has(t.id));
    const taken = new Set<string>();
    const out: Proposal[] = [];
    for (const e of expenses) {
      if (e.transaction_id || e.status === 'rejected') continue;
      const eTime = new Date(e.occurred_at).getTime();
      const candidates = free
        .filter((t) => !taken.has(t.id)
          && Math.abs(Number(t.qonto_amount) - Number(e.amount)) < 0.005
          && Math.abs(new Date(txnDate(t)).getTime() - eTime) <= MATCH_WINDOW_DAYS * 86400e3)
        .sort((a, b) =>
          Math.abs(new Date(txnDate(a)).getTime() - eTime)
          - Math.abs(new Date(txnDate(b)).getTime() - eTime));
      if (candidates[0]) {
        taken.add(candidates[0].id);
        out.push({ expense: e, txn: candidates[0] });
      }
    }
    return out;
  }, [expenses, txns, usedTxnIds]);

  // Volet 2 — transactions carte T&E orphelines : ni frais, ni fournisseur,
  // ni facture, et pas déjà proposées au volet 1.
  const orphans = useMemo(() => {
    const proposed = new Set(proposals.map((p) => p.txn.id));
    return txns.filter((t) =>
      !usedTxnIds.has(t.id)
      && !proposed.has(t.id)
      && !t.supplier_id && !t.supplier_invoice_id
      && t.qonto_category != null && t.qonto_category in TE_QONTO_CATEGORIES);
  }, [txns, usedTxnIds, proposals]);

  const confirmProposal = async (p: Proposal) => {
    setWorkingId(p.expense.id);
    const { error } = await db.from('te_expenses')
      .update({ transaction_id: p.txn.id, external_txn_id: p.txn.qonto_transaction_id })
      .eq('id', p.expense.id);
    setWorkingId(null);
    if (error) {
      toast({ title: 'Erreur au rattachement', description: error.message, variant: 'destructive' });
      return;
    }
    setUsedTxnIds((s) => new Set(s).add(p.txn.id));
    onSaved();
  };

  const confirmAll = async () => {
    setConfirmingAll(true);
    for (const p of proposals) {
      if (usedTxnIds.has(p.txn.id)) continue;
      await confirmProposal(p);
    }
    setConfirmingAll(false);
    toast({ title: 'Rapprochements confirmés', description: `${proposals.length} frais reliés à leur transaction carte.` });
  };

  const createFromTxn = async (t: BankTxn) => {
    setWorkingId(t.id);
    try {
      const { data: created, error } = await db.from('te_expenses').insert({
        user_id: userId,
        source: 'card_platform',
        transaction_id: t.id,
        external_txn_id: t.qonto_transaction_id,
        merchant_raw: t.qonto_raw_label ?? t.qonto_label,
        merchant_clean: t.qonto_label,
        amount: Number(t.qonto_amount),
        occurred_at: txnDate(t),
        te_category: TE_QONTO_CATEGORIES[t.qonto_category ?? ''] ?? 'autre',
        // Payé par la carte société : rien à rembourser au salarié.
        reimbursable: false,
        reimbursement_status: 'pending',
      }).select('id').single();
      if (error) throw error;
      setUsedTxnIds((s) => new Set(s).add(t.id));
      // Matching RDV en arrière-plan, comme pour une saisie manuelle.
      supabase.functions.invoke('match-expense', { body: { expense_id: created.id } })
        .catch(() => { /* best-effort */ });
      toast({
        title: 'Frais créé depuis la carte',
        description: `${t.qonto_label ?? 'Transaction'} — ${euro(Number(t.qonto_amount))}. Ajoutez le justificatif quand vous l'avez.`,
      });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Erreur à la création', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rapprocher avec la banque</DialogTitle>
          <DialogDescription>
            Vos frais face aux paiements carte Qonto : confirmez les correspondances
            exactes, et créez les frais oubliés depuis les transactions resto, hôtel
            et transport.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Chargement des transactions…</div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Volet 1 : correspondances exactes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">
                  Correspondances proposées{proposals.length > 0 && ` (${proposals.length})`}
                </div>
                {proposals.length > 1 && (
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs"
                    onClick={confirmAll} disabled={confirmingAll}>
                    {confirmingAll && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                    Tout confirmer
                  </Button>
                )}
              </div>
              {proposals.length === 0 ? (
                <div className="text-xs text-muted-foreground rounded-lg border p-3">
                  Aucune correspondance au centime près sur ±{MATCH_WINDOW_DAYS} jours —
                  vos frais sans transaction n'ont pas d'équivalent carte visible.
                </div>
              ) : proposals.map((p) => (
                <div key={p.expense.id} className="rounded-lg border p-2.5 flex items-center gap-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">
                      {p.expense.merchant_clean ?? p.expense.merchant_raw ?? 'Frais'}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}· {format(new Date(p.expense.occurred_at), 'd MMM', { locale: fr })}
                    </span>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 min-w-0">
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <CreditCard className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {p.txn.qonto_label ?? 'Transaction'} · {format(new Date(txnDate(p.txn)), 'd MMM', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums shrink-0">{euro(Number(p.expense.amount))}</span>
                  <Button type="button" size="sm" className="h-7 shrink-0"
                    onClick={() => confirmProposal(p)}
                    disabled={workingId === p.expense.id || usedTxnIds.has(p.txn.id)}>
                    {workingId === p.expense.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : usedTxnIds.has(p.txn.id) ? <Check className="h-3.5 w-3.5" /> : 'Confirmer'}
                  </Button>
                </div>
              ))}
            </div>

            {/* Volet 2 : transactions T&E sans frais */}
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Paiements carte sans note de frais{orphans.length > 0 && ` (${orphans.length})`}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Débits carte classés resto, hôtel ou transport par Qonto, sans frais ni
                facture fournisseur. Créez le frais maintenant, le justificatif se
                rajoute quand vous l'avez.
              </p>
              {orphans.length === 0 ? (
                <div className="text-xs text-muted-foreground rounded-lg border p-3">
                  Rien en attente : tous vos paiements carte T&E ont leur note de frais.
                </div>
              ) : orphans.map((t) => (
                <div key={t.id} className="rounded-lg border p-2.5 flex items-center gap-2.5 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium truncate">{t.qonto_label ?? t.qonto_raw_label ?? 'Transaction'}</span>
                    <span className="text-muted-foreground">
                      {' '}· {txnDate(t) && format(new Date(txnDate(t)), 'd MMM yyyy', { locale: fr })}
                    </span>
                    <div className="mt-0.5">
                      <Badge variant="outline" className="text-[10px]">
                        {TE_QONTO_CATEGORIES[t.qonto_category ?? ''] ?? 'autre'}
                      </Badge>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums shrink-0">{euro(Number(t.qonto_amount))}</span>
                  <Button type="button" size="sm" variant="outline" className="h-7 shrink-0"
                    onClick={() => createFromTxn(t)} disabled={workingId === t.id}>
                    {workingId === t.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <><Plus className="h-3.5 w-3.5 mr-1" /> Créer le frais</>}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BankMatchDialog;
