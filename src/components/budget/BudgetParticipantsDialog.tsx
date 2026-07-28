import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useBudgetParticipants, PARTICIPANT_ROLES } from '@/hooks/useBudgetParticipants';

interface BudgetParticipantsDialogProps {
  budgetId: string | null;
  budgetName?: string;
  onClose: () => void;
}

/**
 * Gestion des participants d'un budget : le créateur invite des collaborateurs
 * de l'organisation à émettre des BdC, chacun avec un rôle et un plafond
 * d'engagement par BdC (pré-rempli selon le rôle, ajustable).
 */
const BudgetParticipantsDialog = ({ budgetId, budgetName, onClose }: BudgetParticipantsDialogProps) => {
  const { participants, isLoading, addParticipant, updateParticipant, removeParticipant } = useBudgetParticipants(budgetId ?? undefined);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('chef_de_projet');

  const { data: members = [] } = useQuery({
    queryKey: ['org-members'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      return (data || []).filter(p => p.id !== user?.id);
    },
  });

  const available = members.filter(m => !participants.some(p => p.user_id === m.id));

  const handleAdd = () => {
    if (!newUserId) return;
    addParticipant.mutate({ userId: newUserId, role: newRole });
    setNewUserId('');
  };

  const fmtEur = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <Dialog open={!!budgetId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Participants — {budgetName || 'budget'}</DialogTitle>
          <DialogDescription>
            Invitez des collaborateurs à créer des bons de commande sur ce budget.
            Chaque rôle porte un plafond d'engagement par BdC, ajustable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">Collaborateur</span>
            <Select value={newUserId} onValueChange={setNewUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un membre de l'organisation" />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 ? (
                  <SelectItem value="__none__" disabled>Tous les membres sont déjà participants</SelectItem>
                ) : available.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name || m.email || m.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[170px] space-y-1">
            <span className="text-xs text-muted-foreground">Rôle</span>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PARTICIPANT_ROLES).map(([key, r]) => (
                  <SelectItem key={key} value={key}>
                    {r.label} · {fmtEur(r.defaultMax)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!newUserId || addParticipant.isPending}>
            <UserPlus className="h-4 w-4 mr-1" />
            Inviter
          </Button>
        </div>

        <div className="space-y-1.5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Chargement…</p>
          ) : participants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun participant pour l'instant — seul le créateur du budget émet des BdC.
            </p>
          ) : participants.map(p => (
            <div key={p.id} className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{p.fullName || p.email || p.user_id}</div>
                {p.fullName && p.email && (
                  <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                )}
              </div>
              <Select value={p.role} onValueChange={(role) => updateParticipant.mutate({ id: p.id, role })}>
                <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTICIPANT_ROLES).map(([key, r]) => (
                    <SelectItem key={key} value={key}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-[110px]">
                <Input
                  type="number"
                  min={0}
                  className="h-8 text-xs text-right"
                  title="Plafond d'engagement par BdC (vide = illimité)"
                  value={p.max_po_amount ?? ''}
                  placeholder="Illimité"
                  onChange={(e) => updateParticipant.mutate({
                    id: p.id,
                    maxPoAmount: e.target.value === '' ? null : Number(e.target.value),
                  })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Retirer ce participant"
                onClick={() => removeParticipant.mutate(p.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetParticipantsDialog;
