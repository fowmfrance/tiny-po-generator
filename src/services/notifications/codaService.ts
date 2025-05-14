
import { SignUpValues } from '@/schemas/signupSchema';
import { CODA_API_TOKEN, CODA_DOC_ID, CODA_TABLE_ID, CODA_API_URL, FORM_WEBHOOK_URL } from './constants';

/**
 * Tests Coda API access using the provided credentials, following the Python implementation
 * @returns Promise that resolves with true if access is successful
 */
export const testCodaAccess = async (): Promise<boolean> => {
  try {
    const headers = {
      'Authorization': `Bearer ${CODA_API_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8'
    };
    
    // Test the API token with whoami endpoint
    console.log("%c [CODA] Testing API token access...", "color: #2196f3;");
    const whoamiResponse = await fetch(`${CODA_API_URL}/whoami`, {
      method: 'GET',
      headers
    });
    
    const whoamiData = await whoamiResponse.json();
    console.log("%c [CODA API] Token test response:", "color: #2196f3;", whoamiData);
    
    if (whoamiResponse.status !== 200) {
      console.error("%c [CODA API] Token test failed with status:", "color: #f44336;", 
        whoamiResponse.status);
      return false;
    }
    
    // Test document access
    console.log("%c [CODA] Testing document access...", "color: #2196f3;");
    const docResponse = await fetch(`${CODA_API_URL}/docs/${CODA_DOC_ID}`, {
      method: 'GET',
      headers
    });
    
    const docData = await docResponse.json();
    console.log("%c [CODA API] Document access test response:", "color: #2196f3;", docData);
    
    if (docResponse.status !== 200) {
      console.error("%c [CODA API] Document access test failed with status:", "color: #f44336;", 
        docResponse.status);
      return false;
    }
    
    console.log("%c [CODA] API access test successful!", "color: #4CAF50;");
    return true;
  } catch (error) {
    console.error("%c [CODA API] Access test error:", "color: #f44336;", error);
    return false;
  }
};

/**
 * Maps form values to the format expected by Coda API
 * @param values Form values from signup form
 * @returns Formatted data for Coda API
 */
export const mapToCodaApiFormat = (values: SignUpValues): any => {
  // Format current date
  const currentDate = new Date().toISOString();
  
  // Create properly formatted cells for the Coda API
  return {
    rows: [{
      cells: [
        { column: "First Name", value: values.firstName },
        { column: "Last Name", value: values.lastName },
        { column: "Email", value: values.email },
        { column: "Company", value: values.company },
        { column: "Job Title", value: values.jobTitle },
        { column: "Revenue", value: values.revenue },
        { column: "Suppliers Count", value: values.suppliersCount },
        { column: "Current Tool", value: values.currentTool },
        { column: "Consent", value: values.consent },
        { column: "Date Submitted", value: currentDate }
      ]
    }]
  };
};

/**
 * Maps form values for the form submission endpoint
 */
export const mapToCodaFormFormat = (values: SignUpValues): Record<string, any> => {
  // Format the data for the standard Coda form submission
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    company: values.company,
    jobTitle: values.jobTitle,
    revenue: values.revenue,
    suppliersCount: values.suppliersCount,
    currentTool: values.currentTool,
    consent: values.consent ? "Yes" : "No",
    dateSubmitted: new Date().toISOString()
  };
};

/**
 * Submits data to Coda via direct API following Python implementation
 */
export const submitToCodaApi = async (values: SignUpValues): Promise<boolean> => {
  try {
    const headers = {
      'Authorization': `Bearer ${CODA_API_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8'
    };
    
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
const submitViaFormWebhook = async (values: SignUpValues): Promise<boolean> => {
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

/**
 * Clear existing rows in table before uploading new data
 */
export const clearExistingRows = async (): Promise<boolean> => {
  try {
    const headers = {
      'Authorization': `Bearer ${CODA_API_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8'
    };
    
    // Get existing rows
    const url = `${CODA_API_URL}/docs/${CODA_DOC_ID}/tables/${CODA_TABLE_ID}/rows`;
    const response = await fetch(url, { headers });
    
    if (response.status !== 200) {
      console.error("%c [CODA API] Failed to fetch existing rows:", "color: #f44336;", response.status);
      return false;
    }
    
    const data = await response.json();
    const rows = data.items || [];
    
    if (rows.length === 0) {
      console.log("%c [CODA API] No existing rows to clear", "color: #2196f3;");
      return true;
    }
    
    // Delete rows
    const rowIds = rows.map((row: any) => row.id);
    console.log("%c [CODA API] Deleting existing rows:", "color: #ff9800;", rowIds.length);
    
    const deleteResponse = await fetch(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ rowIds })
    });
    
    if (deleteResponse.status === 202) {
      console.log("%c [CODA API] Existing rows cleared successfully", "color: #4caf50;");
      return true;
    } else {
      console.error("%c [CODA API] Failed to clear rows:", "color: #f44336;", deleteResponse.status);
      return false;
    }
  } catch (error) {
    console.error("%c [CODA API] Error clearing rows:", "color: #f44336;", error);
    return false;
  }
};

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
