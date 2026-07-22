import { useMemo, useState } from 'react';
import { FileSearch, Link2, Unlink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InvoiceChainEntry } from '@/hooks/useInvoiceChain';

interface BudgetOption {
  id: string;
  code: string;
}

interface ProjectCellProps {
  txAmount: number;
  supplierId: string | null;
  supplierName?: string;
  supplierInvoiceId: string | null;
  projectCode: string | null;
  budgets: BudgetOption[];
  supplierHasPO: boolean;
  linkedInvoice?: InvoiceChainEntry;
  supplierInvoices: InvoiceChainEntry[];
  onLinkInvoice: (invoice: InvoiceChainEntry | null) => void;
  onSelectCode: (code: string | null) => void;
  onCreateBudget: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Payée',
  pending: 'En attente',
  approved: 'Approuvée',
  partial: 'Partielle',
};

/**
 * Cellule « Projet » de l'écran banque. Le code projet remonte la chaîne
 * fournisseur → BdC → facture → paiement :
 * - opération rapprochée d'une facture → code dérivé (BdC → budget), édition via
 *   la modale de recherche parmi les factures reçues du fournisseur ;
 * - fournisseur avec BdC mais pas encore rapproché → la modale de recherche ;
 * - fournisseur sans BdC, ou pas de fournisseur (encaissements) → choix libre.
 */
const ProjectCell = ({
  txAmount,
  supplierId,
  supplierName,
  supplierInvoiceId,
  projectCode,
  budgets,
  supplierHasPO,
  linkedInvoice,
  supplierInvoices,
  onLinkInvoice,
  onSelectCode,
  onCreateBudget,
}: ProjectCellProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const absAmount = Math.abs(txAmount);

  const sortedInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? supplierInvoices.filter(inv =>
          (inv.invoiceNumber || '').toLowerCase().includes(q) ||
          (inv.poNumber || '').toLowerCase().includes(q) ||
          (inv.projectCode || '').toLowerCase().includes(q))
      : supplierInvoices;
    // Montant identique d'abord, puis les plus récentes
    return [...filtered].sort((a, b) => {
      const aExact = Math.abs(a.amount - absAmount) < 0.01 ? 0 : 1;
      const bExact = Math.abs(b.amount - absAmount) < 0.01 ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return (b.invoiceDate || '').localeCompare(a.invoiceDate || '');
    });
  }, [supplierInvoices, search, absAmount]);

  const openDialog = () => {
    setSearch('');
    setDialogOpen(true);
  };

  const pickInvoice = (invoice: InvoiceChainEntry) => {
    onLinkInvoice(invoice);
    setDialogOpen(false);
  };

  const formatEur = (n: number) =>
    n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  // Cas 1 & 2 : fournisseur avec BdC → le code se dérive d'une facture, jamais en saisie libre
  if (supplierId && (supplierHasPO || supplierInvoiceId)) {
    return (
      <>
        {linkedInvoice ? (
          <button
            type="button"
            onClick={openDialog}
            title={`Dérivé de la facture ${linkedInvoice.invoiceNumber || ''}${linkedInvoice.poNumber ? ` (BdC ${linkedInvoice.poNumber})` : ''} — cliquer pour changer`}
            className="inline-flex items-center gap-1 rounded-full bg-brand-subtle/60 px-2 py-0.5 text-[11px] font-medium text-brand hover:bg-brand-subtle"
          >
            <Link2 className="h-3 w-3" />
            {linkedInvoice.projectCode || 'Sans projet'}
          </button>
        ) : projectCode ? (
          // Code déjà affecté (saisie antérieure) mais pas encore rapproché d'une
          // facture : le code reste lisible tel quel, le clic ouvre le rapprochement.
          <button
            type="button"
            onClick={openDialog}
            title="Code non rapproché d'une facture — cliquer pour lier"
            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted"
          >
            {projectCode}
          </button>
        ) : (
          <Button variant="outline" size="sm" className="h-8 text-xs text-muted-foreground" onClick={openDialog}>
            <FileSearch className="h-3.5 w-3.5 mr-1" />
            Lier une facture
          </Button>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Factures reçues — {supplierName || 'fournisseur'}</DialogTitle>
              <DialogDescription>
                Rapprochez l'opération de {formatEur(absAmount)} d'une facture : le code projet remonte du bon de commande.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Rechercher par n° de facture, BdC ou code projet…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="max-h-[320px] overflow-y-auto space-y-1.5">
              {sortedInvoices.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Aucune facture reçue pour ce fournisseur.
                </p>
              ) : sortedInvoices.map(inv => {
                const exactAmount = Math.abs(inv.amount - absAmount) < 0.01;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => pickInvoice(inv)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors',
                      inv.id === supplierInvoiceId && 'border-brand bg-brand-subtle/40',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{inv.invoiceNumber || 'Sans numéro'}</span>
                      <span className={cn('tabular-nums shrink-0', exactAmount && 'font-semibold text-green-600')}>
                        {formatEur(inv.amount)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {inv.invoiceDate && <span>{new Date(inv.invoiceDate).toLocaleDateString('fr-FR')}</span>}
                      {inv.poNumber && <span>BdC {inv.poNumber}</span>}
                      {inv.projectCode && <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{inv.projectCode}</Badge>}
                      {inv.status && STATUS_LABELS[inv.status] && (
                        <span className="ml-auto">{STATUS_LABELS[inv.status]}</span>
                      )}
                      {exactAmount && (
                        <Badge className="h-4 px-1.5 text-[10px] bg-green-100 text-green-800 hover:bg-green-100">
                          Montant identique
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {supplierInvoiceId && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-destructive hover:text-destructive"
                onClick={() => { onLinkInvoice(null); setDialogOpen(false); }}
              >
                <Unlink className="h-3.5 w-3.5 mr-1" />
                Délier la facture
              </Button>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Cas 3 : fournisseur sans BdC, ou pas de tiers → choix libre du code projet
  return (
    <Select
      value={projectCode || 'none'}
      onValueChange={(value) => {
        if (value === '__new_budget__') {
          onCreateBudget();
          return;
        }
        onSelectCode(value === 'none' ? null : value);
      }}
    >
      <SelectTrigger className="w-[120px] h-8">
        <SelectValue placeholder="Projet" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Aucun</SelectItem>
        <SelectItem value="__new_budget__" className="text-brand font-medium">
          + Nouveau code projet
        </SelectItem>
        {budgets.map(budget => (
          <SelectItem key={budget.id} value={budget.code}>
            {budget.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProjectCell;
