
import { NotificationEventType, Recipient } from './types';
import { SUPERSEND_API_KEY, SUPERSEND_API_URL, TEMPLATE_IDS } from './constants';

// Helper function to send notifications through Supersend
export const sendNotification = async (
  eventType: NotificationEventType,
  recipient: Recipient,
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
  recipient: Recipient,
  data: Record<string, any>
) => {
  console.log(`[MOCK NOTIFICATION] ${eventType} to ${recipient.email}`, data);
  // This would be replaced with actual API calls in production
  return Promise.resolve(true);
};
