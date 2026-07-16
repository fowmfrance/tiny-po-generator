import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AtSign, Phone, Send, Building2, Loader2, Search, ShieldCheck, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { notifyVendorInvited } from '@/services/notificationService';
import { SireneSearchDialog } from '@/components/vendors/SireneSearchDialog';
import { SirenePrefill, formatSiren } from '@/hooks/useSireneSearch';

interface CreatedVendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  supplier_type_id?: string | null;
  is_active?: boolean;
}

interface SupplierTypeOption { id: string; name: string; }
interface KycLevelOption { id: string; name: string; description: string | null; }

interface InviteVendorQuickDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorInvited: (vendor: CreatedVendor) => void;
}

const InviteVendorQuickDialog: React.FC<InviteVendorQuickDialogProps> = ({
  isOpen, onOpenChange, onVendorInvited,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [supplierTypeId, setSupplierTypeId] = useState<string>('other');
  const [kycLevelId, setKycLevelId] = useState<string>('none');
  const [supplierTypes, setSupplierTypes] = useState<SupplierTypeOption[]>([]);
  const [kycLevels, setKycLevels] = useState<KycLevelOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSireneOpen, setIsSireneOpen] = useState(false);
  const [sirene, setSirene] = useState<SirenePrefill | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [typesRes, levelsRes] = await Promise.all([
          supabase.from('supplier_types').select('id, name').eq('is_active', true).order('name'),
          supabase.from('kyc_levels').select('id, name, description').order('display_order'),
        ]);
        if (typesRes.data) setSupplierTypes(typesRes.data as SupplierTypeOption[]);
        if (levelsRes.data) setKycLevels(levelsRes.data as KycLevelOption[]);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les options.' });
      } finally {
        setIsLoadingOptions(false);
      }
    };
    loadOptions();
  }, [isOpen, toast]);

  const resetForm = () => {
    setName(''); setEmail(''); setPhone('');
    setSupplierTypeId('other'); setKycLevelId('none');
    setSirene(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ variant: 'destructive', title: 'Informations requises', description: "Veuillez remplir la raison sociale et l'email." });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('Non authentifié');

      const { getCurrentOrganizationId } = await import('@/utils/organization');
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');

      // Create supplier with KYC level
      const payload = {
        user_id: user.id,
        organization_id: organizationId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        supplier_type_id: supplierTypeId === 'other' ? null : supplierTypeId,
        kyc_level_id: kycLevelId === 'none' ? null : kycLevelId,
        kyc_status: kycLevelId === 'none' ? 'approved' : 'pending',
        is_active: kycLevelId === 'none',
        // Infos légales issues du registre SIRENE (si fiche liée)
        ...(sirene ? {
          siren: sirene.siren,
          vat_number: sirene.vat_number || null,
          address: sirene.address || null,
          city: sirene.city || null,
          country: sirene.country,
        } : {}),
      };

      const { data: createdSupplier, error } = await supabase
        .from('suppliers')
        .insert(payload)
        .select('id, name, email, phone, supplier_type_id, is_active')
        .single();

      if (error) throw error;

      // Send magic link + welcome email + copy (all handled by the edge function)
      try {
        await supabase.functions.invoke('send-supplier-magic-link', {
          body: { supplier_id: createdSupplier.id },
        });
      } catch {
        // Best effort
      }

      toast({
        title: 'Invitation envoyée',
        description: kycLevelId === 'none'
          ? 'Le fournisseur a reçu son lien d\'accès au portail.'
          : 'Le fournisseur a reçu son lien d\'accès avec la liste des documents KYC à fournir.',
      });

      onVendorInvited({
        id: createdSupplier.id,
        name: createdSupplier.name,
        email: createdSupplier.email,
        phone: createdSupplier.phone || undefined,
        supplier_type_id: createdSupplier.supplier_type_id,
        is_active: createdSupplier.is_active ?? false,
      });

      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Erreur d'envoi", description: error.message || "L'invitation n'a pas pu être envoyée." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => { resetForm(); onOpenChange(false); };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Inviter un fournisseur</DialogTitle>
            <DialogDescription>
              Le fournisseur recevra un lien d'accès sécurisé à son portail.
              {' '}Si un niveau KYC est défini, il devra d'abord déposer ses documents.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={() => setIsSireneOpen(true)}
            >
              <Search className="h-4 w-4" />
              Rechercher dans le registre SIRENE (nom, SIREN ou SIRET)
            </Button>

            <div className="space-y-2">
              <Label htmlFor="vendor-name">Raison sociale *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="vendor-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder="Nom de l'entreprise" required />
              </div>
            </div>

            {sirene && (
              <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-2.5 text-xs">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Fiche SIRENE liée</p>
                  <p className="text-muted-foreground">
                    SIREN {formatSiren(sirene.siren)}
                    {sirene.vat_number && <> · TVA {sirene.vat_number}</>}
                  </p>
                  {(sirene.address || sirene.city) && (
                    <p className="text-muted-foreground truncate">
                      {[sirene.address, sirene.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setSirene(null)}
                  aria-label="Retirer la fiche SIRENE"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="supplier-type">Type de fournisseur *</Label>
              <Select value={supplierTypeId} onValueChange={setSupplierTypeId}>
                <SelectTrigger id="supplier-type"><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                <SelectContent>
                  {supplierTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                  <SelectItem value="other">Autre (hors catalogue)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kyc-level">Niveau KYC</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Select value={kycLevelId} onValueChange={setKycLevelId}>
                  <SelectTrigger id="kyc-level" className="pl-10"><SelectValue placeholder="Choisir un niveau" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun (accès direct)</SelectItem>
                    {kycLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}{level.description ? ` — ${level.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-email">Email de contact *</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="vendor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="contact@fournisseur.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-phone">Téléphone (optionnel)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="vendor-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" placeholder="+33 6 12 34 56 78" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
            <Button type="submit" className="flex items-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? 'Envoi en cours...' : 'Inviter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <SireneSearchDialog
        open={isSireneOpen}
        onOpenChange={setIsSireneOpen}
        initialQuery={name}
        onSelect={(prefill) => {
          setName(prefill.name);
          setSirene(prefill);
        }}
      />
    </Dialog>
  );
};

export default InviteVendorQuickDialog;
