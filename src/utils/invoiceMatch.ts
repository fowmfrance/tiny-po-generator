import type { InvoiceChainEntry } from '@/hooks/useInvoiceChain';

/**
 * Pré-rapprochement automatique opération bancaire ↔ facture fournisseur.
 *
 * Volontairement strict pour éviter les faux positifs : uniquement les
 * décaissements déjà rattachés à un fournisseur, et uniquement une facture au
 * MONTANT EXACT (au centime). Le fuzzy par libellé, c'est le rôle de la passe
 * tiers (fuzzyMatch.ts) qui tourne avant.
 */

export interface InvoiceLinkProposal {
  txId: string;
  label: string;
  date: string | null;
  amount: number;
  currency: string | null;
  invoice: InvoiceChainEntry;
}

interface MatchableTx {
  id: string;
  qonto_side: string;
  qonto_label: string;
  qonto_amount: number;
  qonto_currency: string;
  qonto_settled_at: string | null;
  qonto_emitted_at: string | null;
  supplier_id: string | null;
  supplier_invoice_id: string | null;
}

export function proposeInvoiceLinks(
  transactions: MatchableTx[],
  invoices: InvoiceChainEntry[],
): InvoiceLinkProposal[] {
  // Une facture déjà rapprochée (ou proposée plus haut dans ce lot) ne peut pas
  // être proposée une seconde fois.
  const usedInvoiceIds = new Set(
    transactions.map(tx => tx.supplier_invoice_id).filter(Boolean) as string[],
  );

  const bySupplier = new Map<string, InvoiceChainEntry[]>();
  for (const inv of invoices) {
    if (!inv.supplierId || inv.status === 'cancelled') continue;
    const list = bySupplier.get(inv.supplierId) || [];
    list.push(inv);
    bySupplier.set(inv.supplierId, list);
  }

  const proposals: InvoiceLinkProposal[] = [];

  for (const tx of transactions) {
    if (tx.qonto_side === 'credit') continue;
    if (!tx.supplier_id || tx.supplier_invoice_id) continue;

    const amount = Math.abs(Number(tx.qonto_amount));
    const txDate = tx.qonto_settled_at || tx.qonto_emitted_at || '';

    const candidates = (bySupplier.get(tx.supplier_id) || []).filter(
      inv => !usedInvoiceIds.has(inv.id) && Math.abs(inv.amount - amount) < 0.01,
    );
    if (candidates.length === 0) continue;

    // Plusieurs factures au même montant : la plus proche de la date d'opération
    const best = [...candidates].sort((a, b) => {
      const da = a.invoiceDate ? Math.abs(new Date(a.invoiceDate).getTime() - new Date(txDate).getTime()) : Infinity;
      const db = b.invoiceDate ? Math.abs(new Date(b.invoiceDate).getTime() - new Date(txDate).getTime()) : Infinity;
      return da - db;
    })[0];

    usedInvoiceIds.add(best.id);
    proposals.push({
      txId: tx.id,
      label: tx.qonto_label || 'Sans libellé',
      date: txDate || null,
      amount: tx.qonto_amount,
      currency: tx.qonto_currency,
      invoice: best,
    });
  }

  return proposals;
}
