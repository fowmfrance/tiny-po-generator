import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface SupplierType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface ArticleType {
  id: string;
  supplier_type_id: string;
  name: string;
  description: string | null;
  unit: string | null;
  default_unit_price: number | null;
  is_active: boolean;
}

const SupplierCatalogTab = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
  const [selectedSupplierTypeId, setSelectedSupplierTypeId] = useState<string | null>(null);
  const [articleTypes, setArticleTypes] = useState<ArticleType[]>([]);

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<SupplierType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '' });

  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleType | null>(null);
  const [articleForm, setArticleForm] = useState({
    name: '',
    description: '',
    unit: 'unité',
    default_unit_price: '0',
  });

  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedSupplierType = useMemo(
    () => supplierTypes.find((type) => type.id === selectedSupplierTypeId) || null,
    [supplierTypes, selectedSupplierTypeId]
  );

  const fetchSupplierTypes = async () => {
    const { data, error } = await supabase
      .from('supplier_types')
      .select('id, name, description, is_active')
      .order('name');

    if (error) throw error;

    const types = (data || []) as SupplierType[];
    setSupplierTypes(types);

    if (!selectedSupplierTypeId && types.length > 0) {
      setSelectedSupplierTypeId(types[0].id);
    }

    if (selectedSupplierTypeId && !types.some((type) => type.id === selectedSupplierTypeId)) {
      setSelectedSupplierTypeId(types[0]?.id || null);
    }
  };

  const fetchArticleTypes = async (supplierTypeId: string | null) => {
    if (!supplierTypeId) {
      setArticleTypes([]);
      return;
    }

    const { data, error } = await supabase
      .from('article_types')
      .select('id, supplier_type_id, name, description, unit, default_unit_price, is_active')
      .eq('supplier_type_id', supplierTypeId)
      .order('name');

    if (error) throw error;
    setArticleTypes((data || []) as ArticleType[]);
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) throw new Error('Non authentifié');

        const { data: adminCheck, error: adminError } = await supabase.rpc('has_role', {
          _user_id: authData.user.id,
          _role: 'admin',
        });

        if (adminError) throw adminError;
        setIsSuperAdmin(Boolean(adminCheck));

        await fetchSupplierTypes();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: error.message || 'Impossible de charger le catalogue fournisseurs.',
        });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        await fetchArticleTypes(selectedSupplierTypeId);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: error.message || 'Impossible de charger les prestations.',
        });
      }
    };

    loadArticles();
  }, [selectedSupplierTypeId]);

  const openTypeDialog = (type?: SupplierType) => {
    if (type) {
      setEditingType(type);
      setTypeForm({ name: type.name, description: type.description || '' });
    } else {
      setEditingType(null);
      setTypeForm({ name: '', description: '' });
    }
    setTypeDialogOpen(true);
  };

  const openArticleDialog = (article?: ArticleType) => {
    if (article) {
      setEditingArticle(article);
      setArticleForm({
        name: article.name,
        description: article.description || '',
        unit: article.unit || 'unité',
        default_unit_price: String(article.default_unit_price ?? 0),
      });
    } else {
      setEditingArticle(null);
      setArticleForm({
        name: '',
        description: '',
        unit: 'unité',
        default_unit_price: '0',
      });
    }
    setArticleDialogOpen(true);
  };

  const handleSaveType = async () => {
    if (!isSuperAdmin) return;
    if (!typeForm.name.trim()) {
      toast({ variant: 'destructive', title: 'Champ requis', description: 'Le nom du type est requis.' });
      return;
    }

    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('Non authentifié');

      if (editingType) {
        const { error } = await supabase
          .from('supplier_types')
          .update({
            name: typeForm.name.trim(),
            description: typeForm.description.trim() || null,
          })
          .eq('id', editingType.id);

        if (error) throw error;
        toast({ title: 'Type fournisseur mis à jour' });
      } else {
        const { error } = await supabase.from('supplier_types').insert({
          user_id: user.id,
          name: typeForm.name.trim(),
          description: typeForm.description.trim() || null,
          is_active: true,
        });

        if (error) throw error;
        toast({ title: 'Type fournisseur créé' });
      }

      setTypeDialogOpen(false);
      await fetchSupplierTypes();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder le type fournisseur.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveArticle = async () => {
    if (!isSuperAdmin) return;

    if (!selectedSupplierTypeId) {
      toast({ variant: 'destructive', title: 'Type requis', description: 'Sélectionnez un type fournisseur.' });
      return;
    }

    if (!articleForm.name.trim()) {
      toast({ variant: 'destructive', title: 'Champ requis', description: 'Le nom de la prestation est requis.' });
      return;
    }

    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('Non authentifié');

      const payload = {
        name: articleForm.name.trim(),
        description: articleForm.description.trim() || null,
        unit: articleForm.unit.trim() || null,
        default_unit_price: Number(articleForm.default_unit_price || 0),
      };

      if (editingArticle) {
        const { error } = await supabase
          .from('article_types')
          .update(payload)
          .eq('id', editingArticle.id);

        if (error) throw error;
        toast({ title: 'Prestation mise à jour' });
      } else {
        const { error } = await supabase.from('article_types').insert({
          ...payload,
          user_id: user.id,
          supplier_type_id: selectedSupplierTypeId,
          is_active: true,
        });

        if (error) throw error;
        toast({ title: 'Prestation créée' });
      }

      setArticleDialogOpen(false);
      await fetchArticleTypes(selectedSupplierTypeId);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder la prestation.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async () => {
    if (!isSuperAdmin || !deleteTypeId) return;

    try {
      const { error } = await supabase.from('supplier_types').delete().eq('id', deleteTypeId);
      if (error) throw error;

      toast({ title: 'Type fournisseur supprimé' });
      setDeleteTypeId(null);
      await fetchSupplierTypes();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          error.message ||
          'Impossible de supprimer ce type. Vérifiez que ses prestations et fournisseurs sont reclassés.',
      });
    }
  };

  const handleDeleteArticle = async () => {
    if (!isSuperAdmin || !deleteArticleId) return;

    try {
      const { error } = await supabase.from('article_types').delete().eq('id', deleteArticleId);
      if (error) throw error;

      toast({ title: 'Prestation supprimée' });
      setDeleteArticleId(null);
      await fetchArticleTypes(selectedSupplierTypeId);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer cette prestation.',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bibliothèque fournisseurs & prestations</CardTitle>
          <CardDescription>
            Associez chaque type fournisseur à un mini-catalogue de prestations. Le choix “Autre” reste disponible à la saisie du BC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSuperAdmin && (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              Vous êtes en lecture seule. Seul un super admin peut modifier cette bibliothèque.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Types fournisseurs</h3>
                <Button size="sm" onClick={() => openTypeDialog()} disabled={!isSuperAdmin}>
                  <Plus className="h-4 w-4 mr-1" /> Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {supplierTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-3 border rounded-md cursor-pointer ${
                      selectedSupplierTypeId === type.id ? 'bg-muted/50 border-primary' : ''
                    }`}
                    onClick={() => setSelectedSupplierTypeId(type.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{type.name}</p>
                        {type.description && <p className="text-sm text-muted-foreground">{type.description}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        {!type.is_active && <Badge variant="secondary">Inactif</Badge>}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTypeDialog(type);
                          }}
                          disabled={!isSuperAdmin}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTypeId(type.id);
                          }}
                          disabled={!isSuperAdmin}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {supplierTypes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun type fournisseur défini.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Prestations {selectedSupplierType ? `· ${selectedSupplierType.name}` : ''}
                </h3>
                <Button
                  size="sm"
                  onClick={() => openArticleDialog()}
                  disabled={!isSuperAdmin || !selectedSupplierTypeId}
                >
                  <Plus className="h-4 w-4 mr-1" /> Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {articleTypes.map((article) => (
                  <div key={article.id} className="p-3 border rounded-md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{article.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {article.unit || 'unité'} · Prix par défaut: {Number(article.default_unit_price || 0).toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        {article.description && (
                          <p className="text-sm text-muted-foreground mt-1">{article.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openArticleDialog(article)}
                          disabled={!isSuperAdmin}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteArticleId(article.id)}
                          disabled={!isSuperAdmin}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedSupplierTypeId && articleTypes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune prestation définie pour ce type.</p>
                )}

                {!selectedSupplierTypeId && (
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez un type fournisseur pour gérer son catalogue.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Modifier le type fournisseur' : 'Nouveau type fournisseur'}</DialogTitle>
            <DialogDescription>
              Ce type sera proposé lors de l’invitation d’un fournisseur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type-name">Nom *</Label>
              <Input
                id="type-name"
                value={typeForm.name}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Photographe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type-description">Description</Label>
              <Textarea
                id="type-description"
                value={typeForm.description}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Description métier"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveType} disabled={saving || !isSuperAdmin}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Modifier la prestation' : 'Nouvelle prestation'}</DialogTitle>
            <DialogDescription>
              Cette prestation apparaîtra dans le catalogue des lignes de bon de commande.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="article-name">Nom *</Label>
              <Input
                id="article-name"
                value={articleForm.name}
                onChange={(e) => setArticleForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Post-production"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="article-unit">Unité</Label>
                <Input
                  id="article-unit"
                  value={articleForm.unit}
                  onChange={(e) => setArticleForm((prev) => ({ ...prev, unit: e.target.value }))}
                  placeholder="jour, heure, unité"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-price">Prix unitaire par défaut</Label>
                <Input
                  id="article-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={articleForm.default_unit_price}
                  onChange={(e) => setArticleForm((prev) => ({ ...prev, default_unit_price: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-description">Description</Label>
              <Textarea
                id="article-description"
                value={articleForm.description}
                onChange={(e) => setArticleForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Détails de la prestation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArticleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveArticle} disabled={saving || !isSuperAdmin}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTypeId} onOpenChange={(open) => !open && setDeleteTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce type fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action peut échouer si des fournisseurs ou prestations sont encore rattachés à ce type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteType}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteArticleId} onOpenChange={(open) => !open && setDeleteArticleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette prestation ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArticle}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SupplierCatalogTab;
