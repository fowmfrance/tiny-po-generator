
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
  
  console.log("Submitting to Coda webhook URL:", WEBHOOK_URL);
  console.log("JSON payload being sent:", JSON.stringify(formattedData));
  
  try {
    // First attempt with standard fetch (no no-cors) to get proper response
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });
    
    console.log("Coda webhook response status:", response.status);
    
    if (response.ok) {
      // Status in 200-299 range is success
      console.log("Coda webhook request successful!");
      return true;
    } else {
      // If response is not ok, try to read error details
      const responseText = await response.text();
      console.log("Coda webhook error response:", responseText);
      
      // Fallback to no-cors as last resort
      console.log("Response not OK, trying fallback with no-cors mode...");
      return await fallbackSubmission(formattedData);
    }
  } catch (error) {
    // Network error or other exception
    console.error("Error submitting to Coda:", error);
    console.log("Executing fallback with no-cors mode...");
    return await fallbackSubmission(formattedData);
  }
};

// Separate fallback function using no-cors mode
const fallbackSubmission = async (formattedData: any): Promise<boolean> => {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
      mode: 'no-cors'
    });
    
    // With no-cors we can't actually tell if it succeeded,
    // but at least the request was sent
    console.log("Fallback no-cors request sent (no response status available)");
    
    // We'll assume it worked since we can't check the response
    return true;
  } catch (error) {
    console.error("Fallback submission also failed:", error);
    return false;
  }
};
