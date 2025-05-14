
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
  return {
    tableId: CODA_TABLE_ID,
    cells: [
      { column: CODA_COLUMN_IDS.firstName, value: values.firstName },
      { column: CODA_COLUMN_IDS.lastName, value: values.lastName },
      { column: CODA_COLUMN_IDS.email, value: values.email },
      { column: CODA_COLUMN_IDS.company, value: values.company },
      { column: CODA_COLUMN_IDS.jobTitle, value: values.jobTitle },
      { column: CODA_COLUMN_IDS.revenue, value: values.revenue },
      { column: CODA_COLUMN_IDS.suppliersCount, value: values.suppliersCount },
      { column: CODA_COLUMN_IDS.currentTool, value: values.currentTool }
    ],
    metadata: {
      submittedAt: new Date().toISOString(),
      source: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }
  };
};

/**
 * Submits form data to Coda via webhook
 * @param values Form values from signup form
 * @returns Promise resolving with the submission result
 */
export const submitToCoda = async (values: SignUpValues): Promise<Response> => {
  const formattedData = mapToCodaFormat(values);
  
  return fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedData),
    mode: 'no-cors'
  });
};
