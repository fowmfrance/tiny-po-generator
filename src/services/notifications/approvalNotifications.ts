
import { PurchaseOrder } from '@/pages/PurchaseOrders';
import { Recipient } from './types';
import { sendMockNotification } from './notificationApi';

// Send notification when approval is required
export const notifyApprovalRequired = async (
  po: PurchaseOrder, 
  approver: Recipient,
  requester: Recipient
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
