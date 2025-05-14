
import { SignUpValues } from '@/schemas/signupSchema';
import { CODA_API_TOKEN, CODA_API_URL, CODA_DOC_ID, CODA_TABLE_ID } from '../constants';
import { mapToCodaApiFormat } from './dataMappers';

/**
 * Submits data directly to Coda API table - simplified approach that matches Python implementation
 */
export const submitToCodaApi = async (values: SignUpValues): Promise<boolean> => {
  try {
    // Create headers with API token
    const headers = {
      'Authorization': `Bearer ${CODA_API_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    // Direct endpoint to add rows to the table
    const url = `${CODA_API_URL}/docs/${CODA_DOC_ID}/tables/${CODA_TABLE_ID}/rows`;
    
    // Format data for API
    const payload = mapToCodaApiFormat(values);
    
    console.log("%c [CODA API] Submitting data to Coda table...", "color: #2196f3;");
    console.log("%c [CODA API] URL:", "color: #2196f3;", url);
    console.log("%c [CODA API] Payload:", "color: #2196f3;", payload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    console.log("%c [CODA API] Response status:", "color: #2196f3;", response.status);
    
    if (response.status === 202) {
      console.log("%c [CODA API] Data successfully added to table!", "color: #4caf50;");
      return true;
    } else {
      const errorData = await response.json();
      console.error("%c [CODA API] Submission failed:", "color: #f44336;", response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error("%c [CODA API] Error during submission:", "color: #f44336;", error);
    return false;
  }
};

// Removed webhook submission method to simplify the approach
