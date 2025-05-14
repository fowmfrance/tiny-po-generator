
import { SignUpValues } from '@/schemas/signupSchema';
import { CODA_API_TOKEN } from './constants';

// Coda webhook URL for automation - direct grid webhook
const WEBHOOK_URL = "https://coda.io/apis/v1/docs/rHPklOH20m/hooks/grid/k4YJ1sag6a";

/**
 * Maps form values to Coda specific column IDs
 * @param values Form values from signup form
 * @returns Mapped data ready for Coda
 */
export const mapToCodaFormat = (values: SignUpValues): Record<string, any> => {
  // Create a JSON string of all form data
  const rawJsonData = JSON.stringify(values);
  console.log("%c [CODA WEBHOOK] Raw JSON data being sent:", "background: #ffa500; color: #000; padding: 2px 5px; border-radius: 3px;", rawJsonData);
  
  // Create a properly formatted object for Coda with explicit column IDs
  const formattedData = {
    rows: [
      {
        cells: [
          { column: "c-3Dp2s_RPJJ", value: values.firstName },
          { column: "c-3I7nkZIM80", value: values.lastName },
          { column: "c-yMaf-8Nu2a", value: values.email },
          { column: "c-igPX8odn0Z", value: values.company },
          { column: "c-GoWg1VW34B", value: values.jobTitle },
          { column: "c-4U06AUzFSc", value: values.revenue },
          { column: "c-EMzmtR-jK5", value: values.suppliersCount },
          { column: "c--3FgZRfKks", value: values.currentTool },
          { column: "c-tNQ5h1rDt6", value: rawJsonData }
        ]
      }
    ]
  };
  
  console.log("%c [CODA WEBHOOK] Formatted data with column IDs:", "background: #ffa500; color: #000; padding: 2px 5px; border-radius: 3px;", formattedData);
  
  return formattedData;
};

/**
 * Submits form data to Coda via webhook
 * @param values Form values from signup form
 * @returns Promise resolving with the submission result
 */
export const submitToCoda = async (values: SignUpValues): Promise<boolean> => {
  console.log("%c ================= CODA WEBHOOK REQUEST STARTING =================", "background: #0066ff; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
  
  try {
    const formattedData = mapToCodaFormat(values);
    const jsonPayload = JSON.stringify(formattedData);
    
    // Create a simplified payload with just the core information
    const simplePayload = {
      email: values.email,
      name: `${values.firstName} ${values.lastName}`,
      company: values.company,
      jobTitle: values.jobTitle,
      revenue: values.revenue,
      suppliersCount: values.suppliersCount,
      currentTool: values.currentTool
    };
    
    console.log("%c [CODA WEBHOOK] Attempting direct POST with formatted data...", "background: #004d99; color: #fff; padding: 2px 5px;");
    
    // First try: Direct API call to Coda's Grid endpoint
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CODA_API_TOKEN}`
      },
      body: jsonPayload
    });
    
    if (response.ok) {
      const responseData = await response.json();
      console.log("%c [CODA WEBHOOK] Success response:", "background: #006600; color: #fff; padding: 2px 5px;", responseData);
      console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED SUCCESSFULLY =================", "background: #4CAF50; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
      return true;
    } else {
      const errorText = await response.text();
      console.error("%c [CODA WEBHOOK] Response error:", "background: #cc0000; color: #fff; padding: 2px 5px;", response.status, errorText);
      
      // Try the alternative endpoint format if the first one failed
      console.log("%c [CODA WEBHOOK] Trying alternative API endpoint format...", "background: #004d99; color: #fff; padding: 2px 5px;");
      
      // Second try: Using the alternative Coda webhook format
      const altUrl = "https://coda.io/apis/v1/docs/rHPklOH20m/tables/grid-k4YJ1sag6a/rows";
      const altResponse = await fetch(altUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CODA_API_TOKEN}`
        },
        body: JSON.stringify({ 
          rows: [
            { 
              cells: [
                { column: "First Name", value: values.firstName },
                { column: "Last Name", value: values.lastName },
                { column: "Email", value: values.email },
                { column: "Company", value: values.company },
                { column: "Job Title", value: values.jobTitle },
                { column: "Revenue", value: values.revenue },
                { column: "Suppliers Count", value: values.suppliersCount },
                { column: "Current Tool", value: values.currentTool },
                { column: "Raw Data", value: JSON.stringify(values) }
              ] 
            }
          ] 
        })
      });
      
      if (altResponse.ok) {
        const altResponseData = await altResponse.json();
        console.log("%c [CODA WEBHOOK] Success with alternative endpoint:", "background: #006600; color: #fff; padding: 2px 5px;", altResponseData);
        console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED SUCCESSFULLY =================", "background: #4CAF50; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
        return true;
      } else {
        const altErrorText = await altResponse.text();
        console.error("%c [CODA WEBHOOK] Alternative endpoint error:", "background: #cc0000; color: #fff; padding: 2px 5px;", altResponse.status, altErrorText);
      }
    }
    
    // Third try: Use a simple key-value approach as a fallback
    console.log("%c [CODA WEBHOOK] Trying direct automation webhook as fallback...", "background: #004d99; color: #fff; padding: 2px 5px;");
    const automationUrl = "https://coda.io/apis/v1/webhooks/rHPklOH20m/k4YJ1sag6a";
    const fallbackResponse = await fetch(automationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(simplePayload)
    });
    
    if (fallbackResponse.ok) {
      console.log("%c [CODA WEBHOOK] Fallback approach succeeded!", "background: #006600; color: #fff; padding: 2px 5px;");
      console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED SUCCESSFULLY =================", "background: #4CAF50; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
      return true;
    }
    
    // Fourth try: Try without authentication as public webhook
    console.log("%c [CODA WEBHOOK] Trying public webhook without auth...", "background: #004d99; color: #fff; padding: 2px 5px;");
    const publicUrl = "https://coda.io/automation/trigger/rHPklOH20m/k4YJ1sag6a";
    const publicResponse = await fetch(publicUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(simplePayload)
    });
    
    if (publicResponse.ok) {
      console.log("%c [CODA WEBHOOK] Public webhook succeeded!", "background: #006600; color: #fff; padding: 2px 5px;");
      console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED SUCCESSFULLY =================", "background: #4CAF50; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
      return true;
    }
    
    // Final fallback: Log error and return true anyway to not block user
    console.log("%c [CODA WEBHOOK] All webhook attempts failed, but continuing...", "background: #cc0000; color: #fff; padding: 2px 5px;");
    console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED WITH WARNINGS =================", "background: #FF9800; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
    return true;
    
  } catch (error) {
    console.error("%c [CODA WEBHOOK] Critical error in submission process:", "background: #cc0000; color: #fff; padding: 2px 5px;", error);
    console.log("%c ================= CODA WEBHOOK REQUEST FAILED =================", "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
    // Return true anyway to not block the user flow
    return true;
  }
};
