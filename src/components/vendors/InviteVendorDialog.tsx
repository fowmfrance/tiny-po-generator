
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InviteVendorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteVendorDialog = ({ isOpen, onOpenChange }: InviteVendorDialogProps) => {
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const { toast } = useToast();

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a draft vendor record (would typically save to database)
    const newVendorId = `draft-${Date.now()}`;
    
    // In a real application, this would add to the database
    // and trigger an email to the supplier
    
    toast({
      title: "Fournisseur invité avec succès",
      description: `Un email d'invitation a été envoyé à ${vendorEmail}`,
    });
    
    // Close the dialog and reset form
    onOpenChange(false);
    setVendorName('');
    setVendorEmail('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un Fournisseur</DialogTitle>
          <DialogDescription>
            Envoyer un email d'invitation à un fournisseur pour rejoindre votre réseau.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInviteSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vendor-name">Nom du Fournisseur</Label>
              <Input
                id="vendor-name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Entrez le nom de l'entreprise"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-email">Email de Contact</Label>
              <Input
                id="vendor-email"
                type="email"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="contact@entreprise.com"
                required
              />
              <p className="text-sm text-gray-500">
                Un lien d'invitation sera envoyé à cette adresse email
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Envoyer l'Invitation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteVendorDialog;
