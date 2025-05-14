
import { CODA_API_TOKEN } from '../constants';

/**
 * Creates headers for Coda API requests
 */
export const createCodaHeaders = () => ({
  'Authorization': `Bearer ${CODA_API_TOKEN}`,
  'Content-Type': 'application/json'
});
