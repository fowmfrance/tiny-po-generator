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
import { AtSign, Phone, Send, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreatedVendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      toast({
        variant: "destructive",
        title: "Informations requises",
        description: "Veuillez remplir la raison sociale et l'email.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In production, this would send the invitation via API
      const newVendor: CreatedVendor = {
        id: `vendor-${Date.now()}`,
        name,
        email,
        phone: phone || undefined,
      };

      toast({
        title: "Invitation envoyée",
        description: `L'invitation a été envoyée à ${name}. Le fournisseur devra compléter son KYC.`,
      });

      // Reset form and close
      setName("");
      setEmail("");
      setPhone("");
      onVendorInvited(newVendor);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur d'envoi",
        description: "L'invitation n'a pas pu être envoyée. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPhone("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Inviter un fournisseur</DialogTitle>
            <DialogDescription>
              Envoyez une invitation rapide. Le fournisseur devra compléter son KYC avant validation du bon de commande.
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
            <Button
              type="submit"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Envoi en cours..." : "Inviter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteVendorQuickDialog;
