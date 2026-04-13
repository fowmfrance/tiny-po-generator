import React, { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Trash2, ArrowRight, Loader2, Users } from 'lucide-react';
import { SupplierContact } from '@/hooks/useSupplierContacts';
import { Supplier } from '@/hooks/useSuppliers';

interface ContactAction {
  contactId: string;
  action: 'delete' | 'move';
  targetSupplierId?: string;
}

interface DeleteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
  contacts: SupplierContact[];
  otherSuppliers: Supplier[];
  poCount: number;
  invoiceCount: number;
  onConfirm: (contactActions: ContactAction[]) => Promise<void>;
}

export function DeleteSupplierDialog({
  open,
  onOpenChange,
  supplier,
  contacts,
  otherSuppliers,
  poCount,
  invoiceCount,
  onConfirm,
}: DeleteSupplierDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [contactActions, setContactActions] = useState<Map<string, ContactAction>>(new Map());

  // Initialize contact actions when dialog opens
  React.useEffect(() => {
    if (open && contacts.length > 0) {
      const initial = new Map<string, ContactAction>();
      contacts.forEach(c => {
        initial.set(c.id, { contactId: c.id, action: 'delete' });
      });
      setContactActions(initial);
    }
  }, [open, contacts]);

  const setAction = (contactId: string, action: 'delete' | 'move') => {
    setContactActions(prev => {
      const next = new Map(prev);
      next.set(contactId, { contactId, action, targetSupplierId: undefined });
      return next;
    });
  };

  const setTargetSupplier = (contactId: string, targetSupplierId: string) => {
    setContactActions(prev => {
      const next = new Map(prev);
      const existing = next.get(contactId);
      if (existing) {
        next.set(contactId, { ...existing, targetSupplierId });
      }
      return next;
    });
  };

  const allValid = useMemo(() => {
    if (contacts.length === 0) return true;
    for (const [, action] of contactActions) {
      if (action.action === 'move' && !action.targetSupplierId) return false;
    }
    return true;
  }, [contactActions, contacts.length]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(Array.from(contactActions.values()));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer « {supplier.name} »
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Cette action est irréversible. Le fournisseur sera supprimé définitivement.
              </p>

              {(poCount > 0 || invoiceCount > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                  <p className="font-medium mb-1">Données historiques préservées</p>
                  <p>
                    {poCount > 0 && <span>{poCount} bon{poCount > 1 ? 's' : ''} de commande</span>}
                    {poCount > 0 && invoiceCount > 0 && ' et '}
                    {invoiceCount > 0 && <span>{invoiceCount} facture{invoiceCount > 1 ? 's' : ''}</span>}
                    {' '}conserveront le nom « {supplier.name} » dans l'historique.
                    La référence au fournisseur sera détachée.
                  </p>
                </div>
              )}

              {contacts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Users className="h-4 w-4" />
                    {contacts.length} contact{contacts.length > 1 ? 's' : ''} associé{contacts.length > 1 ? 's' : ''}
                  </div>
                  <p className="text-sm">
                    Pour chaque contact, choisissez de le supprimer ou de le déplacer sous un autre fournisseur :
                  </p>
                  <div className="space-y-4">
                    {contacts.map(contact => {
                      const action = contactActions.get(contact.id);
                      return (
                        <div key={contact.id} className="border rounded-md p-3 space-y-2">
                          <p className="text-sm font-medium text-foreground">
                            {contact.first_name} {contact.last_name}
                            {contact.role && <span className="text-muted-foreground ml-1">· {contact.role}</span>}
                          </p>
                          <RadioGroup
                            value={action?.action || 'delete'}
                            onValueChange={(v) => setAction(contact.id, v as 'delete' | 'move')}
                            className="flex gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="delete" id={`delete-${contact.id}`} />
                              <Label htmlFor={`delete-${contact.id}`} className="text-sm flex items-center gap-1">
                                <Trash2 className="h-3 w-3" /> Supprimer
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="move" id={`move-${contact.id}`} />
                              <Label htmlFor={`move-${contact.id}`} className="text-sm flex items-center gap-1">
                                <ArrowRight className="h-3 w-3" /> Déplacer
                              </Label>
                            </div>
                          </RadioGroup>
                          {action?.action === 'move' && (
                            <Select
                              value={action.targetSupplierId || ''}
                              onValueChange={(v) => setTargetSupplier(contact.id, v)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Choisir un fournisseur..." />
                              </SelectTrigger>
                              <SelectContent>
                                {otherSuppliers.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isDeleting || !allValid}
            onClick={handleConfirm}
          >
            {isDeleting ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Suppression...</>
            ) : (
              <><Trash2 className="h-4 w-4 mr-1" /> Supprimer définitivement</>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
