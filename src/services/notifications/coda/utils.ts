
import { CODA_API_TOKEN, CODA_API_URL, CODA_DOC_ID, CODA_TABLE_ID } from '../constants';

/**
 * Creates headers for Coda API requests
 */
export const createCodaHeaders = () => ({
  'Authorization': `Bearer ${CODA_API_TOKEN}`,
  'Content-Type': 'application/json; charset=utf-8'
});

/**
 * Tests Coda API access using the provided credentials
 * @returns Promise that resolves with true if access is successful
 */
export const testCodaAccess = async (): Promise<boolean> => {
  try {
    const headers = createCodaHeaders();
    
    // Test the API token with whoami endpoint
    console.log("%c [CODA] Testing API token access...", "color: #2196f3;");
    const whoamiResponse = await fetch(`${CODA_API_URL}/whoami`, {
      method: 'GET',
      headers
    });
    
    const whoamiData = await whoamiResponse.json();
    console.log("%c [CODA API] Token test response:", "color: #2196f3;", whoamiData);
    
    if (whoamiResponse.status !== 200) {
      console.error("%c [CODA API] Token test failed with status:", "color: #f44336;", 
        whoamiResponse.status);
      return false;
    }
    
    // Test document access
    console.log("%c [CODA] Testing document access...", "color: #2196f3;");
    const docResponse = await fetch(`${CODA_API_URL}/docs/${CODA_DOC_ID}`, {
      method: 'GET',
      headers
    });
    
    const docData = await docResponse.json();
    console.log("%c [CODA API] Document access test response:", "color: #2196f3;", docData);
    
    if (docResponse.status !== 200) {
      console.error("%c [CODA API] Document access test failed with status:", "color: #f44336;", 
        docResponse.status);
      return false;
    }
    
    console.log("%c [CODA] API access test successful!", "color: #4CAF50;");
    return true;
  } catch (error) {
    console.error("%c [CODA API] Access test error:", "color: #f44336;", error);
    return false;
  }
};

/**
 * Clear existing rows in table before uploading new data
 */
export const clearExistingRows = async (): Promise<boolean> => {
  try {
    const headers = createCodaHeaders();
    
    // Get existing rows
    const url = `${CODA_API_URL}/docs/${CODA_DOC_ID}/tables/${CODA_TABLE_ID}/rows`;
    const response = await fetch(url, { headers });
    
    if (response.status !== 200) {
      console.error("%c [CODA API] Failed to fetch existing rows:", "color: #f44336;", response.status);
      return false;
    }
    
    const data = await response.json();
    const rows = data.items || [];
    
    if (rows.length === 0) {
      console.log("%c [CODA API] No existing rows to clear", "color: #2196f3;");
      return true;
    }
    
    // Delete rows
    const rowIds = rows.map((row: any) => row.id);
    console.log("%c [CODA API] Deleting existing rows:", "color: #ff9800;", rowIds.length);
    
    const deleteResponse = await fetch(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ rowIds })
    });
    
    if (deleteResponse.status === 202) {
      console.log("%c [CODA API] Existing rows cleared successfully", "color: #4caf50;");
      return true;
    } else {
      console.error("%c [CODA API] Failed to clear rows:", "color: #f44336;", deleteResponse.status);
      return false;
    }
  } catch (error) {
    console.error("%c [CODA API] Error clearing rows:", "color: #f44336;", error);
    return false;
  }
};
