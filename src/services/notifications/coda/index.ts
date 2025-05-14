
import { SignUpValues } from '@/schemas/signupSchema';
import { testCodaAccess } from './utils';
import { submitToCodaApi, submitViaFormWebhook } from './apiSubmission';

// Re-export functions for backwards compatibility
export { testCodaAccess } from './utils';
export { mapToCodaApiFormat, mapToCodaFormFormat } from './dataMappers';
export { submitToCodaApi, submitViaFormWebhook } from './apiSubmission';
export { clearExistingRows } from './utils';

/**
 * Submits form data to Coda, trying multiple methods like in the Python script
 * @param values Form values from signup form
 * @returns Promise resolving with the submission result
 */
export const submitToCoda = async (values: SignUpValues): Promise<boolean> => {
  console.log("%c ================= CODA SUBMISSION STARTING =================", 
    "background: #0066ff; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
  
  try {
    // Test API access first
    console.log("%c [CODA] Testing API access...", "color: #2196f3;");
    const hasAccess = await testCodaAccess();
    
    if (!hasAccess) {
      console.warn("%c [CODA] API access failed, will try form webhook...", "color: #ff9800;");
    } else {
      // Clear existing rows if needed (optional)
      // await clearExistingRows();
      
      // Try direct API submission
      console.log("%c [CODA] Trying direct API submission...", "color: #2196f3;");
      const apiSuccess = await submitToCodaApi(values);
      
      if (apiSuccess) {
        console.log("%c ================= CODA API SUBMISSION SUCCESSFUL =================", 
          "background: #4CAF50; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
        return true;
      }
      
      console.warn("%c [CODA] API submission failed, trying fallback method...", "color: #ff9800;");
    }
    
    // If API fails, try form webhook
    console.log("%c [CODA] Trying form webhook as fallback...", "color: #ff9800;");
    const formSuccess = await submitViaFormWebhook(values);
    
    if (formSuccess) {
      console.log("%c ================= CODA FORM SUBMISSION COMPLETED =================", 
        "background: #FF9800; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
      return true;
    }
    
    console.error("%c ================= CODA SUBMISSION FAILED =================", 
      "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
    return false;
  } catch (error) {
    console.error("%c [CODA] Critical error in submission process:", 
      "background: #cc0000; color: #fff; padding: 2px 5px;", error);
    console.log("%c ================= CODA SUBMISSION FAILED =================", 
      "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
    
    return false;
  }
};
