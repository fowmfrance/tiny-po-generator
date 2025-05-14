
import { SignUpValues } from '@/schemas/signupSchema';

/**
 * Maps form values to the format expected by Coda API
 * Using the correct column IDs from the Coda table
 */
export const mapToCodaApiFormat = (values: SignUpValues): any => {
  // Format current date
  const currentDate = new Date().toISOString();
  
  // Create properly formatted cells for the Coda API, using the exact column IDs
  return {
    rows: [{
      cells: [
        { column: "firstname", value: values.firstName },
        { column: "lastname", value: values.lastName },
        { column: "email", value: values.email },
        { column: "company", value: values.company },
        { column: "jobtitle", value: values.jobTitle },
        { column: "revenue", value: values.revenue },
        { column: "supplierscount", value: values.suppliersCount },
        { column: "currenttool", value: values.currentTool },
        { column: "consent", value: values.consent ? "Yes" : "No" },
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
