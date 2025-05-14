
import { SignUpValues } from '@/schemas/signupSchema';

/**
 * Maps form values to the format expected by Coda API
 * Using the correct column IDs from the Coda table
 */
export const mapToCodaApiFormat = (values: SignUpValues): any => {
  // Format current date
  const currentDate = new Date().toISOString();
  
  // Create properly formatted cells for the Coda API, using the exact column IDs provided
  return {
    rows: [{
      cells: [
        { column: "c-3Dp2s_RPJJ", value: values.firstName },
        { column: "c-3I7nkZIM80", value: values.lastName },
        { column: "c-yMaf-8Nu2a", value: values.email },
        { column: "c-igPX8odn0Z", value: values.company },
        { column: "c-GoWg1VW34B", value: values.jobTitle },
        { column: "c-4U06AUzFSc", value: values.revenue },
        { column: "c-EMzmtR-jK5", value: values.suppliersCount },
        { column: "c--3FgZRfKks", value: values.currentTool },
        { column: "c-mBZntlVM-C", value: values.consent ? "Yes" : "No" },
        { column: "datesubmitted", value: currentDate }
      ]
    }]
  };
};

/**
 * Legacy mapping function - kept for backward compatibility
 */
export const mapToCodaFormFormat = (values: SignUpValues): Record<string, any> => {
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
