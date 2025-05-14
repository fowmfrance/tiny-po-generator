
import { TemplateIds } from './types';

// Coda API configuration
export const CODA_API_TOKEN = '56dbe324-55cb-44e8-a5f0-4ff96cd28a03'; // Updated token
export const CODA_DOC_ID = 'rHPklOH20m'; // Updated Doc ID
export const CODA_TABLE_ID = 'grid-f5SX6StSC4'; // Updated Table ID
export const CODA_API_URL = 'https://coda.io/apis/v1';

// Updated automation webhook URL
export const FORM_WEBHOOK_URL = "https://coda.io/apis/v1/docs/rHPklOH20m/hooks/automation/grid-auto-k4YJ1sag6a";

// Notification templates
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
