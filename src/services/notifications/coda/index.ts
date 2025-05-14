
import { SignUpValues } from '@/schemas/signupSchema';
import { submitToCodaApi } from './apiSubmission';
import { createCodaHeaders } from './utils';
import { CODA_API_URL, CODA_DOC_ID, CODA_API_TOKEN } from '../constants';
import axios from 'axios';

// Re-export functions for backwards compatibility
export { mapToCodaApiFormat, mapToCodaFormFormat } from './dataMappers';
export { submitToCodaApi } from './apiSubmission';

/**
 * Tests if Coda API is accessible with the current token
 * Using the exact approach suggested with axios
 */
export const testCodaAccess = async (): Promise<boolean> => {
  try {
    console.log("%c [CODA] Testing API access using axios...", "color: #2196f3;");
    
    // Try to get the document info rather than tables list (which might have more restricted permissions)
    try {
      const response = await axios.get(
        `${CODA_API_URL}/docs/${CODA_DOC_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${CODA_API_TOKEN}`
          }
        }
      );
      console.log("%c [CODA API] Document access successful:", "color: #2196f3;", response.data);
      return true;
    } catch (error: any) {
      console.error("%c [CODA API] Error accessing document:", "color: #f44336;", error);
      
      // Log more detailed error information if available
      if (error.response) {
        console.error("%c [CODA API] Error response data:", "color: #f44336;", error.response.data);
      }
      
      return false;
    }
  } catch (error) {
    console.error("%c [CODA] Error in testCodaAccess:", "color: #f44336;", error);
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
