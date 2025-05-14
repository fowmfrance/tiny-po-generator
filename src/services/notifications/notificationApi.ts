
import { NotificationEventType, Recipient } from './types';
import { TEMPLATE_IDS } from './constants';

// Helper function to send notifications through mock service
export const sendNotification = async (
  eventType: NotificationEventType,
  recipient: Recipient,
  data: Record<string, any>
) => {
  try {
    console.log(`[NOTIFICATION] Would send ${eventType} notification to ${recipient.email}`, data);
    // In a real implementation, this would be an actual API call
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// For development and testing without actual API calls
export const sendMockNotification = (
  eventType: NotificationEventType,
  recipient: Recipient,
  data: Record<string, any>
) => {
  console.log(`[MOCK NOTIFICATION] ${eventType} to ${recipient.email}`, data);
  console.log(`Template ID: ${TEMPLATE_IDS[eventType]}`);
  console.log(`Data: ${JSON.stringify(data, null, 2)}`);
  // This would be replaced with actual API calls in production
  return Promise.resolve(true);
};
