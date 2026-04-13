import { supabase } from '@/integrations/supabase/client';

export interface InvoiceAttachmentAsset {
  url: string;
  mimeType: string;
  filename: string | null;
}

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const JPG_SIGNATURE = [0xff, 0xd8, 0xff];
const WEBP_RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_FORMAT_SIGNATURE = [0x57, 0x45, 0x42, 0x50];

function matchesSignature(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((value, index) => bytes[index + offset] === value);
}

function extractFilenameFromDisposition(header: string | null) {
  if (!header) return null;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const asciiMatch = header.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] ? decodeURIComponent(asciiMatch[1]) : null;
}

function extractFilenameFromPath(path: string) {
  const cleanPath = path.split('?')[0];
  const fileName = cleanPath.split('/').pop();
  return fileName ? decodeURIComponent(fileName) : null;
}

function inferMimeType(path: string, blob: Blob, bytes: Uint8Array) {
  const normalizedType = blob.type.toLowerCase();
  if (normalizedType && normalizedType !== 'application/octet-stream') {
    return normalizedType;
  }

  if (matchesSignature(bytes, PDF_SIGNATURE)) return 'application/pdf';
  if (matchesSignature(bytes, PNG_SIGNATURE)) return 'image/png';
  if (matchesSignature(bytes, JPG_SIGNATURE)) return 'image/jpeg';
  if (
    matchesSignature(bytes, WEBP_RIFF_SIGNATURE) &&
    matchesSignature(bytes, WEBP_FORMAT_SIGNATURE, 8)
  ) {
    return 'image/webp';
  }

  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith('.pdf')) return 'application/pdf';
  if (lowerPath.endsWith('.png')) return 'image/png';
  if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerPath.endsWith('.webp')) return 'image/webp';

  return normalizedType || 'application/octet-stream';
}

async function getInvoiceAttachmentSourceUrl(path: string) {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const { data, error } = await supabase.storage
    .from('invoice-attachments')
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data?.signedUrl || null;
}

export async function loadInvoiceAttachmentAsset(path: string): Promise<InvoiceAttachmentAsset | null> {
  const sourceUrl = await getInvoiceAttachmentSourceUrl(path);
  if (!sourceUrl) return null;

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Impossible de charger le document (${response.status})`);
  }

  const blob = await response.blob();
  const signatureBytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const mimeType = inferMimeType(path, blob, signatureBytes);
  const normalizedBlob = blob.type === mimeType ? blob : new Blob([blob], { type: mimeType });

  return {
    url: URL.createObjectURL(normalizedBlob),
    mimeType,
    filename:
      extractFilenameFromDisposition(response.headers.get('content-disposition')) ||
      extractFilenameFromPath(path),
  };
}

export function revokeInvoiceAttachmentAsset(asset: InvoiceAttachmentAsset | null) {
  if (asset?.url) {
    URL.revokeObjectURL(asset.url);
  }
}

export function isPdfAttachment(mimeType: string, filename?: string | null) {
  return mimeType === 'application/pdf' || !!filename?.toLowerCase().endsWith('.pdf');
}

export function isImageAttachment(mimeType: string) {
  return mimeType.startsWith('image/');
}

export async function openInvoiceAttachmentInNewTab(path: string) {
  const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!previewWindow) return false;

  try {
    const asset = await loadInvoiceAttachmentAsset(path);
    if (!asset) {
      previewWindow.close();
      return false;
    }

    previewWindow.location.href = asset.url;
    window.setTimeout(() => revokeInvoiceAttachmentAsset(asset), 60_000);
    return true;
  } catch (error) {
    previewWindow.close();
    throw error;
  }
}