
import { SignUpValues } from '@/schemas/signupSchema';
import { submitToCodaApi } from './apiSubmission';

// Re-export functions for backwards compatibility
export { mapToCodaApiFormat, mapToCodaFormFormat } from './dataMappers';
export { submitToCodaApi } from './apiSubmission';

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
