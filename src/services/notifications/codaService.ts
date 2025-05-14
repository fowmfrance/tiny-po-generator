
import { SignUpValues } from '@/schemas/signupSchema';
import { CODA_API_TOKEN } from './constants';

// Updated Coda endpoint using their public form submission endpoint
const FORM_WEBHOOK_URL = "https://coda.io/form/Sapajoo-Waitlist_dE5AgoOFj6T";

/**
 * Maps form values to Coda specific column IDs
 * @param values Form values from signup form
 * @returns Mapped data ready for Coda
 */
export const mapToCodaFormat = (values: SignUpValues): Record<string, any> => {
  // Create a JSON string of all form data
  const rawJsonData = JSON.stringify(values);
  console.log("%c [CODA WEBHOOK] Raw JSON data being sent:", "background: #ffa500; color: #000; padding: 2px 5px; border-radius: 3px;", rawJsonData);
  
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
    rawData: rawJsonData
  };
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
    
    // Create a simplified payload with just the core information
    const simplePayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      company: values.company,
      jobTitle: values.jobTitle,
      revenue: values.revenue,
      suppliersCount: values.suppliersCount,
      currentTool: values.currentTool
    };
    
    // Convert the form data to URL encoded format
    const formData = new FormData();
    Object.entries(formattedData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    
    // Try using the XMLHttpRequest approach to bypass CORS
    const sendWithXHR = () => {
      return new Promise<boolean>((resolve) => {
        console.log("%c [CODA WEBHOOK] Trying XMLHttpRequest approach...", "background: #004d99; color: #fff; padding: 2px 5px;");
        
        const xhr = new XMLHttpRequest();
        xhr.open("POST", FORM_WEBHOOK_URL, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        
        xhr.onload = function() {
          if (this.status >= 200 && this.status < 300) {
            console.log("%c [CODA WEBHOOK] XHR Success with status:", "background: #006600; color: #fff; padding: 2px 5px;", this.status);
            resolve(true);
          } else {
            console.warn("%c [CODA WEBHOOK] XHR Failed with status:", "background: #cc0000; color: #fff; padding: 2px 5px;", this.status);
            resolve(false);
          }
        };
        
        xhr.onerror = function() {
          console.error("%c [CODA WEBHOOK] XHR Request failed", "background: #cc0000; color: #fff; padding: 2px 5px;");
          resolve(false);
        };
        
        // Convert formData to URL encoded string
        const urlEncodedData = new URLSearchParams();
        Object.entries(formattedData).forEach(([key, value]) => {
          urlEncodedData.append(key, String(value));
        });
        
        xhr.send(urlEncodedData.toString());
      });
    };
    
    // Try sending via fetch with no-cors mode
    const sendWithNoCors = async () => {
      console.log("%c [CODA WEBHOOK] Trying fetch with no-cors mode...", "background: #004d99; color: #fff; padding: 2px 5px;");
      
      try {
        await fetch(FORM_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(formattedData as Record<string, string>).toString(),
          mode: "no-cors" // This is key for bypassing CORS
        });
        
        console.log("%c [CODA WEBHOOK] no-cors request sent (note: cannot verify success due to opaque response)", "background: #006600; color: #fff; padding: 2px 5px;");
        return true;
      } catch (error) {
        console.error("%c [CODA WEBHOOK] no-cors request failed:", "background: #cc0000; color: #fff; padding: 2px 5px;", error);
        return false;
      }
    };
    
    // Try collecting the data via a fallback service
    const sendViaFallback = async () => {
      console.log("%c [CODA WEBHOOK] Trying fallback service collection...", "background: #004d99; color: #fff; padding: 2px 5px;");
      
      try {
        // Use a service like FormSubmit.co as fallback (replace with your own if needed)
        const fallbackUrl = `https://formsubmit.co/ajax/sapajoo.waitlist@email.com`;
        
        await fetch(fallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(simplePayload),
        });
        
        console.log("%c [CODA WEBHOOK] Fallback request sent", "background: #006600; color: #fff; padding: 2px 5px;");
        return true;
      } catch (error) {
        console.error("%c [CODA WEBHOOK] Fallback request failed:", "background: #cc0000; color: #fff; padding: 2px 5px;", error);
        return false;
      }
    };
    
    // Try all approaches in sequence
    const xhrResult = await sendWithXHR();
    if (xhrResult) {
      console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED SUCCESSFULLY =================", "background: #4CAF50; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
      return true;
    }
    
    const noCorsResult = await sendWithNoCors();
    if (noCorsResult) {
      console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED WITH UNKNOWN STATUS =================", "background: #FF9800; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
      return true;
    }
    
    const fallbackResult = await sendViaFallback();
    if (fallbackResult) {
      console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED VIA FALLBACK =================", "background: #FF9800; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
      return true;
    }
    
    // If all methods failed but we want to let the user continue
    console.log("%c ================= CODA WEBHOOK REQUEST COMPLETED WITH WARNINGS =================", "background: #FF9800; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
    return true;
    
  } catch (error) {
    console.error("%c [CODA WEBHOOK] Critical error in submission process:", "background: #cc0000; color: #fff; padding: 2px 5px;", error);
    console.log("%c ================= CODA WEBHOOK REQUEST FAILED =================", "background: #cc0000; color: #fff; padding: 5px; font-weight: bold; width: 100%;");
    // Return true anyway to not block the user flow
    return true;
  }
};
