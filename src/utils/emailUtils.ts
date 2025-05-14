
/**
 * Sends form data via a mailto link
 * @param data The data to send as JSON in the email body
 * @param email The recipient email address
 * @param subject The email subject
 */
export const sendFormDataViaEmail = <T extends object>(
  data: T, 
  email: string = 'hello@sapajoo.fr',
  subject: string
): void => {
  // Format the body as JSON
  const emailBody = JSON.stringify(data, null, 2);
  
  // Create a mailto link with the form data
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  
  // Open the user's email client with the pre-filled email
  window.open(mailtoLink, '_blank');
};
