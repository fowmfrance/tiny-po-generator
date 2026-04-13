import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { Plus, Pencil, Trash2, Loader2, ShieldAlert, Info } from 'lucide-react';
import { SupplierTypeIcon } from '@/components/ui/supplier-type-icon';

// Common Lucide icon options for supplier types
const ICON_OPTIONS = [
  { value: 'camera', label: 'Appareil photo' },
  { value: 'video', label: 'Vidéo' },
  { value: 'film', label: 'Film / Post-prod' },
  { value: 'pen-tool', label: 'Création' },
  { value: 'palette', label: 'Design' },
  { value: 'scissors', label: 'Stylisme' },
  { value: 'sparkles', label: 'Beauté' },
  { value: 'user', label: 'Mannequin' },
  { value: 'briefcase', label: 'Conseil' },
  { value: 'scale', label: 'Juridique' },
  { value: 'monitor', label: 'IT' },
  { value: 'utensils', label: 'Restauration' },
  { value: 'plane', label: 'Voyage' },
  { value: 'truck', label: 'Logistique' },
  { value: 'lamp-desk', label: 'Studio' },
  { value: 'building-2', label: 'Services généraux' },
  { value: 'music', label: 'Musique' },
  { value: 'mic', label: 'Audio' },
  { value: 'megaphone', label: 'Communication' },
  { value: 'image', label: 'Image' },
];

interface SupplierType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
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
  is_price_cap: boolean;
}

const SupplierCatalogTab = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
  const [articlesByType, setArticlesByType] = useState<Record<string, ArticleType[]>>({});

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<SupplierType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', icon: '' });

  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [articleDialogTypeId, setArticleDialogTypeId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<ArticleType | null>(null);
  const [articleForm, setArticleForm] = useState({
    name: '',
    description: '',
    unit: 'unité',
    default_unit_price: '0',
    is_price_cap: false,
  });

  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [deleteArticleTypeId, setDeleteArticleTypeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const [typesRes, articlesRes] = await Promise.all([
      supabase.from('supplier_types').select('id, name, description, icon, is_active').order('name'),
      supabase.from('article_types').select('id, supplier_type_id, name, description, unit, default_unit_price, is_active, is_price_cap').order('name'),
    ]);

    if (typesRes.error) throw typesRes.error;
    if (articlesRes.error) throw articlesRes.error;

    const types = (typesRes.data || []) as SupplierType[];
    setSupplierTypes(types);

    const grouped: Record<string, ArticleType[]> = {};
    (articlesRes.data || []).forEach((a: any) => {
      if (!grouped[a.supplier_type_id]) grouped[a.supplier_type_id] = [];
      grouped[a.supplier_type_id].push(a as ArticleType);
    });
    setArticlesByType(grouped);
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

        await fetchAll();
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

  const openTypeDialog = (type?: SupplierType) => {
    if (type) {
      setEditingType(type);
      setTypeForm({ name: type.name, description: type.description || '', icon: type.icon || '' });
    } else {
      setEditingType(null);
      setTypeForm({ name: '', description: '', icon: '' });
    }
    setTypeDialogOpen(true);
  };

  const openArticleDialog = (supplierTypeId: string, article?: ArticleType) => {
    setArticleDialogTypeId(supplierTypeId);
    if (article) {
      setEditingArticle(article);
      setArticleForm({
        name: article.name,
        description: article.description || '',
        unit: article.unit || 'unité',
        default_unit_price: String(article.default_unit_price ?? 0),
        is_price_cap: article.is_price_cap || false,
      });
    } else {
      setEditingArticle(null);
      setArticleForm({
        name: '',
        description: '',
        unit: 'unité',
        default_unit_price: '0',
        is_price_cap: false,
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
          .update({ name: typeForm.name.trim(), description: typeForm.description.trim() || null })
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
      await fetchAll();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveArticle = async () => {
    if (!isSuperAdmin || !articleDialogTypeId) return;

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
        is_price_cap: articleForm.is_price_cap,
      };

      if (editingArticle) {
        const { error } = await supabase.from('article_types').update(payload).eq('id', editingArticle.id);
        if (error) throw error;
        toast({ title: 'Prestation mise à jour' });
      } else {
        const { error } = await supabase.from('article_types').insert({
          ...payload,
          user_id: user.id,
          supplier_type_id: articleDialogTypeId,
          is_active: true,
        });
        if (error) throw error;
        toast({ title: 'Prestation créée' });
      }

      setArticleDialogOpen(false);
      await fetchAll();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
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
      await fetchAll();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  const handleDeleteArticle = async () => {
    if (!isSuperAdmin || !deleteArticleId) return;
    try {
      const { error } = await supabase.from('article_types').delete().eq('id', deleteArticleId);
      if (error) throw error;
      toast({ title: 'Prestation supprimée' });
      setDeleteArticleId(null);
      setDeleteArticleTypeId(null);
      await fetchAll();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  const formatPrice = (price: number) =>
    price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

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
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bibliothèque fournisseurs & prestations</CardTitle>
              <CardDescription>
                Chaque métier fournisseur dispose d'un catalogue de livrables. Les prix de référence et plafonds guident la saisie des bons de commande.
              </CardDescription>
            </div>
            {isSuperAdmin && (
              <Button onClick={() => openTypeDialog()} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Nouveau métier
              </Button>
            )}
          </div>
          {!isSuperAdmin && (
            <div className="rounded-md border p-3 text-sm text-muted-foreground mt-2">
              Vous êtes en lecture seule. Seul un super admin peut modifier cette bibliothèque.
            </div>
          )}
        </CardHeader>
        <CardContent>
          {supplierTypes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun métier fournisseur défini.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {supplierTypes.map((type) => {
              const articles = articlesByType[type.id] || [];
              return (
                <Card key={type.id} className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base">{type.name}</CardTitle>
                        {type.description && (
                          <CardDescription className="text-xs mt-0.5">{type.description}</CardDescription>
                        )}
                      </div>
                      {isSuperAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openTypeDialog(type)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTypeId(type.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs w-fit">
                      {articles.length} prestation{articles.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1.5">
                    {articles.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-muted/40 text-sm group"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate font-medium">{article.name}</span>
                          {article.is_price_cap && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ShieldAlert className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Prix plafond : {formatPrice(Number(article.default_unit_price || 0))}</p>
                                <p className="text-xs text-muted-foreground">Un BC dépassant ce montant restera en brouillon</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {!article.is_price_cap && Number(article.default_unit_price || 0) > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Prix de référence : {formatPrice(Number(article.default_unit_price || 0))}</p>
                                <p className="text-xs text-muted-foreground">{article.unit || 'unité'}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {Number(article.default_unit_price || 0) > 0
                              ? formatPrice(Number(article.default_unit_price || 0))
                              : '—'}
                          </span>
                          {isSuperAdmin && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openArticleDialog(type.id, article)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setDeleteArticleId(article.id); setDeleteArticleTypeId(type.id); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {articles.length === 0 && (
                      <p className="text-xs text-muted-foreground px-2 py-1">Aucune prestation</p>
                    )}

                    {isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-7 mt-1"
                        onClick={() => openArticleDialog(type.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Ajouter une prestation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Type dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Modifier le métier' : 'Nouveau métier fournisseur'}</DialogTitle>
            <DialogDescription>Ce métier sera proposé lors de l'invitation d'un fournisseur.</DialogDescription>
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
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveType} disabled={saving || !isSuperAdmin}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article dialog */}
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
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is-price-cap" className="font-medium flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-orange-500" />
                  Définir comme prix plafond
                </Label>
                <p className="text-xs text-muted-foreground">
                  Le BC restera en brouillon si le prix unitaire dépasse ce montant
                </p>
              </div>
              <Switch
                id="is-price-cap"
                checked={articleForm.is_price_cap}
                onCheckedChange={(checked) => setArticleForm((prev) => ({ ...prev, is_price_cap: checked }))}
                disabled={Number(articleForm.default_unit_price || 0) <= 0}
              />
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
            <Button variant="outline" onClick={() => setArticleDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveArticle} disabled={saving || !isSuperAdmin}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete type */}
      <AlertDialog open={!!deleteTypeId} onOpenChange={(open) => !open && setDeleteTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce métier fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action peut échouer si des fournisseurs ou prestations sont encore rattachés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteType}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete article */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={(open) => { if (!open) { setDeleteArticleId(null); setDeleteArticleTypeId(null); } }}>
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
    </TooltipProvider>
  );
};

export default SupplierCatalogTab;
