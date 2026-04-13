import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, CreditCard } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  display_order: number;
}

interface PaymentModality {
  id: string;
  payment_method_id: string;
  name: string;
  code: string;
  is_active: boolean;
  display_order: number;
}

const BackofficePaymentMethods: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [modalitiesByMethod, setModalitiesByMethod] = useState<Record<string, PaymentModality[]>>({});

  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [methodForm, setMethodForm] = useState({ name: '', code: '' });

  const [modalityDialogOpen, setModalityDialogOpen] = useState(false);
  const [modalityMethodId, setModalityMethodId] = useState<string | null>(null);
  const [editingModality, setEditingModality] = useState<PaymentModality | null>(null);
  const [modalityForm, setModalityForm] = useState({ name: '', code: '' });

  const [deleteMethodId, setDeleteMethodId] = useState<string | null>(null);
  const [deleteModalityId, setDeleteModalityId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const [mRes, modRes] = await Promise.all([
      supabase.from('payment_methods').select('*').order('display_order'),
      supabase.from('payment_modalities').select('*').order('display_order'),
    ]);
    if (mRes.error) throw mRes.error;
    if (modRes.error) throw modRes.error;

    setMethods((mRes.data || []) as PaymentMethod[]);
    const grouped: Record<string, PaymentModality[]> = {};
    (modRes.data || []).forEach((mod: any) => {
      if (!grouped[mod.payment_method_id]) grouped[mod.payment_method_id] = [];
      grouped[mod.payment_method_id].push(mod);
    });
    setModalitiesByMethod(grouped);
  };

  useEffect(() => {
    fetchAll().catch(() => toast({ variant: 'destructive', title: 'Erreur de chargement' })).finally(() => setLoading(false));
  }, []);

  const openMethodDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setMethodForm({ name: method.name, code: method.code });
    } else {
      setEditingMethod(null);
      setMethodForm({ name: '', code: '' });
    }
    setMethodDialogOpen(true);
  };

  const openModalityDialog = (methodId: string, modality?: PaymentModality) => {
    setModalityMethodId(methodId);
    if (modality) {
      setEditingModality(modality);
      setModalityForm({ name: modality.name, code: modality.code });
    } else {
      setEditingModality(null);
      setModalityForm({ name: '', code: '' });
    }
    setModalityDialogOpen(true);
  };

  const handleSaveMethod = async () => {
    if (!methodForm.name.trim()) return;
    setSaving(true);
    try {
      const code = methodForm.code.trim() || methodForm.name.trim().toLowerCase().replace(/\s+/g, '_');
      if (editingMethod) {
        const { error } = await supabase.from('payment_methods').update({ name: methodForm.name.trim(), code }).eq('id', editingMethod.id);
        if (error) throw error;
      } else {
        const maxOrder = methods.reduce((max, m) => Math.max(max, m.display_order), 0);
        const { error } = await supabase.from('payment_methods').insert({ name: methodForm.name.trim(), code, display_order: maxOrder + 1 });
        if (error) throw error;
      }
      setMethodDialogOpen(false);
      await fetchAll();
      toast({ title: editingMethod ? 'Moyen de paiement modifié' : 'Moyen de paiement créé' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModality = async () => {
    if (!modalityForm.name.trim() || !modalityMethodId) return;
    setSaving(true);
    try {
      const code = modalityForm.code.trim() || modalityForm.name.trim().toLowerCase().replace(/\s+/g, '_');
      if (editingModality) {
        const { error } = await supabase.from('payment_modalities').update({ name: modalityForm.name.trim(), code }).eq('id', editingModality.id);
        if (error) throw error;
      } else {
        const existing = modalitiesByMethod[modalityMethodId] || [];
        const maxOrder = existing.reduce((max, m) => Math.max(max, m.display_order), 0);
        const { error } = await supabase.from('payment_modalities').insert({
          payment_method_id: modalityMethodId,
          name: modalityForm.name.trim(),
          code,
          display_order: maxOrder + 1,
        });
        if (error) throw error;
      }
      setModalityDialogOpen(false);
      await fetchAll();
      toast({ title: editingModality ? 'Modalité modifiée' : 'Modalité créée' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMethod = async () => {
    if (!deleteMethodId) return;
    try {
      const { error } = await supabase.from('payment_methods').delete().eq('id', deleteMethodId);
      if (error) throw error;
      setDeleteMethodId(null);
      await fetchAll();
      toast({ title: 'Moyen de paiement supprimé' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    }
  };

  const handleDeleteModality = async () => {
    if (!deleteModalityId) return;
    try {
      const { error } = await supabase.from('payment_modalities').delete().eq('id', deleteModalityId);
      if (error) throw error;
      setDeleteModalityId(null);
      await fetchAll();
      toast({ title: 'Modalité supprimée' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    }
  };

  const toggleMethodActive = async (method: PaymentMethod) => {
    const { error } = await supabase.from('payment_methods').update({ is_active: !method.is_active }).eq('id', method.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
      await fetchAll();
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Moyens de Paiement</h1>
          <p className="text-muted-foreground text-sm">Configurez les moyens de paiement et leurs modalités. Visible par tous les utilisateurs.</p>
        </div>
        <Button onClick={() => openMethodDialog()} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nouveau moyen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {methods.map(method => {
          const mods = modalitiesByMethod[method.id] || [];
          return (
            <Card key={method.id} className={`border shadow-sm ${!method.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <CardTitle className="text-base">{method.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Code : {method.code}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={method.is_active}
                      onCheckedChange={() => toggleMethodActive(method)}
                      className="scale-75"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openMethodDialog(method)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteMethodId(method.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs w-fit">
                  {mods.length} modalité{mods.length !== 1 ? 's' : ''}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5">
                {mods.map(mod => (
                  <div key={mod.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-muted/40 text-sm group">
                    <span className="truncate font-medium">{mod.name}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openModalityDialog(method.id, mod)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteModalityId(mod.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {mods.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">Aucune modalité</p>}
                <Button variant="ghost" size="sm" className="w-full text-xs h-7 mt-1" onClick={() => openModalityDialog(method.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Ajouter une modalité
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Method dialog */}
      <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'Modifier le moyen de paiement' : 'Nouveau moyen de paiement'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={methodForm.name} onChange={e => setMethodForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex : Virement" />
            </div>
            <div className="space-y-2">
              <Label>Code technique</Label>
              <Input value={methodForm.code} onChange={e => setMethodForm(f => ({ ...f, code: e.target.value }))} placeholder="Auto-généré si vide" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMethodDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveMethod} disabled={saving || !methodForm.name.trim()}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modality dialog */}
      <Dialog open={modalityDialogOpen} onOpenChange={setModalityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModality ? 'Modifier la modalité' : 'Nouvelle modalité'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={modalityForm.name} onChange={e => setModalityForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex : SEPA" />
            </div>
            <div className="space-y-2">
              <Label>Code technique</Label>
              <Input value={modalityForm.code} onChange={e => setModalityForm(f => ({ ...f, code: e.target.value }))} placeholder="Auto-généré si vide" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalityDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveModality} disabled={saving || !modalityForm.name.trim()}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete method confirm */}
      <AlertDialog open={!!deleteMethodId} onOpenChange={() => setDeleteMethodId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce moyen de paiement ?</AlertDialogTitle>
            <AlertDialogDescription>Toutes les modalités associées seront supprimées.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMethod}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete modality confirm */}
      <AlertDialog open={!!deleteModalityId} onOpenChange={() => setDeleteModalityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette modalité ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModality}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BackofficePaymentMethods;
