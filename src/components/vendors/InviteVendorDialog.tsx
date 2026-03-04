
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
import { AtSign, Phone, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { notifyVendorInvited } from '@/services/notificationService';
import { useSuppliers } from '@/hooks/useSuppliers';

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
  const [message, setMessage] = useState("");
  const [sendCopy, setSendCopy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { createSupplier } = useSuppliers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast({
        variant: "destructive",
        title: "Informations requises",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the supplier in the database
      await createSupplier.mutateAsync({
        name,
        email,
        phone: phone || undefined,
      });

      // Send the invitation via notification (best-effort)
      try {
        await notifyVendorInvited(
          { email, name },
          { email: 'current.user@company.com', name: 'Current User' }
        );
      } catch {
        // Notification failure is non-blocking
      }

      toast({
        title: "Invitation envoyée",
        description: `L'invitation a été envoyée à ${name} (${email})`,
      });
      
      onOpenChange(false);
      setEmail("");
      setName("");
      setPhone("");
      setMessage("");
      setSendCopy(false);
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
                  placeholder="email@fournisseur.com"
                  required
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
    </Dialog>
  );
};

export default InviteVendorDialog;
