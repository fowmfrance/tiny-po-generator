import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Supplier } from '@/hooks/useSuppliers';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { supabase } from '@/integrations/supabase/client';
import { ShieldOff } from 'lucide-react';

interface EditSupplierContactDialogProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Supplier> & { id: string }) => void;
  isPending?: boolean;
  isAdmin?: boolean;
}

export function EditSupplierContactDialog({ supplier, open, onOpenChange, onSave, isPending, isAdmin }: EditSupplierContactDialogProps) {
  const { methods, getModalitiesForMethod } = usePaymentMethods();
  const [supplierTypes, setSupplierTypes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase
      .from('supplier_types')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setSupplierTypes(data || []));
  }, []);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    vat_number: '',
    siren: '',
    specialty: '',
    supplier_type_id: '' as string,
    is_po_exempt: false,
    default_payment_method_id: '' as string,
    default_payment_modality_id: '' as string,
  });

  useEffect(() => {
    if (open && supplier) {
      setForm({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || '',
        vat_number: (supplier as any).vat_number || '',
        siren: (supplier as any).siren || '',
        specialty: supplier.specialty || '',
        supplier_type_id: supplier.supplier_type_id || '',
        is_po_exempt: supplier.is_po_exempt || false,
        default_payment_method_id: supplier.default_payment_method_id || '',
        default_payment_modality_id: supplier.default_payment_modality_id || '',
      });
    }
  }, [open, supplier]);

  const availableModalities = form.default_payment_method_id
    ? getModalitiesForMethod(form.default_payment_method_id)
    : [];

  const handleSave = () => {
    onSave({
      id: supplier.id,
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      country: form.country || null,
      vat_number: form.vat_number || null,
      siren: form.siren || null,
      specialty: form.specialty || null,
      supplier_type_id: form.supplier_type_id || null,
      is_po_exempt: form.is_po_exempt,
      default_payment_method_id: form.default_payment_method_id || null,
      default_payment_modality_id: form.default_payment_modality_id || null,
    } as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les informations de contact</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat_number">N° TVA</Label>
              <Input id="vat_number" placeholder="ex: FR75 823383260" value={form.vat_number} onChange={e => setForm(f => ({ ...f, vat_number: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siren">SIREN</Label>
              <Input id="siren" placeholder="ex: 823383260" value={form.siren} onChange={e => setForm(f => ({ ...f, siren: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input id="country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Activité / Métier</Label>
              <Select
                value={form.supplier_type_id || 'none'}
                onValueChange={v => setForm(f => ({ ...f, supplier_type_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non classé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non classé</SelectItem>
                  {supplierTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Spécialité</Label>
              <Input id="specialty" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
            </div>
          </div>

          <Separator />

          {/* PO Exempt toggle - admin only */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldOff className="h-4 w-4 text-amber-600" />
                <div>
                  <Label htmlFor="po-exempt">Dispensé de BdC</Label>
                  <p className="text-xs text-muted-foreground">Ce fournisseur est payé sans bon de commande</p>
                </div>
              </div>
              <Switch
                id="po-exempt"
                checked={form.is_po_exempt}
                onCheckedChange={(checked) => setForm(f => ({ ...f, is_po_exempt: checked }))}
                disabled={!isAdmin}
              />
            </div>

            {/* Payment method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Moyen de paiement</Label>
                <Select
                  value={form.default_payment_method_id}
                  onValueChange={(val) => setForm(f => ({
                    ...f,
                    default_payment_method_id: val === 'none' ? '' : val,
                    default_payment_modality_id: '',
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {methods.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modalité</Label>
                <Select
                  value={form.default_payment_modality_id}
                  onValueChange={(val) => setForm(f => ({ ...f, default_payment_modality_id: val === 'none' ? '' : val }))}
                  disabled={!form.default_payment_method_id || availableModalities.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={availableModalities.length === 0 ? 'Aucune modalité' : 'Sélectionner'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {availableModalities.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={isPending || !form.name || !form.email}>
            {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
