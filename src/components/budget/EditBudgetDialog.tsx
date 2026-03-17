import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: {
    id: string;
    name: string;
    code: string;
    currency: string;
    initial_amount: number;
    start_date: string | null;
    end_date: string | null;
  };
  onSaved: () => void;
}

export default function EditBudgetDialog({ open, onOpenChange, budget, onSaved }: EditBudgetDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(budget.name);
  const [initialAmount, setInitialAmount] = useState(budget.initial_amount);
  const [startDate, setStartDate] = useState(budget.start_date || '');
  const [endDate, setEndDate] = useState(budget.end_date || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(budget.name);
    setInitialAmount(budget.initial_amount);
    setStartDate(budget.start_date || '');
    setEndDate(budget.end_date || '');
  }, [budget]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Erreur', description: 'Le nom est requis.', variant: 'destructive' });
      return;
    }
    if (initialAmount <= 0) {
      toast({ title: 'Erreur', description: 'Le montant doit être supérieur à 0.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          name: name.trim(),
          initial_amount: initialAmount,
          start_date: startDate || null,
          end_date: endDate || null,
        })
        .eq('id', budget.id);

      if (error) throw error;

      toast({ title: 'Budget mis à jour', description: 'Les modifications ont été enregistrées.' });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const symbol = budget.currency === 'USD' ? '$' : budget.currency === 'GBP' ? '£' : '€';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le budget</DialogTitle>
          <DialogDescription>Code : {budget.code} — Devise : {budget.currency}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nom du budget</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Montant initial ({symbol})</Label>
            <Input
              id="edit-amount"
              type="number"
              min="0"
              step="0.01"
              value={initialAmount}
              onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start">Date de début</Label>
              <Input id="edit-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">Date de fin</Label>
              <Input id="edit-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
