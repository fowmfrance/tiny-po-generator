import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AtSign, Phone, Send, Building2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { notifyVendorInvited } from '@/services/notificationService';

interface CreatedVendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  supplier_type_id?: string | null;
  is_active?: boolean;
}

interface SupplierTypeOption {
  id: string;
  name: string;
}

interface InviteVendorQuickDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorInvited: (vendor: CreatedVendor) => void;
}

const InviteVendorQuickDialog: React.FC<InviteVendorQuickDialogProps> = ({
  isOpen,
  onOpenChange,
  onVendorInvited,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [supplierTypeId, setSupplierTypeId] = useState<string>('other');
  const [supplierTypes, setSupplierTypes] = useState<SupplierTypeOption[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const loadSupplierTypes = async () => {
      setIsLoadingTypes(true);
      try {
        const { data, error } = await supabase
          .from('supplier_types')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setSupplierTypes((data || []) as SupplierTypeOption[]);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: error.message || 'Impossible de charger les types de fournisseurs.',
        });
      } finally {
        setIsLoadingTypes(false);
      }
    };

    loadSupplierTypes();
  }, [isOpen, toast]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSupplierTypeId('other');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Informations requises',
        description: "Veuillez remplir la raison sociale et l'email.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('Non authentifié');

      const payload = {
        user_id: user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        supplier_type_id: supplierTypeId === 'other' ? null : supplierTypeId,
        is_active: false,
      };

      const { data: createdSupplier, error } = await supabase
        .from('suppliers')
        .insert(payload)
        .select('id, name, email, phone, supplier_type_id, is_active')
        .single();

      if (error) throw error;

      // Send welcome email (best-effort)
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'supplier-welcome',
            recipientEmail: createdSupplier.email,
            idempotencyKey: `supplier-welcome-${createdSupplier.id}`,
            templateData: { supplierName: createdSupplier.name },
          },
        });
      } catch {
        // Best effort only
      }

      toast({
        title: 'Invitation envoyée',
        description:
          'Le fournisseur est créé et invité. Son KYC reste en attente, les BC resteront en brouillon.',
      });

      onVendorInvited({
        id: createdSupplier.id,
        name: createdSupplier.name,
        email: createdSupplier.email,
        phone: createdSupplier.phone || undefined,
        supplier_type_id: createdSupplier.supplier_type_id,
        is_active: createdSupplier.is_active,
      });

      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Erreur d'envoi",
        description: error.message || "L'invitation n'a pas pu être envoyée. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Inviter un fournisseur</DialogTitle>
            <DialogDescription>
              Le fournisseur est invité au portail KYC. Tant que son KYC n’est pas validé, ses BC restent en brouillon.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Raison sociale *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vendor-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  placeholder="Nom de l'entreprise"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-type">Type de fournisseur *</Label>
              <Select value={supplierTypeId} onValueChange={setSupplierTypeId}>
                <SelectTrigger id="supplier-type">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {supplierTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Autre (hors catalogue)</SelectItem>
                </SelectContent>
              </Select>
              {isLoadingTypes && (
                <p className="text-xs text-muted-foreground">Chargement des types...</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-email">Email de contact *</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vendor-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="contact@fournisseur.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-phone">Téléphone (optionnel)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vendor-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex items-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? 'Envoi en cours...' : 'Inviter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteVendorQuickDialog;
