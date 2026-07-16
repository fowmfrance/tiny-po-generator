import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useServiceTypes, ServiceType, ExpenseFamily } from '@/hooks/useServiceTypes';
import { Plus, Pencil, Loader2 } from 'lucide-react';

const emptyTypeForm = { name: '', description: '', accounting_code: '', default_expense_family_id: '' };
const emptyFamilyForm = { name: '', description: '', is_pnl: true };

const ServiceTypesTab = () => {
  const {
    families, serviceTypes, isLoading,
    createServiceType, updateServiceType, createFamily, updateFamily,
  } = useServiceTypes();

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [typeForm, setTypeForm] = useState(emptyTypeForm);

  const [familyDialogOpen, setFamilyDialogOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<ExpenseFamily | null>(null);
  const [familyForm, setFamilyForm] = useState(emptyFamilyForm);

  const openTypeDialog = (type?: ServiceType) => {
    setEditingType(type || null);
    setTypeForm(type ? {
      name: type.name,
      description: type.description || '',
      accounting_code: type.accounting_code || '',
      default_expense_family_id: type.default_expense_family_id || '',
    } : emptyTypeForm);
    setTypeDialogOpen(true);
  };

  const saveType = () => {
    const payload = {
      name: typeForm.name.trim(),
      description: typeForm.description.trim() || null,
      accounting_code: typeForm.accounting_code.trim() || null,
      default_expense_family_id: typeForm.default_expense_family_id || null,
    };
    const onSuccess = () => setTypeDialogOpen(false);
    if (editingType) {
      updateServiceType.mutate({ id: editingType.id, ...payload } as any, { onSuccess });
    } else {
      createServiceType.mutate(payload as any, { onSuccess });
    }
  };

  const openFamilyDialog = (family?: ExpenseFamily) => {
    setEditingFamily(family || null);
    setFamilyForm(family ? {
      name: family.name,
      description: family.description || '',
      is_pnl: family.is_pnl,
    } : emptyFamilyForm);
    setFamilyDialogOpen(true);
  };

  const saveFamily = () => {
    const payload = {
      name: familyForm.name.trim(),
      description: familyForm.description.trim() || null,
      is_pnl: familyForm.is_pnl,
    };
    const onSuccess = () => setFamilyDialogOpen(false);
    if (editingFamily) {
      updateFamily.mutate({ id: editingFamily.id, ...payload } as any, { onSuccess });
    } else {
      createFamily.mutate(payload as any, { onSuccess });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPending = createServiceType.isPending || updateServiceType.isPending
    || createFamily.isPending || updateFamily.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Familles de dépenses (P&L)</CardTitle>
            <CardDescription>
              Lignes agrégées du P&L auxquelles les types de prestation sont rattachés.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => openFamilyDialog()}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {families.map(f => (
            <div key={f.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
              <div>
                <span className="font-medium">{f.name}</span>
                {!f.is_pnl && <Badge variant="outline" className="ml-2 text-xs">Hors P&L</Badge>}
                {!f.is_active && <Badge variant="secondary" className="ml-2 text-xs">Inactive</Badge>}
                {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openFamilyDialog(f)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {families.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune famille — exécuter la migration de seed ou en créer une.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Types de prestation</CardTitle>
            <CardDescription>
              Niveau agrégé des prestations (futur compte 604xxx) avec sa famille de dépenses par défaut.
              Un BdC peut surcharger la famille au cas par cas → le fournisseur devient « mixte ».
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => openTypeDialog()}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {serviceTypes.map(t => (
            <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
              <div className="min-w-0">
                <span className="font-medium">{t.name}</span>
                {t.accounting_code && (
                  <Badge variant="outline" className="ml-2 text-xs font-mono">{t.accounting_code}</Badge>
                )}
                {!t.is_active && <Badge variant="secondary" className="ml-2 text-xs">Inactif</Badge>}
                {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={t.expense_family ? 'secondary' : 'outline'}>
                  {t.expense_family?.name || 'Sans famille'}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTypeDialog(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {serviceTypes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun type de prestation — exécuter la migration de seed ou en créer un.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog type de prestation */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingType ? 'Modifier le type de prestation' : 'Nouveau type de prestation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="ex : Services image" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={typeForm.description} onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Famille par défaut</Label>
                <Select
                  value={typeForm.default_expense_family_id || 'none'}
                  onValueChange={v => setTypeForm(f => ({ ...f, default_expense_family_id: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sans famille</SelectItem>
                    {families.map(fam => (
                      <SelectItem key={fam.id} value={fam.id}>{fam.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Code compta</Label>
                <Input value={typeForm.accounting_code} onChange={e => setTypeForm(f => ({ ...f, accounting_code: e.target.value }))} placeholder="604xxx (à venir)" />
              </div>
            </div>
            {editingType && (
              <div className="flex items-center justify-between">
                <Label>Actif</Label>
                <Switch
                  checked={editingType.is_active}
                  onCheckedChange={checked => updateServiceType.mutate({ id: editingType.id, is_active: checked } as any)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveType} disabled={isPending || !typeForm.name.trim()}>
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog famille */}
      <Dialog open={familyDialogOpen} onOpenChange={setFamilyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFamily ? 'Modifier la famille' : 'Nouvelle famille de dépenses'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={familyForm.name} onChange={e => setFamilyForm(f => ({ ...f, name: e.target.value }))} placeholder="ex : Projets" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={familyForm.description} onChange={e => setFamilyForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Au P&L</Label>
                <p className="text-xs text-muted-foreground">Désactiver pour les investissements / immobilisations</p>
              </div>
              <Switch checked={familyForm.is_pnl} onCheckedChange={checked => setFamilyForm(f => ({ ...f, is_pnl: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFamilyDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveFamily} disabled={isPending || !familyForm.name.trim()}>
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceTypesTab;
