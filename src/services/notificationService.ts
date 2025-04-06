
import { Vendor } from '@/types/vendor';
import { PurchaseOrder, PurchaseOrderStatus } from '@/pages/PurchaseOrders';
import { useToast } from '@/hooks/use-toast';

// Replace this with your actual Supersend API key
const SUPERSEND_API_KEY = 'your-supersend-api-key';
const SUPERSEND_API_URL = 'https://api.supersend.io/v1';

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
interface TemplateIds {
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

const TEMPLATE_IDS: TemplateIds = {
  po_created: 'po-created-template',
  po_sent: 'po-sent-template',
  po_approved: 'po-approved-template',
  po_rejected: 'po-rejected-template',
  po_matched: 'po-matched-template',
  po_paid: 'po-paid-template',
  invoice_received: 'invoice-received-template',
  approval_required: 'approval-required-template',
  vendor_invited: 'vendor-invited-template'
};

// Helper function to send notifications through Supersend
export const sendNotification = async (
  eventType: NotificationEventType,
  recipient: { email: string; name?: string },
  data: Record<string, any>
) => {
  try {
    const response = await fetch(`${SUPERSEND_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPERSEND_API_KEY}`
      },
      body: JSON.stringify({
        template_id: TEMPLATE_IDS[eventType],
        email: recipient.email,
        data: {
          name: recipient.name || recipient.email.split('@')[0],
          ...data
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Supersend notification failed:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// For development and testing without actual API calls
export const sendMockNotification = (
  eventType: NotificationEventType,
  recipient: { email: string; name?: string },
  data: Record<string, any>
) => {
  console.log(`[MOCK NOTIFICATION] ${eventType} to ${recipient.email}`, data);
  // This would be replaced with actual API calls in production
  return Promise.resolve(true);
};

// Helper functions for specific notification types

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

// Send notification when approval is required
export const notifyApprovalRequired = async (
  po: PurchaseOrder, 
  approver: { email: string; name?: string },
  requester: { email: string; name?: string }
) => {
  return sendMockNotification('approval_required', approver, {
    poNumber: po.poNumber,
    vendor: po.vendor,
    amount: po.amount,
    currency: po.currency,
    requesterName: requester.name || requester.email.split('@')[0],
    approvalLink: `${window.location.origin}/purchase-orders/${po.id}/approve`
  });
};

// Send notification when a vendor is invited
export const notifyVendorInvited = async (
  vendor: { email: string; name?: string },
  invitedBy: { email: string; name?: string }
) => {
  return sendMockNotification('vendor_invited', vendor, {
    invitedBy: invitedBy.name || invitedBy.email,
    invitationLink: `${window.location.origin}/supplier-portal`
  });
};

// Hook to use notifications with toast feedback
export const useNotifications = () => {
  const { toast } = useToast();
  
  const sendNotificationWithToast = async (
    eventType: NotificationEventType,
    recipient: { email: string; name?: string },
    data: Record<string, any>
  ) => {
    const success = await sendMockNotification(eventType, recipient, data);
    
    if (success) {
      toast({
        title: "Notification envoyée",
        description: `La notification a été envoyée à ${recipient.email}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erreur d'envoi",
        description: `La notification n'a pas pu être envoyée à ${recipient.email}`,
      });
    }
    
    return success;
  };
  
  return {
    sendNotificationWithToast,
    notifyPOCreated: async (po: PurchaseOrder, vendor: Vendor, createdBy: string) => {
      return sendNotificationWithToast('po_created', { 
        email: vendor.email,
        name: vendor.name
      }, {
        poNumber: po.poNumber,
        amount: po.amount,
        currency: po.currency,
        createdBy
      });
    },
    notifyPOSent: async (po: PurchaseOrder, vendor: Vendor) => {
      return sendNotificationWithToast('po_sent', { 
        email: vendor.email,
        name: vendor.name
      }, {
        poNumber: po.poNumber,
        amount: po.amount,
        currency: po.currency,
        date: new Date().toISOString()
      });
    },
    notifyPOStatusChange,
    notifyApprovalRequired,
    notifyVendorInvited
  };
};
