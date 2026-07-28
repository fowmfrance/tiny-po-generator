import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSearch, Link2, Pencil, Unlink } from 'lucide-react';
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
  name: string;
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
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectEditing, setSelectEditing] = useState(false);

  const absAmount = Math.abs(txAmount);

  // Le code affiché mène à la fiche budget d'un clic ; l'édition passe par le crayon.
  const budgetFor = (code: string | null) => (code ? budgets.find(b => b.code === code) : undefined);
  const CodeLink = ({ code, title }: { code: string; title: string }) => {
    const budget = budgetFor(code);
    return (
      <button
        type="button"
        title={budget ? `${budget.code} — ${budget.name} : ouvrir le budget` : title}
        onClick={(e) => {
          e.stopPropagation();
          if (budget) navigate(`/budgets/${budget.id}`);
        }}
        className={`inline-flex items-center gap-1 rounded-full bg-brand-subtle/60 px-2 py-0.5 text-[11px] font-medium text-brand ${budget ? 'hover:bg-brand-subtle underline-offset-2 hover:underline' : 'cursor-default'}`}
      >
        <Link2 className="h-3 w-3" />
        {code}
      </button>
    );
  };

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
        {(linkedInvoice?.projectCode || projectCode) ? (
          <span className="inline-flex items-center gap-1">
            <CodeLink
              code={(linkedInvoice?.projectCode || projectCode) as string}
              title={linkedInvoice ? `Dérivé de la facture ${linkedInvoice.invoiceNumber || ''}` : 'Code non rapproché d\'une facture'}
            />
            <button
              type="button"
              onClick={openDialog}
              title={linkedInvoice
                ? `Facture ${linkedInvoice.invoiceNumber || ''}${linkedInvoice.poNumber ? ` (BdC ${linkedInvoice.poNumber})` : ''} — changer le rapprochement`
                : 'Rapprocher d\'une facture'}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </span>
        ) : linkedInvoice ? (
          <button
            type="button"
            onClick={openDialog}
            title={`Facture ${linkedInvoice.invoiceNumber || ''} sans code projet — cliquer pour changer`}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
          >
            <Link2 className="h-3 w-3" />
            Sans projet
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

  // Cas 3 : fournisseur sans BdC, ou pas de tiers → choix libre du code projet.
  // Une fois le code posé, il s'affiche en lien vers la fiche budget ; le crayon
  // rouvre le sélecteur.
  if (projectCode && !selectEditing) {
    return (
      <span className="inline-flex items-center gap-1">
        <CodeLink code={projectCode} title="Code projet" />
        <button
          type="button"
          onClick={() => setSelectEditing(true)}
          title="Changer le code projet"
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return (
    <Select
      open={selectEditing || undefined}
      onOpenChange={(o) => { if (!o) setSelectEditing(false); }}
      value={projectCode || 'none'}
      onValueChange={(value) => {
        if (value === '__new_budget__') {
          onCreateBudget();
          return;
        }
        setSelectEditing(false);
        onSelectCode(value === 'none' ? null : value);
      }}
    >
      <SelectTrigger className="w-[190px] h-8 [&>span]:truncate">
        <SelectValue placeholder="Projet" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Aucun</SelectItem>
        <SelectItem value="__new_budget__" className="text-brand font-medium">
          + Nouveau code projet
        </SelectItem>
        {/* Code hérité absent de la liste des budgets : on le garde lisible */}
        {projectCode && !budgets.some(b => b.code === projectCode) && (
          <SelectItem value={projectCode}>{projectCode}</SelectItem>
        )}
        {[...budgets].sort((a, b) => a.code.localeCompare(b.code)).map(budget => (
          <SelectItem key={budget.id} value={budget.code}>
            {budget.code} — {budget.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProjectCell;
