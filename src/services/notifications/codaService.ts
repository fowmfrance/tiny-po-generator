
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
  // Note: Some Coda webhooks expect data in a specific format, often wrapped in a 'row' object
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
export const submitToCoda = async (values: SignUpValues): Promise<Response> => {
  const formattedData = mapToCodaFormat(values);
  
  // Add debugging logs
  console.log("Submitting to Coda webhook URL:", WEBHOOK_URL);
  console.log("JSON payload being sent:", JSON.stringify(formattedData));
  
  try {
    // Using 'no-cors' mode because most webhook endpoints don't support CORS
    // This prevents JavaScript from seeing the response details but still allows the request to be sent
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
      mode: 'no-cors' // Changed back to 'no-cors' as this is typically required for cross-origin webhook requests
    });
    
    console.log("Request sent to Coda webhook");
    return response;
  } catch (error) {
    console.error("Error submitting to Coda:", error);
    throw error;
  }
};
