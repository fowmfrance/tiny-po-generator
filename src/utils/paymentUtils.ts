import { addDays, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';
import type { SupplierInvoice, PaymentStatus, InvoiceWithPaymentStatus, SupplierPaymentGroup } from '@/types/payment';

const DUE_SOON_DAYS = 7;

export function calculatePaymentStatus(invoice: SupplierInvoice): PaymentStatus {
  if (invoice.paid_date) return 'paid';
  
  const today = startOfDay(new Date());
  const dueDate = startOfDay(parseISO(invoice.due_date));
  const dueSoonDate = addDays(today, DUE_SOON_DAYS);
  
  if (isBefore(dueDate, today)) return 'overdue';
  if (isBefore(dueDate, dueSoonDate) || dueDate.getTime() === dueSoonDate.getTime()) return 'due_soon';
  return 'not_due';
}

export function enrichInvoiceWithStatus(invoice: SupplierInvoice): InvoiceWithPaymentStatus {
  return {
    ...invoice,
    payment_status: calculatePaymentStatus(invoice),
  };
}

export function groupInvoicesBySupplierAndCurrency(
  invoices: InvoiceWithPaymentStatus[]
): SupplierPaymentGroup[] {
  const grouped = new Map<string, SupplierPaymentGroup>();
  
  for (const invoice of invoices) {
    const key = `${invoice.supplier_id}-${invoice.currency}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, {
        supplier_id: invoice.supplier_id,
        supplier_name: invoice.supplier?.name || 'Fournisseur inconnu',
        currency: invoice.currency,
        invoices: [],
        total_amount: 0,
        invoice_numbers: [],
      });
    }
    
    const group = grouped.get(key)!;
    group.invoices.push(invoice);
    group.total_amount += Number(invoice.amount);
    group.invoice_numbers.push(invoice.invoice_number);
  }
  
  return Array.from(grouped.values());
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function generateBatchReference(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${dateStr}-${randomStr}`;
}
