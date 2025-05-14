
import { Recipient } from './types';
import { sendMockNotification } from './notificationApi';

// Send notification when a vendor is invited
export const notifyVendorInvited = async (
  vendor: Recipient,
  invitedBy: Recipient
) => {
  return sendMockNotification('vendor_invited', vendor, {
    invitedBy: invitedBy.name || invitedBy.email,
    invitationLink: `${window.location.origin}/supplier-portal`
  });
};
