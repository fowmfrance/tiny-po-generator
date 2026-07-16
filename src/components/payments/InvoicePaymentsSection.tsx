import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Check, Clock, FileClock, X, Banknote } from 'lucide-react';
import { formatCurrency } from '@/utils/paymentUtils';
import { useInvoicePayments, MAX_PARTIAL_PAYMENTS, type PartialPaymentStatus } from '@/hooks/useInvoicePayments';
import { LogPartialPaymentDialog } from './LogPartialPaymentDialog';

interface Props {
  invoiceId: string;
  invoiceTtc: number;
  currency: string;
}

const statusMeta: Record<PartialPaymentStatus, { label: string; className: string; icon: React.ElementType }> = {
  prepared: { label: 'À préparer', className: 'bg-gray-100 text-gray-700', icon: FileClock },
  ordered: { label: 'Ordonné', className: 'bg-amber-100 text-amber-800', icon: Clock },
  paid: { label: 'Payé', className: 'bg-green-100 text-green-800', icon: Check },
  cancelled: { label: 'Annulé', className: 'bg-gray-100 text-gray-400 line-through', icon: X },
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export function InvoicePaymentsSection({ invoiceId, invoiceTtc, currency }: Props) {
  const { payments, isLoading, paid, pending, balance, remainingToPay, canAdd, count, addPayment, settlePayment, cancelPayment } =
    useInvoicePayments(invoiceId, invoiceTtc);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settleId, setSettleId] = useState<string | null>(null);
  const [settleDate, setSettleDate] = useState<string>(new Date().toISOString().slice(0, 10));

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Paiements</h4>
          <span className="text-xs text-muted-foreground">{count}/{MAX_PARTIAL_PAYMENTS}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={!canAdd}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
        </Button>
      </div>

      {/* Récap solde */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Payé</p>
          <p className="text-sm font-medium text-green-700">{formatCurrency(paid, currency)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">En cours</p>
          <p className="text-sm font-medium">{formatCurrency(pending, currency)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Reste à régler</p>
          <p className={`text-sm font-medium ${balance > 0.005 ? 'text-red-600' : 'text-green-700'}`}>
            {formatCurrency(balance, currency)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : payments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun paiement enregistré.</p>
      ) : (
        <ul className="space-y-1.5">
          {payments.map((p) => {
            const meta = statusMeta[p.status];
            const Icon = meta.icon;
            return (
              <li key={p.id} className="flex items-center gap-2 text-sm rounded-md border px-3 py-2">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${meta.className}`}>
                  <Icon className="h-3 w-3" />{meta.label}
                </span>
                <span className="font-medium">{formatCurrency(Number(p.amount_paid), currency)}</span>
                <span className="text-xs text-muted-foreground">
                  {p.status === 'paid' ? `payé le ${fmtDate(p.bank_payment_date)}` : `exéc. ${fmtDate(p.value_date)}`}
                </span>
                {p.note && <span className="text-xs text-muted-foreground italic truncate">· {p.note}</span>}
                <span className="ml-auto flex items-center gap-1">
                  {p.status !== 'paid' && (
                    <Button
                      size="sm" variant="ghost" className="h-6 text-xs"
                      onClick={() => { setSettleId(p.id); setSettleDate(new Date().toISOString().slice(0, 10)); }}
                    >
                      Rapprocher
                    </Button>
                  )}
                  <Button
                    size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground"
                    onClick={() => cancelPayment.mutate(p.id)}
                    aria-label="Annuler le paiement"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Rapprochement inline : saisir la date banque */}
      {settleId && (
        <div className="mt-2 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Date de règlement en banque :</span>
          <input
            type="date"
            value={settleDate}
            onChange={(e) => setSettleDate(e.target.value)}
            className="h-7 rounded border px-2 text-sm"
          />
          <Button
            size="sm" className="h-7 text-xs"
            onClick={() => { settlePayment.mutate({ id: settleId, bankPaymentDate: settleDate }); setSettleId(null); }}
          >
            Valider
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSettleId(null)}>Annuler</Button>
        </div>
      )}

      <LogPartialPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currency={currency}
        remainingToPay={remainingToPay}
        isSubmitting={addPayment.isPending}
        onSubmit={(input) => addPayment.mutate(input, { onSuccess: () => setDialogOpen(false) })}
      />
    </div>
  );
}
