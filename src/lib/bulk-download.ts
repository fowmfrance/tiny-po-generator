import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

export interface DownloadableItem {
  /** Storage path or full URL */
  path: string;
  /** Desired filename inside the ZIP */
  filename: string;
}

async function fetchBlob(path: string): Promise<Blob | null> {
  if (!path) return null;

  if (path.startsWith('http')) {
    const res = await fetch(path);
    if (!res.ok) return null;
    return res.blob();
  }

  const { data, error } = await supabase.storage
    .from('invoice-attachments')
    .download(path);

  if (error) return null;
  return data;
}

export async function downloadSingleAttachment(path: string, filename: string) {
  const blob = await fetchBlob(path);
  if (!blob) throw new Error('Impossible de télécharger le fichier');
  saveAs(blob, filename);
}

export async function downloadMultipleAsZip(
  items: DownloadableItem[],
  zipFilename: string,
  onProgress?: (done: number, total: number) => void,
) {
  const zip = new JSZip();
  let done = 0;

  const results = await Promise.allSettled(
    items.map(async (item) => {
      const blob = await fetchBlob(item.path);
      if (blob) {
        zip.file(item.filename, blob);
      }
      done++;
      onProgress?.(done, items.length);
    }),
  );

  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  if (successCount === 0) throw new Error('Aucun fichier n\'a pu être téléchargé');

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipFilename);
  return successCount;
}
