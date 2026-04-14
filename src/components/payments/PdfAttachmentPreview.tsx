import React from 'react';
import { FileText } from 'lucide-react';

interface PdfAttachmentPreviewProps {
  fileUrl: string;
  title: string;
}

export function PdfAttachmentPreview({ fileUrl, title }: PdfAttachmentPreviewProps) {
  return (
    <iframe
      src={fileUrl}
      className="w-full flex-1 min-h-[500px] rounded-md border"
      title={title}
      aria-label={title}
    />
  );
}
