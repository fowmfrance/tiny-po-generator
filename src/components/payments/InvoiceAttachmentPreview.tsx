import React from 'react';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PdfAttachmentPreview } from './PdfAttachmentPreview';
import {
  InvoiceAttachmentAsset,
  isImageAttachment,
  isPdfAttachment,
  loadInvoiceAttachmentAsset,
  revokeInvoiceAttachmentAsset,
} from '@/lib/invoice-attachments';

interface InvoiceAttachmentPreviewProps {
  attachmentUrl: string | null;
  title: string;
  emptyMessage?: string;
}

export function InvoiceAttachmentPreview({
  attachmentUrl,
  title,
  emptyMessage = 'Aucun document attaché à cette facture.',
}: InvoiceAttachmentPreviewProps) {
  const [asset, setAsset] = React.useState<InvoiceAttachmentAsset | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const assetRef = React.useRef<InvoiceAttachmentAsset | null>(null);

  const replaceAsset = React.useCallback((nextAsset: InvoiceAttachmentAsset | null) => {
    if (assetRef.current) {
      revokeInvoiceAttachmentAsset(assetRef.current);
    }

    assetRef.current = nextAsset;
    setAsset(nextAsset);
  }, []);

  React.useEffect(() => {
    let isActive = true;

    replaceAsset(null);
    setErrorMessage(null);

    if (!attachmentUrl) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    loadInvoiceAttachmentAsset(attachmentUrl)
      .then((nextAsset) => {
        if (!isActive) {
          revokeInvoiceAttachmentAsset(nextAsset);
          return;
        }

        replaceAsset(nextAsset);
      })
      .catch((error) => {
        if (!isActive) return;
        console.error('Error loading invoice attachment:', error);
        replaceAsset(null);
        setErrorMessage('Impossible de charger ce document.');
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [attachmentUrl, replaceAsset]);

  React.useEffect(() => {
    return () => {
      if (assetRef.current) {
        revokeInvoiceAttachmentAsset(assetRef.current);
      }
    };
  }, []);

  if (!attachmentUrl) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground border rounded-md">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center border rounded-md text-muted-foreground">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
          <p>Chargement du document…</p>
        </div>
      </div>
    );
  }

  if (!asset || errorMessage) {
    return (
      <div className="flex-1 flex items-center justify-center border rounded-md text-muted-foreground">
        <div className="text-center py-12 px-6">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{errorMessage || emptyMessage}</p>
        </div>
      </div>
    );
  }

  const isPdf = isPdfAttachment(asset.mimeType, asset.filename);
  const isImage = isImageAttachment(asset.mimeType);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={asset.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            Ouvrir
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={asset.url} download={asset.filename || true}>
            <Download className="h-4 w-4 mr-1" />
            Télécharger
          </a>
        </Button>
      </div>

      {isImage ? (
        <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-muted/20 p-2">
          <img src={asset.url} alt={title} className="mx-auto h-auto max-w-full rounded-md" />
        </div>
      ) : isPdf ? (
        <PdfAttachmentPreview fileUrl={asset.url} title={title} />
      ) : (
        <iframe src={asset.url} className="w-full flex-1 min-h-[400px] rounded-md border" title={title} />
      )}
    </div>
  );
}