import { PurchaseOrderStatus } from '@/pages/PurchaseOrders';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  poId: string;
  poNumber: string;
  amount: number;
  currency: string;
  date: string;
  status: 'paid' | 'pending';
  paymentDate: string | null;
}

export interface PurchaseOrderWithInvoices {
  id: string;
  poNumber: string;
  vendorId: string;
  date: string;
  amount: number;
  currency: string;
  status: PurchaseOrderStatus;
  items: { id: string; name: string; quantity: number; unitPrice: number }[];
  hasInvoice?: boolean;
  invoices?: Invoice[];
  vendor?: string;
  paymentProgress?: number;
}

// Legacy exports kept for backward compat; real data lives in Supabase.
export const mockInvoices: Invoice[] = [];
export const additionalMockPOs: PurchaseOrderWithInvoices[] = [];
export const extendedMockPurchaseOrders: PurchaseOrderWithInvoices[] = [];
