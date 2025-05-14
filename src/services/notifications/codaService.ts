
import { SignUpValues } from '@/schemas/signupSchema';

// Coda table and column IDs
const CODA_TABLE_ID = 'grid-f5SX6StSC4';
const CODA_COLUMN_IDS = {
  firstName: 'c-3Dp2s_RPJJ',
  lastName: 'c-3I7nkZIM80',
  email: 'c-yMaf-8Nu2a',
  company: 'c-igPX8odn0Z',
  jobTitle: 'c-GoWg1VW34B',
  revenue: 'c-4U06AUzFSc',
  suppliersCount: 'c-EMzmtR-jK5',
  currentTool: 'c--3FgZRfKks'
};

// Coda webhook URL for automation
const WEBHOOK_URL = "https://coda.io/apis/v1/docs/rHPklOH20m/hooks/automation/grid-auto-k4YJ1sag6a";

/**
 * Maps form values to Coda specific column IDs
 * @param values Form values from signup form
 * @returns Mapped data ready for Coda
 */
export const mapToCodaFormat = (values: SignUpValues): Record<string, any> => {
  // Create a simpler flat object structure which is more compatible with most webhooks
  const formattedData = {
    // Map form values directly to the expected column names
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    company: values.company,
    jobTitle: values.jobTitle,
    revenue: values.revenue,
    suppliersCount: values.suppliersCount,
    currentTool: values.currentTool,
    // Add metadata
    submittedAt: new Date().toISOString(),
    source: typeof window !== 'undefined' ? window.location.href : 'unknown'
  };
  
  // Log the data being sent for debugging
  console.log("Sending to Coda:", formattedData);
  
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
  
  return fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedData),
    mode: 'no-cors'
  });
};
