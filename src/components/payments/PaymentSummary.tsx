import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, groupInvoicesBySupplierAndCurrency } from '@/utils/paymentUtils';
import type { InvoiceWithPaymentStatus } from '@/types/payment';

interface PaymentSummaryProps {
  selectedInvoices: InvoiceWithPaymentStatus[];
}

export function PaymentSummary({ selectedInvoices }: PaymentSummaryProps) {
  if (selectedInvoices.length === 0) {
    return null;
  }

  const groups = groupInvoicesBySupplierAndCurrency(selectedInvoices);
  
  // Totals by currency
  const totalsByCurrency = new Map<string, number>();
  for (const group of groups) {
    const current = totalsByCurrency.get(group.currency) || 0;
    totalsByCurrency.set(group.currency, current + group.total_amount);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Résumé du paiement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {selectedInvoices.length} facture{selectedInvoices.length > 1 ? 's' : ''} sélectionnée{selectedInvoices.length > 1 ? 's' : ''}
          </p>
          
          <div className="space-y-1">
            {Array.from(totalsByCurrency.entries()).map(([currency, total]) => (
              <div key={currency} className="flex justify-between items-center">
                <span className="text-sm font-medium">Total {currency}</span>
                <span className="text-lg font-bold">{formatCurrency(total, currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">Virements à générer :</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {groups.map((group, index) => (
              <div 
                key={`${group.supplier_id}-${group.currency}`}
                className="flex justify-between items-start p-2 bg-muted/50 rounded text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium">{group.supplier_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.invoices.length} facture{group.invoices.length > 1 ? 's' : ''}: {group.invoice_numbers.join(', ')}
                  </p>
                </div>
                <span className="font-medium whitespace-nowrap ml-2">
                  {formatCurrency(group.total_amount, group.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
