export interface SupplierInvoice {
  id: string;
  user_id: string;
  supplier_id: string;
  invoice_number: string;
  po_number: string | null;
  purchase_order_id: string | null;
  project_code: string | null;
  amount: number;
  currency: string;
  vat_amount: number | null;
  vat_rate: number | null;
  invoice_date: string;
  received_date: string;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  supplier?: {
    id: string;
    name: string;
    email: string;
  };
}

export type PaymentStatus = 'paid' | 'overdue' | 'due_soon' | 'not_due';

export interface PaymentBatch {
  id: string;
  user_id: string;
  batch_reference: string;
  currency: string;
  total_amount: number;
  invoice_count: number;
  status: 'draft' | 'generated' | 'submitted' | 'processed' | 'failed';
  sepa_xml: string | null;
  generated_at: string | null;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentBatchInvoice {
  id: string;
  batch_id: string;
  invoice_id: string;
  amount_paid: number;
  created_at: string;
}

export interface InvoiceWithPaymentStatus extends SupplierInvoice {
  payment_status: PaymentStatus;
}

export interface SupplierPaymentGroup {
  supplier_id: string;
  supplier_name: string;
  currency: string;
  invoices: InvoiceWithPaymentStatus[];
  total_amount: number;
  invoice_numbers: string[];
}

// SEPA XML Types
export interface SepaPaymentInfo {
  paymentInfoId: string;
  batchBooking: boolean;
  numberOfTransactions: number;
  controlSum: number;
  requestedExecutionDate: string;
  debtor: {
    name: string;
    iban: string;
    bic: string;
  };
  creditTransfers: SepaCreditTransfer[];
}

export interface SepaCreditTransfer {
  endToEndId: string;
  amount: number;
  currency: string;
  creditor: {
    name: string;
    iban: string;
    bic: string;
  };
  remittanceInfo: string;
}
