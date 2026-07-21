
import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AtSign, Building2, Phone, Search, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { notifyVendorInvited } from '@/services/notificationService';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierTypes } from '@/hooks/useSupplierTypes';
import { SireneSearchDialog } from '@/components/vendors/SireneSearchDialog';
import { SirenePrefill, formatSiren } from '@/hooks/useSireneSearch';

interface InviteVendorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteVendorDialog: React.FC<InviteVendorDialogProps> = ({ 
  isOpen, 
  onOpenChange 
}) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [supplierTypeId, setSupplierTypeId] = useState("");
  const [message, setMessage] = useState("");
  const [sendCopy, setSendCopy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSireneOpen, setIsSireneOpen] = useState(false);
  const [sirene, setSirene] = useState<SirenePrefill | null>(null);
  const { toast } = useToast();
  const { createSupplier } = useSuppliers();
  const { supplierTypes } = useSupplierTypes();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        variant: "destructive",
        title: "Informations requises",
        description: "Le nom du fournisseur est obligatoire.",
      });
      return;
    }

    // Métier obligatoire : sans lui le fournisseur retombe en « Non classé » dans
    // tous les reportings (dashboard, répartition par métier).
    if (!supplierTypeId) {
      toast({
        variant: "destructive",
        title: "Activité requise",
        description: "Choisissez l'activité / métier du fournisseur.",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the supplier in the database
      await createSupplier.mutateAsync({
        name,
        email: email || null,
        phone: phone || undefined,
        supplier_type_id: supplierTypeId,
        // Infos légales issues du registre SIRENE (si fiche liée)
        ...(sirene ? {
          siren: sirene.siren,
          vat_number: sirene.vat_number || undefined,
          address: sirene.address || undefined,
          city: sirene.city || undefined,
          country: sirene.country,
        } : {}),
      });

      // Send the invitation via notification (best-effort, seulement si email fourni)
      if (email) {
        try {
          await notifyVendorInvited(
            { email, name },
            { email: 'current.user@company.com', name: 'Current User' }
          );
        } catch {
          // Notification failure is non-blocking
        }
      }

      toast({
        title: email ? "Invitation envoyée" : "Fournisseur créé",
        description: email
          ? `L'invitation a été envoyée à ${name} (${email})`
          : `${name} a été créé sans email — l'invitation pourra être envoyée plus tard.`,
      });
      
      onOpenChange(false);
      setEmail("");
      setName("");
      setPhone("");
      setSupplierTypeId("");
      setMessage("");
      setSendCopy(false);
      setSirene(null);
    } catch (error) {
      // Error handled by mutation's onError
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Inviter un Fournisseur</DialogTitle>
            <DialogDescription>
              Envoyer une invitation par email à un nouveau fournisseur pour rejoindre votre portail.
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Nom du Fournisseur"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier-type" className="text-right">
                Activité *
              </Label>
              <div className="col-span-3">
                <Select value={supplierTypeId} onValueChange={setSupplierTypeId}>
                  <SelectTrigger id="supplier-type">
                    <SelectValue placeholder="Choisir une activité" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          {t.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />}
                          {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {supplierTypes.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Aucune activité définie. Créez-en dans Réglages → Catalogue fournisseurs.
                  </p>
                )}
              </div>
            </div>

            {sirene && (
              <div className="grid grid-cols-4 items-start gap-4">
                <div></div>
                <div className="col-span-3 flex items-start gap-2 rounded-md border bg-muted/50 p-2.5 text-xs">
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
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3 relative">
                <AtSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8"
                  placeholder="email@fournisseur.com (optionnel)"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Téléphone
              </Label>
              <div className="col-span-3 relative">
                <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-8"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="col-span-3"
                placeholder="Message optionnel pour le fournisseur..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div></div>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="send-copy"
                  checked={sendCopy}
                  onCheckedChange={setSendCopy}
                />
                <Label htmlFor="send-copy">M'envoyer une copie</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Envoi en cours..." : "Envoyer l'invitation"}
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

export default InviteVendorDialog;
