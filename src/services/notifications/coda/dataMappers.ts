
import { SignUpValues } from '@/schemas/signupSchema';

/**
 * Maps form values to the format expected by Coda API
 * @param values Form values from signup form
 * @returns Formatted data for Coda API
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
        { column: "Consent", value: values.consent },
        { column: "Date Submitted", value: currentDate }
      ]
    }]
  };
};

/**
 * Maps form values for the form submission endpoint
 */
export const mapToCodaFormFormat = (values: SignUpValues): Record<string, any> => {
  // Format the data for the standard Coda form submission
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
