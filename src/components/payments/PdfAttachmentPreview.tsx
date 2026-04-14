import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfAttachmentPreviewProps {
  fileUrl: string;
  title: string;
}

interface PdfPageCanvasProps {
  pageNumber: number;
  pdfDocument: any;
}

function PdfPageCanvas({ pageNumber, pdfDocument }: PdfPageCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [isRendering, setIsRendering] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;
    let renderTask: any = null;

    const renderPage = async () => {
      try {
        setIsRendering(true);
        setErrorMessage(null);

        const page = await pdfDocument.getPage(pageNumber);
        if (!isActive || !canvasRef.current) return;

        const containerWidth = Math.max((wrapperRef.current?.clientWidth || 0) - 32, 320);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(Math.max(containerWidth / baseViewport.width, 1), 2);
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas indisponible');
        }

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (error) {
        if (isActive) {
          console.error(`Error rendering PDF page ${pageNumber}:`, error);
          setErrorMessage('Impossible d’afficher cette page.');
        }
      } finally {
        if (isActive) {
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isActive = false;
      renderTask?.cancel?.();
    };
  }, [pageNumber, pdfDocument]);

  return (
    <div ref={wrapperRef} className="rounded-md border bg-background shadow-sm overflow-hidden">
      <div className="border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Page {pageNumber}
      </div>
      <div className="relative overflow-auto p-4">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {errorMessage ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
            {errorMessage}
          </div>
        ) : (
          <canvas ref={canvasRef} className="mx-auto block max-w-full h-auto" aria-label={`Page ${pageNumber}`} />
        )}
      </div>
    </div>
  );
}

export function PdfAttachmentPreview({ fileUrl, title }: PdfAttachmentPreviewProps) {
  const [pdfDocument, setPdfDocument] = React.useState<any>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;
    const loadingTask = getDocument(fileUrl);

    setPdfDocument(null);
    setPageCount(0);
    setIsLoading(true);
    setErrorMessage(null);

    loadingTask.promise
      .then((document) => {
        if (!isActive) {
          document.destroy();
          return;
        }

        setPdfDocument(document);
        setPageCount(document.numPages);
      })
      .catch((error) => {
        if (!isActive) return;
        console.error('Error loading PDF attachment:', error);
        setErrorMessage('Impossible de charger le PDF.');
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      loadingTask.destroy();
    };
  }, [fileUrl]);

  React.useEffect(() => {
    return () => {
      pdfDocument?.destroy?.();
    };
  }, [pdfDocument]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border text-muted-foreground">
        <div className="text-center py-12">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
          <p>Chargement du PDF…</p>
        </div>
      </div>
    );
  }

  if (!pdfDocument || errorMessage) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border text-muted-foreground">
        <div className="text-center px-6 py-12">
          <FileText className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>{errorMessage || 'Impossible de prévisualiser ce PDF.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] flex-1 flex-col gap-3 overflow-auto rounded-md border bg-muted/20 p-3" aria-label={title}>
      {Array.from({ length: pageCount }, (_, index) => (
        <PdfPageCanvas key={`${fileUrl}-${index + 1}`} pageNumber={index + 1} pdfDocument={pdfDocument} />
      ))}
    </div>
  );
}