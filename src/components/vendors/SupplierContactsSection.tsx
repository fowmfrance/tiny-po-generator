import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSupplierContacts, SupplierContact } from '@/hooks/useSupplierContacts';
import { Plus, Pencil, Trash2, Mail, Phone, Star, Users } from 'lucide-react';

interface Props {
  supplierId: string;
}

const emptyForm = {
  first_name: '',
  last_name: '',
  role: '',
  email: '',
  phone: '',
  is_primary: false,
  notes: '',
};

export function SupplierContactsSection({ supplierId }: Props) {
  const { contacts, isLoading, createContact, updateContact, deleteContact } = useSupplierContacts(supplierId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: SupplierContact) => {
    setEditingId(c.id);
    setForm({
      first_name: c.first_name || '',
      last_name: c.last_name,
      role: c.role || '',
      email: c.email || '',
      phone: c.phone || '',
      is_primary: c.is_primary,
      notes: c.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      supplier_id: supplierId,
      first_name: form.first_name || null,
      last_name: form.last_name,
      role: form.role || null,
      email: form.email || null,
      phone: form.phone || null,
      is_primary: form.is_primary,
      notes: form.notes || null,
    };
    if (editingId) {
      updateContact.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createContact.mutate(payload as any, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Contacts
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="h-3 w-3 mr-1" /> Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun contact enregistré.</p>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-md border text-sm group hover:bg-muted/50">
                <div className="flex items-center gap-3 min-w-0">
                  {c.is_primary && <Star className="h-3 w-3 text-yellow-500 shrink-0" />}
                  <div className="min-w-0">
                    <span className="font-medium">{[c.first_name, c.last_name].filter(Boolean).join(' ')}</span>
                    {c.role && <span className="text-muted-foreground ml-2">· {c.role}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {c.email && (
                      <span className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" /> {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContact.mutate(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier le contact' : 'Ajouter un contact'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Prénom</Label>
                <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Nom *</Label>
                <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fonction</Label>
              <Input placeholder="ex: Comptabilité, Commercial…" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Contact principal</Label>
              <Switch checked={form.is_primary} onCheckedChange={v => setForm(f => ({ ...f, is_primary: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!form.last_name || createContact.isPending || updateContact.isPending}>
              {editingId ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
