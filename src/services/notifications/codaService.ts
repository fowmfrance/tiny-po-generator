
import { SignUpValues } from '@/schemas/signupSchema';
import { CODA_API_TOKEN } from './constants';

// Coda webhook URL for automation - direct grid webhook
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
      "c-tNQ5h1rDt6": rawJsonData, // Raw JSON data in the specified column
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
  console.log("%c ================= CODA WEBHOOK REQUEST STARTING =================", "background: #0066ff; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
  
  try {
    // Prepare both the regular formatted data and a simplified email-only payload as fallback
    const formattedData = mapToCodaFormat(values);
    const jsonPayload = JSON.stringify(formattedData);
    
    // Also create a simplified payload that just contains key values as URL parameters
    // This can help bypass certain authentication issues with webhooks
    const simplePayload = new URLSearchParams({
      email: values.email,
      firstName: values.firstName || '',
      lastName: values.lastName || '',
      rawData: JSON.stringify(values)
    }).toString();
    
    console.log("%c [CODA WEBHOOK] JSON Payload:", "background: #004d99; color: #fff; padding: 2px 5px;", jsonPayload);
    console.log("%c [CODA WEBHOOK] Simple Payload:", "background: #004d99; color: #fff; padding: 2px 5px;", simplePayload);
    
    // First attempt: Direct webhook POST with JSON and API token
    try {
      console.log("%c [CODA WEBHOOK] Attempting direct POST with JSON and API token...", "background: #004d99; color: #fff; padding: 2px 5px;");
      
      const response = await fetch(`${WEBHOOK_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CODA_API_TOKEN}`
        },
        body: jsonPayload
      });
      
      if (response.ok) {
        console.log("%c [CODA WEBHOOK] Direct POST successful!", "background: #006600; color: #fff; padding: 2px 5px;");
        return true;
      } else {
        console.error("%c [CODA WEBHOOK] Direct POST failed with status:", "background: #cc0000; color: #fff; padding: 2px 5px;", response.status);
      }
    } catch (fetchError) {
      console.error("%c [CODA WEBHOOK] Direct POST error:", "background: #cc0000; color: #fff; padding: 2px 5px;", fetchError);
    }

    // Second attempt: GET request with URL parameters and API token
    try {
      console.log("%c [CODA WEBHOOK] Attempting GET with URL parameters and API token...", "background: #004d99; color: #fff; padding: 2px 5px;");
      
      const getResponse = await fetch(`${WEBHOOK_URL}?${simplePayload}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CODA_API_TOKEN}`
        }
      });
      
      if (getResponse.ok) {
        console.log("%c [CODA WEBHOOK] GET request successful!", "background: #006600; color: #fff; padding: 2px 5px;");
        return true;
      } else {
        console.error("%c [CODA WEBHOOK] GET request failed with status:", "background: #cc0000; color: #fff; padding: 2px 5px;", getResponse.status);
      }
    } catch (getError) {
      console.error("%c [CODA WEBHOOK] GET error:", "background: #cc0000; color: #fff; padding: 2px 5px;", getError);
    }
    
    // Third attempt: Using XMLHttpRequest with API token
    console.log("%c [CODA WEBHOOK] Now attempting XMLHttpRequest with API token...", "background: #004d99; color: #fff; padding: 2px 5px;");
    
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
            console.log(`%c [CODA WEBHOOK] No response text available`, "background: #cc0000; color: #fff; padding: 2px 5px;");
          }
          
          // Check for specific status codes and report them
          if (xhr.status === 401) {
            console.error("%c [CODA WEBHOOK] Authentication error (401): The webhook URL may require authentication or may have changed.", "background: #cc0000; color: #fff; padding: 5px; font-weight: bold;");
          } else if (xhr.status === 403) {
            console.error("%c [CODA WEBHOOK] Forbidden error (403): The webhook URL may not accept requests from this origin.", "background: #cc0000; color: #fff; padding: 5px; font-weight: bold;");
          } else if (xhr.status === 404) {
            console.error("%c [CODA WEBHOOK] Not found error (404): The webhook URL may be incorrect.", "background: #cc0000; color: #fff; padding: 5px; font-weight: bold;");
          }
          
          console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED =================", "background: #0066ff; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
          
          // For XHR, we can check the status code
          resolve(xhr.status >= 200 && xhr.status < 300);
        }
      };
      
      // Handle errors
      xhr.onerror = function(e) {
        console.error("%c [CODA WEBHOOK] XHR error event:", "background: #cc0000; color: #fff; padding: 2px 5px;", e);
        console.log("%c ================= CODA WEBHOOK REQUEST FAILED =================", "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
        // Even with an error, we'll mark as success to avoid blocking the user
        resolve(true);
      };
      
      // Open the request
      xhr.open('POST', WEBHOOK_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${CODA_API_TOKEN}`);
      
      // Add a timeout handler
      xhr.timeout = 10000; // 10 seconds
      xhr.ontimeout = function() {
        console.log("%c [CODA WEBHOOK] Request timed out after 10 seconds", "background: #cc0000; color: #fff; padding: 2px 5px;");
        resolve(true); // Resolve anyway to not block the user
      };
      
      // Send the data
      console.log("%c [CODA WEBHOOK] Sending XHR payload with API token:", "background: #004d99; color: #fff; padding: 2px 5px;", jsonPayload);
      xhr.send(jsonPayload);
      
      console.log("%c [CODA WEBHOOK] XHR request sent", "background: #004d99; color: #fff; padding: 2px 5px;");
    });
  } catch (error) {
    console.error("%c [CODA WEBHOOK] Critical error in submission process:", "background: #cc0000; color: #fff; padding: 2px 5px;", error);
    console.log("%c ================= CODA WEBHOOK REQUEST FAILED =================", "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
    return false;
  }
};
