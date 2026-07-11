import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Upload, FileCheck, Clock, XCircle, CheckCircle2, AlertCircle, File, Loader2
} from 'lucide-react';

interface SupplierKYCTabProps {
  supplierId: string;
  portalToken?: string;
  initialSupplier?: {
    kyc_level_id: string | null;
    kyc_status: string;
    name: string;
  } | null;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'En attente de validation', icon: Clock, variant: 'secondary' },
  approved: { label: 'Validé', icon: CheckCircle2, variant: 'default' },
  rejected: { label: 'Refusé', icon: XCircle, variant: 'destructive' },
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const SupplierKYCTab: React.FC<SupplierKYCTabProps> = ({ supplierId, portalToken, initialSupplier = null }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const useTokenPath = !!portalToken;

  // Portal (anon) path: fetch requirements + documents via edge function.
  const portalDataQuery = useQuery({
    queryKey: ['supplier-kyc-portal', portalToken],
    enabled: useTokenPath,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-kyc-portal', {
        body: { token: portalToken, action: 'get' },
      });
      if (error) throw error;
      return data as {
        kycLevelId: string | null;
        requirements: any[];
        documents: any[];
      };
    },
  });

  // Authenticated path: direct queries (used by internal review screens if reused).
  const { data: queriedSupplier } = useQuery({
    queryKey: ['supplier-kyc-level', supplierId],
    enabled: !useTokenPath && !!supplierId && !initialSupplier,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('kyc_level_id, kyc_status, name')
        .eq('id', supplierId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const supplier = initialSupplier ?? queriedSupplier ?? null;

  const { data: authRequirements = [] } = useQuery({
    queryKey: ['kyc-requirements', supplier?.kyc_level_id],
    enabled: !useTokenPath && !!supplier?.kyc_level_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_level_requirements')
        .select('*, document_type:kyc_document_types(*)')
        .eq('kyc_level_id', supplier!.kyc_level_id!);
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const { data: authUploadedDocs = [] } = useQuery({
    queryKey: ['kyc-documents', supplierId],
    enabled: !useTokenPath,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_kyc_documents')
        .select('*, document_type:kyc_document_types(name)')
        .eq('supplier_id', supplierId);
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const requirements = useTokenPath ? (portalDataQuery.data?.requirements ?? []) : authRequirements;
  const uploadedDocs = useTokenPath ? (portalDataQuery.data?.documents ?? []) : authUploadedDocs;
  const effectiveKycLevelId = useTokenPath ? portalDataQuery.data?.kycLevelId : supplier?.kyc_level_id;

  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentTypeId }: { file: File; documentTypeId: string }) => {
      if (useTokenPath) {
        const fileBase64 = await fileToBase64(file);
        const { data, error } = await supabase.functions.invoke('supplier-kyc-portal', {
          body: {
            token: portalToken,
            action: 'upload',
            documentTypeId,
            fileBase64,
            fileName: file.name,
            contentType: file.type,
          },
        });
        if (error) throw error;
        return data;
      }
      // Authenticated path (kept for internal use)
      const ext = file.name.split('.').pop();
      const path = `${supplierId}/${documentTypeId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: insertData, error: insertError } = await supabase
        .from('supplier_kyc_documents')
        .insert({
          supplier_id: supplierId,
          document_type_id: documentTypeId,
          file_url: path,
          status: 'pending',
        } as any)
        .select()
        .single();
      if (insertError) throw insertError;
      return insertData;
    },
    onSuccess: () => {
      if (useTokenPath) {
        queryClient.invalidateQueries({ queryKey: ['supplier-kyc-portal', portalToken] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['kyc-documents', supplierId] });
      }
      toast({ title: 'Document déposé', description: 'Votre document a été envoyé pour validation.' });
      setUploadingDocType(null);
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      setUploadingDocType(null);
    },
  });

  const handleFileSelect = (documentTypeId: string) => {
    fileInputRefs.current[documentTypeId]?.click();
  };

  const handleFileChange = (documentTypeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux', description: 'La taille maximale est de 10 Mo.', variant: 'destructive' });
      return;
    }
    setUploadingDocType(documentTypeId);
    uploadMutation.mutate({ file, documentTypeId });
  };

  if (!effectiveKycLevelId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun document requis</h3>
          <p className="text-muted-foreground">Votre compte est actif, aucune vérification de documents n'est nécessaire.</p>
        </CardContent>
      </Card>
    );
  }

  const getDocStatus = (docTypeId: string) => {
    const docs = uploadedDocs.filter((d: any) => d.document_type_id === docTypeId);
    if (docs.length === 0) return null;
    return docs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const overallComplete = requirements.every((req: any) => {
    const doc = getDocStatus(req.document_type_id);
    return doc && doc.status === 'approved';
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Vérification de votre dossier
              </CardTitle>
              <CardDescription className="mt-1">
                Déposez les documents demandés ci-dessous pour activer votre compte fournisseur.
              </CardDescription>
            </div>
            <Badge variant={overallComplete ? 'default' : 'secondary'}>
              {overallComplete ? 'Dossier complet' : 'En cours'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {requirements.map((req: any) => {
          const docType = req.document_type;
          const existingDoc = getDocStatus(req.document_type_id);
          const status = existingDoc?.status;
          const config = status ? statusConfig[status] : null;
          const isUploading = uploadingDocType === req.document_type_id;

          return (
            <Card key={req.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex-shrink-0 p-2.5 rounded-lg ${
                    status === 'approved' ? 'bg-green-100 text-green-600' :
                    status === 'rejected' ? 'bg-red-100 text-red-600' :
                    status === 'pending' ? 'bg-amber-100 text-amber-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <File className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{docType?.name || 'Document'}</p>
                    {docType?.description && (
                      <p className="text-sm text-muted-foreground truncate">{docType.description}</p>
                    )}
                    {req.is_mandatory && (
                      <span className="text-xs text-destructive font-medium">Obligatoire</span>
                    )}
                    {config && (
                      <div className="flex items-center gap-1 mt-1">
                        <config.icon className="h-3.5 w-3.5" />
                        <span className="text-xs">{config.label}</span>
                      </div>
                    )}
                    {status === 'rejected' && existingDoc?.notes && (
                      <div className="flex items-start gap-1 mt-1 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span>{existingDoc.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 ml-4">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    ref={(el) => { fileInputRefs.current[req.document_type_id] = el; }}
                    onChange={(e) => handleFileChange(req.document_type_id, e)}
                  />
                  {status === 'approved' ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Validé
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant={status === 'rejected' ? 'destructive' : 'outline'}
                      onClick={() => handleFileSelect(req.document_type_id)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Envoi...</>
                      ) : status === 'pending' ? (
                        <><Upload className="h-4 w-4 mr-1" /> Remplacer</>
                      ) : status === 'rejected' ? (
                        <><Upload className="h-4 w-4 mr-1" /> Renvoyer</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-1" /> Déposer</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Formats acceptés</p>
              <p className="mt-1">PDF, JPG, PNG — 10 Mo maximum par fichier. Vos documents seront examinés sous 24 à 48 heures ouvrées.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierKYCTab;
