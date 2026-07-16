import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TriangleAlert } from 'lucide-react';
import { METHOD_FRIENDLY_LABELS } from '@/components/create-budget/recognitionWizardContent';

interface RecognitionMethodOption {
  id: string;
  code: string;
  name_expense: string;
  description: string;
}

// Même libellé que la picklist de création (RecognitionMethodCard)
const methodLabel = (method: RecognitionMethodOption) => {
  const friendly = METHOD_FRIENDLY_LABELS[method.code];
  return friendly ? `${friendly.friendly} — ${friendly.technical}` : method.name_expense;
};

interface ChangeRecognitionMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
  currentMethodId: string | null;
  /** true dès qu'une première écriture (CA ou charge) a été reconnue sur le budget */
  recognitionStarted: boolean;
  onSaved: () => void;
}

export function ChangeRecognitionMethodDialog({
  open,
  onOpenChange,
  budgetId,
  currentMethodId,
  recognitionStarted,
  onSaved,
}: ChangeRecognitionMethodDialogProps) {
  const { toast } = useToast();
  const [selectedMethodId, setSelectedMethodId] = useState(currentMethodId || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) setSelectedMethodId(currentMethodId || '');
  }, [open, currentMethodId]);

  const { data: methods = [] } = useQuery({
    queryKey: ['recognition-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recognition_methods')
        .select('id, code, name_expense, description')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as RecognitionMethodOption[];
    },
  });

  const selectedMethod = methods.find((m) => m.id === selectedMethodId);

  const handleSave = async () => {
    if (!selectedMethodId || selectedMethodId === currentMethodId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('budgets')
        .update({ recognition_method_id: selectedMethodId })
        .eq('id', budgetId);

      if (error) throw error;

      toast({
        title: 'Méthode de reconnaissance mise à jour',
        description: recognitionStarted
          ? 'Les montants reconnus seront recalculés selon la nouvelle méthode.'
          : 'La nouvelle méthode est appliquée au budget.',
      });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      const locked = String(err?.message || '').includes('RECOGNITION_METHOD_LOCKED');
      toast({
        title: locked ? 'Méthode verrouillée' : 'Erreur',
        description: locked
          ? 'Des montants ont déjà été reconnus sur ce budget. Seul un administrateur peut changer la méthode de reconnaissance.'
          : err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {currentMethodId ? 'Changer de méthode de reconnaissance' : 'Choisir une méthode de reconnaissance'}
          </DialogTitle>
          <DialogDescription>
            La méthode détermine quand le CA et les charges de ce budget sont reconnus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {recognitionStarted && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Des montants ont déjà été reconnus sur ce budget</AlertTitle>
              <AlertDescription>
                Changer de méthode recalculera l'intégralité des montants déjà reconnus (CA et
                charges) selon la nouvelle méthode. Cette action peut modifier des périodes
                comptables passées.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Méthode de reconnaissance</Label>
            <Select value={selectedMethodId || undefined} onValueChange={setSelectedMethodId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une méthode" />
              </SelectTrigger>
              <SelectContent>
                {methods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {methodLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMethod && (
              <p className="text-sm text-muted-foreground">{selectedMethod.description}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            variant={recognitionStarted ? 'destructive' : 'default'}
            onClick={handleSave}
            disabled={isSaving || !selectedMethodId || selectedMethodId === currentMethodId}
          >
            {isSaving
              ? 'Enregistrement...'
              : recognitionStarted
                ? 'Changer et recalculer'
                : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
