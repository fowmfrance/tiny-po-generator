
import { PurchaseOrder, PurchaseOrderStatus } from '@/pages/PurchaseOrders';
import { Vendor } from '@/types/vendor';
import { NotificationEventType } from './types';
import { sendMockNotification } from './notificationApi';

// Send notification when a PO is created
export const notifyPOCreated = async (po: PurchaseOrder, vendor: Vendor, createdBy: string) => {
  return sendMockNotification('po_created', { 
    email: vendor.email,
    name: vendor.name
  }, {
    poNumber: po.poNumber,
    amount: po.amount,
    currency: po.currency,
    createdBy
  });
};

// Send notification when a PO is sent to a vendor
export const notifyPOSent = async (po: PurchaseOrder, vendor: Vendor) => {
  return sendMockNotification('po_sent', { 
    email: vendor.email,
    name: vendor.name
  }, {
    poNumber: po.poNumber,
    amount: po.amount,
    currency: po.currency,
    date: new Date().toISOString()
  });
};

// Send notification when a PO status changes
export const notifyPOStatusChange = async (
  po: PurchaseOrder, 
  vendor: Vendor, 
  newStatus: PurchaseOrderStatus,
  comment?: string
) => {
  let eventType: NotificationEventType;
  
  switch (newStatus) {
    case 'approved':
      eventType = 'po_approved';
      break;
    case 'rejected':
      eventType = 'po_rejected';
      break;
    case 'matched':
      eventType = 'po_matched';
      break;
    case 'paid':
      eventType = 'po_paid';
      break;
    default:
      return false; // No notification for other status changes
  }
  
  return sendMockNotification(eventType, { 
    email: vendor.email,
    name: vendor.name
  }, {
    poNumber: po.poNumber,
    amount: po.amount,
    currency: po.currency,
    status: newStatus,
    comment: comment || ''
  });
};
