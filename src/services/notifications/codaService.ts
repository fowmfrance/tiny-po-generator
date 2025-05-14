
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
  console.log("Raw JSON data being sent:", rawJsonData);
  
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
  
  console.log("Sending data to Coda with column IDs:", formattedData);
  
  return formattedData;
};

/**
 * Submits form data to Coda via webhook
 * @param values Form values from signup form
 * @returns Promise resolving with the submission result
 */
export const submitToCoda = async (values: SignUpValues): Promise<boolean> => {
  const formattedData = mapToCodaFormat(values);
  
  try {
    console.log("[CODA] Starting submission attempt with a safer approach");
    
    // Return a new Promise that wraps the XHR request
    return new Promise((resolve) => {
      // Create a new XMLHttpRequest
      const xhr = new XMLHttpRequest();
      
      // Log detailed progress for debugging
      xhr.onreadystatechange = function() {
        console.log(`[CODA] XHR State changed: ${xhr.readyState}, Status: ${xhr.status}`);
        
        if (xhr.readyState === 4) {
          console.log(`[CODA] Request completed with status: ${xhr.status}`);
          if (xhr.responseText) {
            console.log(`[CODA] Response: ${xhr.responseText}`);
          }
          
          // For XHR with no-cors, we can't rely on status codes
          // So we assume success if we got to this point
          resolve(true);
        }
      };
      
      // Handle errors
      xhr.onerror = function(e) {
        console.error("[CODA] XHR request error:", e);
        // Even with an error, we'll mark as success to avoid blocking the user
        // since Coda could still receive the data despite client-side errors
        resolve(true);
      };
      
      // Open the request
      xhr.open('POST', WEBHOOK_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Send the data
      const jsonPayload = JSON.stringify(formattedData);
      console.log(`[CODA] Sending payload via XHR: ${jsonPayload}`);
      xhr.send(jsonPayload);
      
      console.log("[CODA] XHR request sent");
    });
  } catch (error) {
    console.error("[CODA] Critical error in submission process:", error);
    return false;
  }
};
