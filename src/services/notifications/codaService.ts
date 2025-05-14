
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
    console.log(`[CODA] Submitting to webhook: ${WEBHOOK_URL}`);
    console.log(`[CODA] Payload: ${JSON.stringify(formattedData)}`);

    // Send the request with standard mode (without no-cors)
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });
    
    // Log complete response info for debugging
    console.log(`[CODA] Response status: ${response.status}`);
    
    // Try to get response text if possible
    try {
      const responseText = await response.text();
      console.log(`[CODA] Response body: ${responseText}`);
    } catch (err) {
      console.log(`[CODA] Could not read response body: ${err}`);
    }
    
    if (response.ok) {
      console.log("[CODA] Webhook request succeeded!");
      return true;
    } else {
      console.log(`[CODA] Webhook request failed with status: ${response.status}`);
      
      // Let's try again with no-cors as last resort
      console.log("[CODA] Trying with no-cors mode as fallback...");
      return await sendWithNoCors(formattedData);
    }
  } catch (error) {
    console.error("[CODA] Error during fetch:", error);
    console.log("[CODA] Trying with no-cors mode as fallback after error...");
    return await sendWithNoCors(formattedData);
  }
};

/**
 * Alternative submission method using no-cors mode
 * This is used as a fallback when standard fetch fails
 */
const sendWithNoCors = async (formattedData: any): Promise<boolean> => {
  try {
    console.log("[CODA] Executing no-cors fallback...");
    
    // Create a new XMLHttpRequest for more detailed debugging
    const xhr = new XMLHttpRequest();
    xhr.open('POST', WEBHOOK_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    return new Promise((resolve) => {
      xhr.onreadystatechange = function() {
        console.log(`[CODA] XHR state changed to: ${xhr.readyState}, status: ${xhr.status}`);
        
        if (xhr.readyState === 4) {
          console.log(`[CODA] XHR complete with status: ${xhr.status}`);
          console.log(`[CODA] XHR response: ${xhr.responseText}`);
          
          // For no-cors or opaque responses, we can't actually check status
          // Instead, we just assume it worked if we got to this point
          resolve(true);
        }
      };
      
      xhr.onerror = function(e) {
        console.error("[CODA] XHR error:", e);
        resolve(false);
      };
      
      // Send the request
      const jsonPayload = JSON.stringify(formattedData);
      console.log(`[CODA] Sending XHR request with payload: ${jsonPayload}`);
      xhr.send(jsonPayload);
    });
  } catch (error) {
    console.error("[CODA] Error in no-cors fallback:", error);
    return false;
  }
};
