
import { SignUpValues } from '@/schemas/signupSchema';

// Coda webhook URL for automation
const WEBHOOK_URL = "https://coda.io/apis/v1/docs/rHPklOH20m/hooks/automation/grid-auto-k4YJ1sag6a";

/**
 * Maps form values to Coda specific column IDs
 * @param values Form values from signup form
 * @returns Mapped data ready for Coda
 */
export const mapToCodaFormat = (values: SignUpValues): Record<string, any> => {
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
    }
  };
  
  // Log the data being sent for debugging
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
  
  // Add debugging logs
  console.log("Submitting to Coda webhook URL:", WEBHOOK_URL);
  console.log("JSON payload being sent:", JSON.stringify(formattedData));
  
  try {
    // Using a direct fetch without 'no-cors' to see actual response
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
      // Removed 'no-cors' mode to get proper response
    });
    
    console.log("Coda webhook response status:", response.status);
    
    // Attempt to get response text for better debugging
    try {
      const responseText = await response.text();
      console.log("Coda webhook response:", responseText);
    } catch (e) {
      console.log("Couldn't read response text:", e);
    }
    
    // Consider success if status is 2xx
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error("Error submitting to Coda:", error);
    // If there's a CORS error, attempt again with no-cors
    console.log("Retrying with no-cors mode as fallback...");
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
        mode: 'no-cors'
      });
      console.log("Fallback request sent (no response available in no-cors mode)");
      return true; // Assume success since we can't check status in no-cors
    } catch (fallbackError) {
      console.error("Fallback request also failed:", fallbackError);
      return false;
    }
  }
};
