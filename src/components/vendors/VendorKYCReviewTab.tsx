import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2, XCircle, Clock, FileText, Download, Eye,
  AlertCircle, ShieldCheck, Loader2
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';

interface VendorKYCReviewTabProps {
  supplierId: string;
  supplierName: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'Validé', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const VendorKYCReviewTab: React.FC<VendorKYCReviewTabProps> = ({ supplierId, supplierName }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ docId: string; docName: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // Fetch supplier KYC info
  const { data: supplier } = useQuery({
    queryKey: ['supplier-kyc-admin', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('kyc_level_id, kyc_status')
        .eq('id', supplierId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch KYC level info
  const { data: kycLevel } = useQuery({
    queryKey: ['kyc-level-info', supplier?.kyc_level_id],
    enabled: !!supplier?.kyc_level_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_levels')
        .select('name, description')
        .eq('id', supplier!.kyc_level_id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch requirements
  const { data: requirements = [] } = useQuery({
    queryKey: ['kyc-requirements-admin', supplier?.kyc_level_id],
    enabled: !!supplier?.kyc_level_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_level_requirements')
        .select('*, document_type:kyc_document_types(*)')
        .eq('kyc_level_id', supplier!.kyc_level_id!);
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  // Fetch uploaded documents
  const { data: uploadedDocs = [], isLoading } = useQuery({
    queryKey: ['kyc-documents-admin', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_kyc_documents')
        .select('*, document_type:kyc_document_types(name)')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from('supplier_kyc_documents')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          notes: null,
        } as any)
        .eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-documents-admin', supplierId] });
      checkAndUpdateOverallStatus();
      toast({ title: 'Document validé' });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ docId, notes }: { docId: string; notes: string }) => {
      const { error } = await supabase
        .from('supplier_kyc_documents')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          notes,
        } as any)
        .eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-documents-admin', supplierId] });
      // If rejected, set supplier KYC status back to pending
      supabase.from('suppliers').update({ kyc_status: 'pending' } as any).eq('id', supplierId).then();
      queryClient.invalidateQueries({ queryKey: ['supplier-kyc-admin', supplierId] });
      setRejectDialog(null);
      setRejectNotes('');
      toast({ title: 'Document refusé', description: 'Le fournisseur sera notifié.' });
    },
  });

  const checkAndUpdateOverallStatus = async () => {
    // Refetch docs to check if all mandatory docs are approved
    const { data: freshDocs } = await supabase
      .from('supplier_kyc_documents')
      .select('document_type_id, status')
      .eq('supplier_id', supplierId);

    const mandatoryReqs = requirements.filter((r: any) => r.is_mandatory);
    const allApproved = mandatoryReqs.every((req: any) => {
      const doc = (freshDocs || []).find((d: any) => d.document_type_id === req.document_type_id && d.status === 'approved');
      return !!doc;
    });

    if (allApproved && mandatoryReqs.length > 0) {
      await supabase.from('suppliers').update({ kyc_status: 'verified', is_active: true } as any).eq('id', supplierId);
      queryClient.invalidateQueries({ queryKey: ['supplier-kyc-admin', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'KYC complet ✅', description: `${supplierName} est maintenant vérifié et actif.` });
    }
  };

  const getLatestDoc = (docTypeId: string) => {
    return uploadedDocs.find((d: any) => d.document_type_id === docTypeId);
  };

  const handleViewFile = async (fileUrl: string) => {
    const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(fileUrl, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  // No KYC level assigned
  if (!supplier?.kyc_level_id) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun niveau KYC assigné</h3>
          <p className="text-sm text-muted-foreground">
            Ce fournisseur n'a pas de vérification documentaire requise.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kycStatusLabel: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    none: { text: 'Non démarré', variant: 'outline' },
    pending: { text: 'En attente', variant: 'secondary' },
    verified: { text: 'Vérifié', variant: 'default' },
  };
  const currentStatus = kycStatusLabel[supplier?.kyc_status || 'none'] || kycStatusLabel.none;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Revue KYC — {supplierName}
              </CardTitle>
              {kycLevel && (
                <p className="text-sm text-muted-foreground mt-1">
                  Niveau : <span className="font-medium">{kycLevel.name}</span>
                  {kycLevel.description && ` — ${kycLevel.description}`}
                </p>
              )}
            </div>
            <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Documents grid */}
      <div className="space-y-3">
        {requirements.map((req: any) => {
          const docType = req.document_type;
          const doc = getLatestDoc(req.document_type_id);
          const status = doc?.status;
          const config = status ? statusConfig[status] : null;

          return (
            <Card key={req.id}>
              <div className="flex items-center justify-between p-4 sm:p-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex-shrink-0 p-2.5 rounded-lg ${
                    status === 'approved' ? 'bg-green-100 text-green-600' :
                    status === 'rejected' ? 'bg-red-100 text-red-600' :
                    status === 'pending' ? 'bg-amber-100 text-amber-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{docType?.name || 'Document'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {req.is_mandatory && (
                        <span className="text-xs text-destructive font-medium">Obligatoire</span>
                      )}
                      {config && (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                          <config.icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      )}
                    </div>
                    {doc?.notes && status === 'rejected' && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {doc.notes}
                      </p>
                    )}
                    {doc && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Déposé le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {doc ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewFile(doc.file_url)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Voir
                      </Button>
                      {status !== 'approved' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => approveMutation.mutate(doc.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectDialog({ docId: doc.id, docName: docType?.name || 'Document' })}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Refuser
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" /> Non déposé
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectNotes(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le document</DialogTitle>
            <DialogDescription>
              Indiquez la raison du refus pour « {rejectDialog?.docName} ». Le fournisseur verra ce message et pourra renvoyer le document.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex : Document illisible, date expirée, mauvais format..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectNotes(''); }}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectNotes.trim() || rejectMutation.isPending}
              onClick={() => {
                if (rejectDialog) {
                  rejectMutation.mutate({ docId: rejectDialog.docId, notes: rejectNotes.trim() });
                }
              }}
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorKYCReviewTab;
