
import { SignUpValues } from '@/schemas/signupSchema';

/**
 * Maps form values to the format expected by Coda API
 * Simplified to match Python implementation
 */
export const mapToCodaApiFormat = (values: SignUpValues): any => {
  // Format current date
  const currentDate = new Date().toISOString();
  
  // Create properly formatted cells for the Coda API
  return {
    rows: [{
      cells: [
        { column: "First Name", value: values.firstName },
        { column: "Last Name", value: values.lastName },
        { column: "Email", value: values.email },
        { column: "Company", value: values.company },
        { column: "Job Title", value: values.jobTitle },
        { column: "Revenue", value: values.revenue },
        { column: "Suppliers Count", value: values.suppliersCount },
        { column: "Current Tool", value: values.currentTool },
        { column: "Consent", value: values.consent ? "Yes" : "No" },
        { column: "Date Submitted", value: currentDate }
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
