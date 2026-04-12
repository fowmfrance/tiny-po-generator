import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Pencil, Save, X, Shield, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface KYCLevel {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_default: boolean;
}

interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  is_default: boolean;
}

interface LevelRequirement {
  id: string;
  kyc_level_id: string;
  document_type_id: string;
  is_mandatory: boolean;
}

const KYCSettingsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [editingDocType, setEditingDocType] = useState<string | null>(null);
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelDesc, setNewLevelDesc] = useState('');
  const [editLevelName, setEditLevelName] = useState('');
  const [editLevelDesc, setEditLevelDesc] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [editDocName, setEditDocName] = useState('');
  const [editDocDesc, setEditDocDesc] = useState('');
  const [showNewLevel, setShowNewLevel] = useState(false);
  const [showNewDoc, setShowNewDoc] = useState(false);

  // Fetch KYC levels
  const { data: levels = [] } = useQuery({
    queryKey: ['kyc-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_levels')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as KYCLevel[];
    },
  });

  // Fetch document types
  const { data: documentTypes = [] } = useQuery({
    queryKey: ['kyc-document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_document_types')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as DocumentType[];
    },
  });

  // Fetch requirements
  const { data: requirements = [] } = useQuery({
    queryKey: ['kyc-level-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_level_requirements')
        .select('*');
      if (error) throw error;
      return data as LevelRequirement[];
    },
  });

  // --- Mutations ---

  const createLevel = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const maxOrder = levels.length > 0 ? Math.max(...levels.map(l => l.display_order)) + 1 : 1;
      const { error } = await supabase.from('kyc_levels').insert({
        name, description, user_id: user.id, display_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-levels'] });
      setNewLevelName(''); setNewLevelDesc(''); setShowNewLevel(false);
      toast({ title: 'Niveau KYC créé' });
    },
  });

  const updateLevel = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      const { error } = await supabase.from('kyc_levels').update({ name, description }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-levels'] });
      setEditingLevel(null);
      toast({ title: 'Niveau mis à jour' });
    },
  });

  const deleteLevel = useMutation({
    mutationFn: async (id: string) => {
      // Delete requirements first
      await supabase.from('kyc_level_requirements').delete().eq('kyc_level_id', id);
      const { error } = await supabase.from('kyc_levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-levels'] });
      queryClient.invalidateQueries({ queryKey: ['kyc-level-requirements'] });
      toast({ title: 'Niveau supprimé' });
    },
  });

  const createDocType = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const maxOrder = documentTypes.length > 0 ? Math.max(...documentTypes.map(d => d.display_order)) + 1 : 1;
      const { error } = await supabase.from('kyc_document_types').insert({
        name, description, display_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-document-types'] });
      setNewDocName(''); setNewDocDesc(''); setShowNewDoc(false);
      toast({ title: 'Type de document créé' });
    },
  });

  const updateDocType = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      const { error } = await supabase.from('kyc_document_types').update({ name, description }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-document-types'] });
      setEditingDocType(null);
      toast({ title: 'Type de document mis à jour' });
    },
  });

  const deleteDocType = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('kyc_level_requirements').delete().eq('document_type_id', id);
      const { error } = await supabase.from('kyc_document_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-document-types'] });
      queryClient.invalidateQueries({ queryKey: ['kyc-level-requirements'] });
      toast({ title: 'Type de document supprimé' });
    },
  });

  const toggleRequirement = useMutation({
    mutationFn: async ({ levelId, docTypeId, currentlyRequired }: { levelId: string; docTypeId: string; currentlyRequired: boolean }) => {
      if (currentlyRequired) {
        const { error } = await supabase.from('kyc_level_requirements')
          .delete()
          .eq('kyc_level_id', levelId)
          .eq('document_type_id', docTypeId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kyc_level_requirements').insert({
          kyc_level_id: levelId, document_type_id: docTypeId, is_mandatory: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-level-requirements'] });
    },
  });

  const toggleMandatory = useMutation({
    mutationFn: async ({ reqId, isMandatory }: { reqId: string; isMandatory: boolean }) => {
      const { error } = await supabase.from('kyc_level_requirements')
        .update({ is_mandatory: isMandatory })
        .eq('id', reqId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-level-requirements'] });
    },
  });

  const getRequirementsForLevel = (levelId: string) =>
    requirements.filter(r => r.kyc_level_id === levelId);

  const isDocRequired = (levelId: string, docTypeId: string) =>
    requirements.some(r => r.kyc_level_id === levelId && r.document_type_id === docTypeId);

  const getRequirement = (levelId: string, docTypeId: string) =>
    requirements.find(r => r.kyc_level_id === levelId && r.document_type_id === docTypeId);

  return (
    <div className="space-y-6">
      {/* KYC Levels */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Niveaux de KYC
              </CardTitle>
              <CardDescription>
                Définissez les niveaux de vérification et les documents requis pour chaque niveau.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowNewLevel(true)} disabled={showNewLevel}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter un niveau
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showNewLevel && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <Input
                placeholder="Nom du niveau (ex: Standard)"
                value={newLevelName}
                onChange={e => setNewLevelName(e.target.value)}
              />
              <Textarea
                placeholder="Description (optionnel)"
                value={newLevelDesc}
                onChange={e => setNewLevelDesc(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => createLevel.mutate({ name: newLevelName, description: newLevelDesc })} disabled={!newLevelName.trim()}>
                  <Save className="h-4 w-4 mr-1" /> Créer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewLevel(false); setNewLevelName(''); setNewLevelDesc(''); }}>
                  <X className="h-4 w-4 mr-1" /> Annuler
                </Button>
              </div>
            </div>
          )}

          {levels.map(level => {
            const isExpanded = expandedLevel === level.id;
            const isEditing = editingLevel === level.id;
            const levelReqs = getRequirementsForLevel(level.id);

            return (
              <div key={level.id} className="border rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedLevel(isExpanded ? null : level.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {level.name}
                        {level.is_default && <Badge variant="secondary" className="text-xs">Défaut</Badge>}
                      </div>
                      {level.description && <p className="text-sm text-muted-foreground">{level.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{levelReqs.length} doc(s)</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingLevel(level.id);
                        setEditLevelName(level.name);
                        setEditLevelDesc(level.description || '');
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={e => { e.stopPropagation(); deleteLevel.mutate(level.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isEditing && (
                  <div className="px-4 pb-4 border-t pt-3 space-y-3 bg-muted/20" onClick={e => e.stopPropagation()}>
                    <Input value={editLevelName} onChange={e => setEditLevelName(e.target.value)} />
                    <Textarea value={editLevelDesc} onChange={e => setEditLevelDesc(e.target.value)} rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateLevel.mutate({ id: level.id, name: editLevelName, description: editLevelDesc })}>
                        <Save className="h-4 w-4 mr-1" /> Enregistrer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingLevel(null)}>Annuler</Button>
                    </div>
                  </div>
                )}

                {isExpanded && !isEditing && (
                  <div className="px-4 pb-4 border-t pt-3 bg-muted/10" onClick={e => e.stopPropagation()}>
                    <p className="text-sm font-medium mb-3">Documents requis pour ce niveau :</p>
                    {documentTypes.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Aucun type de document configuré. Ajoutez-en dans la section ci-dessous.</p>
                    ) : (
                      <div className="space-y-2">
                        {documentTypes.filter(d => d.is_active).map(doc => {
                          const required = isDocRequired(level.id, doc.id);
                          const req = getRequirement(level.id, doc.id);
                          return (
                            <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={required}
                                  onCheckedChange={() => toggleRequirement.mutate({
                                    levelId: level.id, docTypeId: doc.id, currentlyRequired: required,
                                  })}
                                />
                                <div>
                                  <span className="text-sm font-medium">{doc.name}</span>
                                  {doc.description && <p className="text-xs text-muted-foreground">{doc.description}</p>}
                                </div>
                              </div>
                              {required && req && (
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground">Obligatoire</Label>
                                  <Checkbox
                                    checked={req.is_mandatory}
                                    onCheckedChange={(checked) => toggleMandatory.mutate({ reqId: req.id, isMandatory: checked as boolean })}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {levels.length === 0 && !showNewLevel && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun niveau KYC configuré. Créez-en un pour commencer.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Document Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Types de Documents
              </CardTitle>
              <CardDescription>
                Gérez les types de documents disponibles pour la vérification KYC.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowNewDoc(true)} disabled={showNewDoc}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter un type
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showNewDoc && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <Input placeholder="Nom du document (ex: Attestation assurance RC Pro)" value={newDocName} onChange={e => setNewDocName(e.target.value)} />
              <Textarea placeholder="Description (optionnel)" value={newDocDesc} onChange={e => setNewDocDesc(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => createDocType.mutate({ name: newDocName, description: newDocDesc })} disabled={!newDocName.trim()}>
                  <Save className="h-4 w-4 mr-1" /> Créer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewDoc(false); setNewDocName(''); setNewDocDesc(''); }}>
                  <X className="h-4 w-4 mr-1" /> Annuler
                </Button>
              </div>
            </div>
          )}

          {documentTypes.map(doc => {
            const isEditing = editingDocType === doc.id;
            const usedInLevels = requirements.filter(r => r.document_type_id === doc.id).length;

            if (isEditing) {
              return (
                <div key={doc.id} className="border rounded-lg p-4 bg-muted/20 space-y-3">
                  <Input value={editDocName} onChange={e => setEditDocName(e.target.value)} />
                  <Textarea value={editDocDesc} onChange={e => setEditDocDesc(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateDocType.mutate({ id: doc.id, name: editDocName, description: editDocDesc })}>
                      <Save className="h-4 w-4 mr-1" /> Enregistrer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDocType(null)}>Annuler</Button>
                  </div>
                </div>
              );
            }

            return (
              <div key={doc.id} className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {doc.name}
                    {doc.is_default && <Badge variant="secondary" className="text-xs">Système</Badge>}
                  </div>
                  {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {usedInLevels > 0 && <Badge variant="outline" className="text-xs">{usedInLevels} niveau(x)</Badge>}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => { setEditingDocType(doc.id); setEditDocName(doc.name); setEditDocDesc(doc.description || ''); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteDocType.mutate(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {documentTypes.length === 0 && !showNewDoc && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun type de document configuré.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCSettingsTab;
