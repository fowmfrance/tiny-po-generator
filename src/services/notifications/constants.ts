
import { TemplateIds } from './types';

// Replace this with your actual Supersend API key
export const SUPERSEND_API_KEY = 'your-supersend-api-key';
export const SUPERSEND_API_URL = 'https://api.supersend.io/v1';

// Coda API token for webhook authentication
export const CODA_API_TOKEN = '336173f4-9c5a-4f15-8e4a-089cd44cc9a9';

export const TEMPLATE_IDS: TemplateIds = {
  po_created: 'po-created-template',
  po_sent: 'po-sent-template',
  po_approved: 'po-approved-template',
  po_rejected: 'po-rejected-template',
  po_matched: 'po-matched-template',
  po_paid: 'po-paid-template',
  invoice_received: 'invoice-received-template',
  approval_required: 'approval-required-template',
  vendor_invited: 'vendor-invited-template',
  signup_form: 'signup-form-template'
};
