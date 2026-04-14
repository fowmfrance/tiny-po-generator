import React from 'react';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { InvoiceAttachmentPreview } from './InvoiceAttachmentPreview';
import { downloadSingleAttachment } from '@/lib/bulk-download';
import { useToast } from '@/hooks/use-toast';

interface AttachmentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachmentUrl: string | null;
  title: string;
  /** Optional metadata rendered above the preview */
  children?: React.ReactNode;
}

export function AttachmentPreviewDialog({
  open,
  onOpenChange,
  attachmentUrl,
  title,
  children,
}: AttachmentPreviewDialogProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    if (!attachmentUrl) return;
    setIsDownloading(true);
    try {
      const ext = attachmentUrl.split('.').pop()?.split('?')[0] || 'pdf';
      const filename = `${title.replace(/[^a-zA-Z0-9À-ÿ_-]/g, '_')}.${ext}`;
      await downloadSingleAttachment(attachmentUrl, filename);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de télécharger le fichier.', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>Aperçu du document</DialogDescription>
        </DialogHeader>

        {children}

        <InvoiceAttachmentPreview
          attachmentUrl={attachmentUrl}
          title={title}
          emptyMessage="Aucun document attaché."
        />

        {attachmentUrl && (
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
