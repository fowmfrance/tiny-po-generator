import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Briefcase, Share2 } from 'lucide-react';

interface SupplierTypeTemplate {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
}

// La table supplier_type_templates n'est pas encore dans les types générés
// (migration appliquée à la main) → accès non typé assumé.
const db = supabase as any;

const emptyForm = { name: '', description: '', color: '#B8853A' };

const BackofficeSupplierTypes: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<SupplierTypeTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierTypeTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [propagating, setPropagating] = useState(false);

  const fetchTemplates = async () => {
    const { data, error } = await db
      .from('supplier_type_templates')
      .select('id, name, description, color, icon')
      .order('name');
    if (error) throw error;
    setTemplates((data || []) as SupplierTypeTemplate[]);
  };

  useEffect(() => {
    fetchTemplates()
      .catch(() => toast({ variant: 'destructive', title: 'Erreur de chargement' }))
      .finally(() => setLoading(false));
  }, []);

  const openDialog = (t?: SupplierTypeTemplate) => {
    if (t) {
      setEditing(t);
      setForm({ name: t.name, description: t.description || '', color: t.color || '#B8853A' });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast({ variant: 'destructive', title: 'Nom requis' });
      return;
    }
    setSaving(true);
    try {
      const payload = { name, description: form.description.trim() || null, color: form.color || null };
      if (editing) {
        const { error } = await db.from('supplier_type_templates').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('supplier_type_templates').insert(payload);
        if (error) throw error;
      }
      toast({ title: editing ? 'Métier modifié' : 'Métier ajouté' });
      setDialogOpen(false);
      await fetchTemplates();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await db.from('supplier_type_templates').delete().eq('id', deleteId);
      if (error) throw error;
      toast({ title: 'Métier supprimé du catalogue' });
      await fetchTemplates();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.message });
    } finally {
      setDeleteId(null);
    }
  };

  const propagate = async () => {
    setPropagating(true);
    try {
      const { data, error } = await db.rpc('propagate_supplier_type_templates');
      if (error) throw error;
      const n = Number(data) || 0;
      toast({
        title: 'Catalogue propagé',
        description: n > 0 ? `${n} métier(s) ajouté(s) aux organisations.` : 'Toutes les organisations étaient déjà à jour.',
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.message });
    } finally {
      setPropagating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-brand" />
            Catalogue métiers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set « admin » de métiers fournisseurs, hérité par chaque organisation à sa création.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={propagate} disabled={propagating}>
            {propagating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
            Propager aux orgs
          </Button>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{templates.length} métier(s)</CardTitle>
          <CardDescription>
            « Propager aux orgs » applique le catalogue aux organisations existantes (métiers manquants
            uniquement — les métiers propres à chaque org sont conservés).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : templates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Catalogue vide.</p>
          ) : (
            <ul className="divide-y divide-border">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color || '#B8853A' }} />
                  <span className="flex-1 min-w-0">
                    <span className="font-medium block truncate">{t.name}</span>
                    {t.description && <span className="text-xs text-muted-foreground truncate block">{t.description}</span>}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le métier' : 'Nouveau métier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="st-name">Nom</Label>
              <Input id="st-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Photographie" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-desc">Description (optionnelle)</Label>
              <Input id="st-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Courte description" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-color">Couleur</Label>
              <div className="flex items-center gap-2">
                <input id="st-color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-12 rounded border border-border" />
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-32" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce métier du catalogue ?</AlertDialogTitle>
            <AlertDialogDescription>
              Il ne sera plus hérité par les nouvelles organisations. Les métiers déjà attribués aux organisations existantes ne sont pas supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BackofficeSupplierTypes;
