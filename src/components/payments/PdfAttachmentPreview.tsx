import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfAttachmentPreviewProps {
  fileUrl: string;
  title: string;
}

export function PdfAttachmentPreview({ fileUrl, title }: PdfAttachmentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvases: HTMLCanvasElement[] = [];

    async function render() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch blob and convert to ArrayBuffer for pdf.js
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Fetch failed');
        const arrayBuffer = await response.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;

          const scale = Math.min(
            (container.clientWidth || 800) / page.getViewport({ scale: 1 }).width,
            2,
          );
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          if (i > 1) canvas.style.marginTop = '8px';

          container.appendChild(canvas);
          canvases.push(canvas);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('PDF render error:', err);
          setError('Impossible de rendre ce PDF. Essayez de le télécharger.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center border rounded-md text-muted-foreground min-h-[300px]">
        <div className="text-center py-8 px-6">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-muted/20 p-2 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={containerRef} aria-label={title} />
    </div>
  );
}
