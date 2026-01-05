import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { formatCurrency } from '@/utils/paymentUtils';
import type { InvoiceWithPaymentStatus } from '@/types/payment';

interface InvoicesTableProps {
  invoices: InvoiceWithPaymentStatus[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  showCheckboxes?: boolean;
}

export function InvoicesTable({
  invoices,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  showCheckboxes = true,
}: InvoicesTableProps) {
  const allSelected = invoices.length > 0 && invoices.every(inv => selectedIds.has(inv.id));
  const someSelected = invoices.some(inv => selectedIds.has(inv.id));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckboxes && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                  aria-label="Sélectionner tout"
                  className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
            )}
            <TableHead>N° Facture</TableHead>
            <TableHead>Fournisseur</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>N° BC</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Reçue le</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showCheckboxes ? 9 : 8} className="text-center text-muted-foreground py-8">
                Aucune facture trouvée
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow 
                key={invoice.id}
                className={selectedIds.has(invoice.id) ? 'bg-primary/5' : ''}
              >
                {showCheckboxes && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(invoice.id)}
                      onCheckedChange={(checked) => onSelectionChange(invoice.id, !!checked)}
                      aria-label={`Sélectionner facture ${invoice.invoice_number}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.supplier?.name || '-'}</TableCell>
                <TableCell>{invoice.project_code || '-'}</TableCell>
                <TableCell>{invoice.po_number || '-'}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(Number(invoice.amount), invoice.currency)}
                </TableCell>
                <TableCell>
                  {format(parseISO(invoice.received_date), 'dd MMM yyyy', { locale: fr })}
                </TableCell>
                <TableCell>
                  {format(parseISO(invoice.due_date), 'dd MMM yyyy', { locale: fr })}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={invoice.payment_status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
