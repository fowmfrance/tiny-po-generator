
import { SignUpValues } from '@/schemas/signupSchema';
import { submitToCodaApi } from './apiSubmission';
import { createCodaHeaders } from './utils';
import { CODA_API_URL, CODA_DOC_ID } from '../constants';

// Re-export functions for backwards compatibility
export { mapToCodaApiFormat, mapToCodaFormFormat } from './dataMappers';
export { submitToCodaApi } from './apiSubmission';

/**
 * Tests if Coda API is accessible with the current token
 */
export const testCodaAccess = async (): Promise<boolean> => {
  try {
    console.log("%c [CODA] Testing API access...", "color: #2196f3;");
    
    // Test the API token
    console.log("%c [CODA] Testing API token access...", "color: #2196f3;");
    const whoamiUrl = `${CODA_API_URL}/whoami`;
    const headers = createCodaHeaders();
    
    const whoamiResponse = await fetch(whoamiUrl, {
      method: 'GET',
      headers
    });
    
    if (whoamiResponse.status !== 200) {
      console.error("%c [CODA API] Token test failed with status:", "color: #f44336;", whoamiResponse.status);
      return false;
    }
    
    const whoamiData = await whoamiResponse.json();
    console.log("%c [CODA API] Token test response:", "color: #2196f3;", whoamiData);
    
    // Test document access
    console.log("%c [CODA] Testing document access...", "color: #2196f3;");
    const docUrl = `${CODA_API_URL}/docs/${CODA_DOC_ID}`;
    
    try {
      const docResponse = await fetch(docUrl, {
        method: 'GET',
        headers
      });
      
      const docData = await docResponse.json();
      console.log("%c [CODA API] Document access test response:", "color: #2196f3;", docData);
      
      if (docResponse.status !== 200) {
        console.error("%c [CODA API] Document access test failed with status:", "color: #f44336;", docResponse.status);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("%c [CODA API] Document access test error:", "color: #f44336;", error);
      return false;
    }
  } catch (error) {
    console.error("%c [CODA] Error testing API access:", "color: #f44336;", error);
    return false;
  }
};

/**
 * Simple submission to Coda API - follows Python implementation pattern
 */
export const submitToCoda = async (values: SignUpValues): Promise<boolean> => {
  console.log("%c ================= CODA SUBMISSION STARTING =================", 
    "background: #0066ff; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
  
  try {
    // Use direct API submission only - matching the Python implementation
    console.log("%c [CODA] Submitting data to Coda table...", "color: #2196f3;");
    const success = await submitToCodaApi(values);
    
    if (success) {
      console.log("%c ================= CODA SUBMISSION SUCCESSFUL =================", 
        "background: #4CAF50; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
      return true;
    } else {
      console.error("%c ================= CODA SUBMISSION FAILED =================", 
        "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
      return false;
    }
  } catch (error) {
    console.error("%c [CODA] Error in submission process:", 
      "background: #cc0000; color: #fff; padding: 2px 5px;", error);
    console.log("%c ================= CODA SUBMISSION FAILED =================", 
      "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
    
    return false;
  }
};
