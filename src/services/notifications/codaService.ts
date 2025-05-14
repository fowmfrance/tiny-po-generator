
import { SignUpValues } from '@/schemas/signupSchema';

// Coda webhook URL for automation
const WEBHOOK_URL = "https://coda.io/apis/v1/docs/rHPklOH20m/hooks/automation/grid-auto-k4YJ1sag6a";

/**
 * Maps form values to Coda specific column IDs
 * @param values Form values from signup form
 * @returns Mapped data ready for Coda
 */
export const mapToCodaFormat = (values: SignUpValues): Record<string, any> => {
  // Create a JSON string of all form data
  const rawJsonData = JSON.stringify(values);
  console.log("%c [CODA WEBHOOK] Raw JSON data being sent:", "background: #ffa500; color: #000; padding: 2px 5px; border-radius: 3px;", rawJsonData);
  
  // Create a properly formatted object for Coda with explicit column IDs
  const formattedData = {
    row: {
      "c-3Dp2s_RPJJ": values.firstName,
      "c-3I7nkZIM80": values.lastName,
      "c-yMaf-8Nu2a": values.email,
      "c-igPX8odn0Z": values.company,
      "c-GoWg1VW34B": values.jobTitle,
      "c-4U06AUzFSc": values.revenue,
      "c-EMzmtR-jK5": values.suppliersCount,
      "c--3FgZRfKks": values.currentTool,
      "c-tNQ5h1rDt6": rawJsonData, // Adding raw JSON data to the specified column
    }
  };
  
  console.log("%c [CODA WEBHOOK] Formatted data with column IDs:", "background: #ffa500; color: #000; padding: 2px 5px; border-radius: 3px;", formattedData);
  
  return formattedData;
};

/**
 * Submits form data to Coda via webhook
 * @param values Form values from signup form
 * @returns Promise resolving with the submission result
 */
export const submitToCoda = async (values: SignUpValues): Promise<boolean> => {
  const formattedData = mapToCodaFormat(values);
  const jsonPayload = JSON.stringify(formattedData);
  
  // Display a clear divider in the console for better visibility
  console.log("%c ================= CODA WEBHOOK REQUEST STARTING =================", "background: #0066ff; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
  console.log("%c [CODA WEBHOOK] Target URL:", "background: #004d99; color: #fff; padding: 2px 5px;", WEBHOOK_URL);
  console.log("%c [CODA WEBHOOK] Payload being sent:", "background: #004d99; color: #fff; padding: 2px 5px;", jsonPayload);
  
  try {
    console.log("%c [CODA WEBHOOK] Attempting fetch with no-cors first...", "background: #004d99; color: #fff; padding: 2px 5px;");
    
    // First attempt: Simple fetch with no-cors mode
    try {
      const fetchResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: jsonPayload
      });
      
      console.log("%c [CODA WEBHOOK] Fetch response:", "background: #006600; color: #fff; padding: 2px 5px;", "Can't display actual response due to no-cors");
    } catch (fetchError) {
      console.error("%c [CODA WEBHOOK] Fetch error:", "background: #cc0000; color: #fff; padding: 2px 5px;", fetchError);
    }
    
    // Second attempt: XMLHttpRequest as backup
    console.log("%c [CODA WEBHOOK] Now attempting XMLHttpRequest as backup...", "background: #004d99; color: #fff; padding: 2px 5px;");
    
    // Return a new Promise that wraps the XHR request
    return new Promise((resolve) => {
      // Create a new XMLHttpRequest
      const xhr = new XMLHttpRequest();
      
      // Log detailed progress for debugging
      xhr.onreadystatechange = function() {
        const stateNames = ["UNSENT", "OPENED", "HEADERS_RECEIVED", "LOADING", "DONE"];
        console.log(`%c [CODA WEBHOOK] XHR State: ${stateNames[xhr.readyState]} (${xhr.readyState}), Status: ${xhr.status}`, 
                   "background: #004d99; color: #fff; padding: 2px 5px;");
        
        if (xhr.readyState === 4) {
          console.log(`%c [CODA WEBHOOK] Request completed with status: ${xhr.status}`, 
                     xhr.status >= 200 && xhr.status < 300 ? 
                     "background: #006600; color: #fff; padding: 2px 5px;" : 
                     "background: #cc0000; color: #fff; padding: 2px 5px;");
          
          if (xhr.responseText) {
            console.log(`%c [CODA WEBHOOK] Response text:`, "background: #006600; color: #fff; padding: 2px 5px;", xhr.responseText);
          } else {
            console.log(`%c [CODA WEBHOOK] No response text available (likely due to CORS)`, "background: #cc0000; color: #fff; padding: 2px 5px;");
          }
          
          console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED =================", "background: #0066ff; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
          
          // For XHR with no-cors, we can't rely on status codes
          // So we assume success if we got to this point
          resolve(true);
        }
      };
      
      // Handle errors
      xhr.onerror = function(e) {
        console.error("%c [CODA WEBHOOK] XHR error event:", "background: #cc0000; color: #fff; padding: 2px 5px;", e);
        console.log("%c ================= CODA WEBHOOK REQUEST FAILED =================", "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
        // Even with an error, we'll mark as success to avoid blocking the user
        // since Coda could still receive the data despite client-side errors
        resolve(true);
      };
      
      // Open the request
      xhr.open('POST', WEBHOOK_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Add a timeout handler
      xhr.timeout = 10000; // 10 seconds
      xhr.ontimeout = function() {
        console.log("%c [CODA WEBHOOK] Request timed out after 10 seconds", "background: #cc0000; color: #fff; padding: 2px 5px;");
        resolve(true); // Resolve anyway to not block the user
      };
      
      // Send the data
      console.log(`%c [CODA WEBHOOK] Sending XHR payload:`, "background: #004d99; color: #fff; padding: 2px 5px;", jsonPayload);
      xhr.send(jsonPayload);
      
      console.log("%c [CODA WEBHOOK] XHR request sent", "background: #004d99; color: #fff; padding: 2px 5px;");
    });
  } catch (error) {
    console.error("%c [CODA WEBHOOK] Critical error in submission process:", "background: #cc0000; color: #fff; padding: 2px 5px;", error);
    console.log("%c ================= CODA WEBHOOK REQUEST FAILED =================", "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
    return false;
  }
};
