
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConfirmationDialog = ({ open, onOpenChange }: ConfirmationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Confirmation</DialogTitle>
          <DialogDescription>
            Nous avons bien reçu votre demande et vous informerons quand vous pourrez beta tester notre produits.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
