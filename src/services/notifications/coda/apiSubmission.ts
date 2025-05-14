
import { SignUpValues } from '@/schemas/signupSchema';
import { CODA_API_URL, CODA_DOC_ID, CODA_TABLE_ID, FORM_WEBHOOK_URL } from '../constants';
import { createCodaHeaders } from './utils';
import { mapToCodaApiFormat, mapToCodaFormFormat } from './dataMappers';

/**
 * Submits data to Coda via direct API following Python implementation
 */
export const submitToCodaApi = async (values: SignUpValues): Promise<boolean> => {
  try {
    const headers = createCodaHeaders();
    const url = `${CODA_API_URL}/docs/${CODA_DOC_ID}/tables/${CODA_TABLE_ID}/rows`;
    const payload = mapToCodaApiFormat(values);
    
    console.log("%c [CODA API] Submitting data to Coda API...", "color: #2196f3;");
    console.log("%c [CODA API] Payload:", "color: #2196f3;", payload);
    
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        
        console.log("%c [CODA API] Response status:", "color: #2196f3;", response.status);
        
        if (response.status === 202) {
          console.log("%c [CODA API] Submission successful!", "color: #4caf50;");
          return true;
        } else {
          const errorData = await response.json();
          console.error("%c [CODA API] Submission failed:", "color: #f44336;", response.status, errorData);
          
          // If we get a 429 rate limit error, implement retry with exponential backoff
          if (response.status === 429) {
            retryCount++;
            const waitTime = Math.pow(2, retryCount);
            console.warn(`%c [CODA API] Rate limit hit, retrying in ${waitTime} seconds...`, "color: #ff9800;");
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          } else {
            return false;
          }
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount);
          console.error("%c [CODA API] Request error, retrying...", "color: #f44336;", error);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        } else {
          console.error("%c [CODA API] Max retries reached:", "color: #f44336;", error);
          return false;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("%c [CODA API] Error during submission:", "color: #f44336;", error);
    return false;
  }
};

/**
 * Submit via form webhook (fallback method)
 */
export const submitViaFormWebhook = async (values: SignUpValues): Promise<boolean> => {
  try {
    const formattedData = mapToCodaFormFormat(values);
    
    // Convert formData to URL encoded string
    const urlEncodedData = new URLSearchParams();
    Object.entries(formattedData).forEach(([key, value]) => {
      urlEncodedData.append(key, String(value));
    });
    
    console.log("%c [CODA FORM] Submitting via form webhook...", "color: #ff9800;");
    
    // Try with no-cors mode
    await fetch(FORM_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlEncodedData.toString(),
      mode: "no-cors"
    });
    
    console.log("%c [CODA FORM] Form submission sent", "color: #4caf50;");
    return true;
  } catch (error) {
    console.error("%c [CODA FORM] Form submission error:", "color: #f44336;", error);
    return false;
  }
};
