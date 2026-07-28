import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMyPermissions } from '@/hooks/useOrgTeam';

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

const sameMonthAsNow = (iso: string | null) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

export default function EditBudgetDialog({ open, onOpenChange, budget, onSaved }: EditBudgetDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(budget.name);
  const [initialAmount, setInitialAmount] = useState(budget.initial_amount);
  const [startDate, setStartDate] = useState(budget.start_date || '');
  const [endDate, setEndDate] = useState(budget.end_date || '');
  const [isSaving, setIsSaving] = useState(false);

  const { data: perms } = useMyPermissions();
  const isKeyUser = perms?.isKeyUser ?? false;

  // Du CA / des coûts sont-ils déjà reconnus sur ce budget ?
  const { data: recognitionStarted = false } = useQuery({
    queryKey: ['budget-recognition-started', budget.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('budget_recognition_started', { _budget_id: budget.id });
      if (error) {
        console.error('budget_recognition_started error:', error);
        return false;
      }
      return !!data;
    },
  });

  // Verrouillage des dates (hors key user) — règles cut-off :
  // 1) le projet commence ou se termine le mois en cours ;
  // 2) du CA et des coûts sont déjà reconnus → pas de report par l'équipe.
  const datesLocked = !isKeyUser
    && (recognitionStarted || sameMonthAsNow(budget.start_date) || sameMonthAsNow(budget.end_date));
  const lockReason = recognitionStarted
    ? 'Du CA et des coûts sont déjà reconnus : seul le key user peut reporter ce projet (reprises de provisions).'
    : 'Le projet commence ou se termine ce mois-ci : les dates sont verrouillées pour le cut-off. Voyez votre key user.';

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
    // Les dates sont obligatoires (la reconnaissance et le cut-off s'y adossent).
    if (!startDate || !endDate) {
      toast({ title: 'Dates requises', description: 'La date de début et la date de fin sont obligatoires.', variant: 'destructive' });
      return;
    }
    if (endDate < startDate) {
      toast({ title: 'Dates incohérentes', description: 'La date de fin doit être postérieure à la date de début.', variant: 'destructive' });
      return;
    }
    const datesChanged = startDate !== (budget.start_date || '') || endDate !== (budget.end_date || '');
    if (datesChanged && datesLocked) {
      toast({ title: 'Dates verrouillées', description: lockReason, variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          name: name.trim(),
          initial_amount: initialAmount,
          start_date: startDate,
          end_date: endDate,
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
              <Label htmlFor="edit-start">Date de début *</Label>
              <Input id="edit-start" type="date" value={startDate} disabled={datesLocked} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">Date de fin *</Label>
              <Input id="edit-end" type="date" value={endDate} disabled={datesLocked} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {datesLocked && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {lockReason}
            </p>
          )}
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
