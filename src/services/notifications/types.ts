
import { Vendor } from '@/types/vendor';
import { PurchaseOrder, PurchaseOrderStatus } from '@/pages/PurchaseOrders';

// Event types for notifications
export type NotificationEventType = 
  | 'po_created'
  | 'po_sent'
  | 'po_approved'
  | 'po_rejected'
  | 'po_matched'
  | 'po_paid'
  | 'invoice_received'
  | 'approval_required'
  | 'vendor_invited';

// Template IDs that match your Supersend templates
export interface TemplateIds {
  [key: string]: string;
  po_created: string;
  po_sent: string;
  po_approved: string;
  po_rejected: string;
  po_matched: string;
  po_paid: string;
  invoice_received: string;
  approval_required: string;
  vendor_invited: string;
}

export interface Recipient {
  email: string;
  name?: string;
}
