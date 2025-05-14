
import { useToast } from '@/hooks/use-toast';
import { NotificationEventType, Recipient } from './types';
import { sendMockNotification } from './notificationApi';
import { notifyPOCreated, notifyPOSent, notifyPOStatusChange } from './poNotifications';
import { notifyApprovalRequired } from './approvalNotifications';
import { notifyVendorInvited } from './vendorNotifications';

// Hook to use notifications with toast feedback
const useNotifications = () => {
  const { toast } = useToast();
  
  const sendNotificationWithToast = async (
    eventType: NotificationEventType,
    recipient: Recipient,
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
    notifyPOCreated: async (po, vendor, createdBy) => {
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
    notifyPOSent: async (po, vendor) => {
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

export default useNotifications;
