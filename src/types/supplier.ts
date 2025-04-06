
import { mockPurchaseOrders } from '@/pages/PurchaseOrders';

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
  status: string;
  items: { id: string; name: string; quantity: number; unitPrice: number }[];
  hasInvoice?: boolean;
  invoices?: Invoice[];
}

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2023-001',
    poId: '1',
    poNumber: '2023-001',
    amount: 3000,
    currency: 'USD',
    date: '2023-07-01',
    status: 'paid',
    paymentDate: '2023-07-15'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2023-002',
    poId: '2',
    poNumber: '2023-002',
    amount: 1500,
    currency: 'USD',
    date: '2023-07-10',
    status: 'pending',
    paymentDate: null
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2023-003',
    poId: '5',
    poNumber: '2023-005',
    amount: 8500,
    currency: 'USD',
    date: '2023-07-20',
    status: 'paid',
    paymentDate: '2023-08-05'
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-2023-004',
    poId: '3',
    poNumber: '2023-003',
    amount: 12000,
    currency: 'USD',
    date: '2023-08-15',
    status: 'paid',
    paymentDate: '2023-09-01'
  },
  {
    id: 'inv-5',
    invoiceNumber: 'INV-2023-005',
    poId: '4',
    poNumber: '2023-004',
    amount: 5750,
    currency: 'USD',
    date: '2023-09-05',
    status: 'pending',
    paymentDate: null
  },
  {
    id: 'inv-6',
    invoiceNumber: 'INV-2023-006',
    poId: '6',
    poNumber: '2023-006',
    amount: 2250,
    currency: 'USD',
    date: '2023-10-10',
    status: 'paid',
    paymentDate: '2023-10-25'
  }
];

export const additionalMockPOs: PurchaseOrderWithInvoices[] = [
  {
    id: '7',
    poNumber: '2023-007',
    vendorId: '1',
    date: '2023-11-01',
    amount: 6000,
    currency: 'USD',
    status: 'approved',
    items: [
      { id: '701', name: 'Marketing Materials', quantity: 5000, unitPrice: 1.2 }
    ]
  },
  {
    id: '8',
    poNumber: '2023-008',
    vendorId: '1',
    date: '2023-11-15',
    amount: 8800,
    currency: 'USD',
    status: 'pending',
    items: [
      { id: '801', name: 'Display Units', quantity: 40, unitPrice: 220 }
    ]
  },
  {
    id: '9',
    poNumber: '2023-009',
    vendorId: '1',
    date: '2023-12-01',
    amount: 4500,
    currency: 'USD',
    status: 'approved',
    items: [
      { id: '901', name: 'Product Samples', quantity: 300, unitPrice: 15 }
    ]
  },
  {
    id: '10',
    poNumber: '2023-010',
    vendorId: '1',
    date: '2023-12-15',
    amount: 15000,
    currency: 'USD',
    status: 'approved',
    items: [
      { id: '1001', name: 'Event Equipment', quantity: 1, unitPrice: 15000 }
    ]
  }
];

export const extendedMockPurchaseOrders: PurchaseOrderWithInvoices[] = [...mockPurchaseOrders as PurchaseOrderWithInvoices[], ...additionalMockPOs];
