import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentOrganizationId } from '@/utils/organization';
import { useToast } from '@/hooks/use-toast';

/**
 * Participants d'un budget : collaborateurs de l'organisation invités par le
 * créateur du budget à émettre des BdC sur son projet, avec un plafond
 * d'engagement PAR BdC.
 *
 * Les rôles et leurs plafonds par défaut viennent de la grille de l'instance
 * (org_roles, onglet Équipe → Rôles) ; le plafond reste ajustable par
 * participant. `role` stocke la clé du rôle d'instance.
 */

export interface BudgetParticipant {
  id: string;
  budget_id: string;
  user_id: string;
  role: string;
  max_po_amount: number | null;
  fullName: string | null;
  email: string | null;
}

interface ParticipantRow {
  id: string;
  budget_id: string;
  user_id: string;
  role: string;
  max_po_amount: number | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

export function useBudgetParticipants(budgetId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['budget-participants', budgetId],
    enabled: !!budgetId,
    queryFn: async (): Promise<BudgetParticipant[]> => {
      const { data, error } = await supabase
        .from('budget_participants')
        .select('id, budget_id, user_id, role, max_po_amount, profiles:user_id(full_name, email)')
        .eq('budget_id', budgetId!)
        .order('created_at');
      if (error) throw error;
      return ((data || []) as unknown as ParticipantRow[]).map(row => ({
        id: row.id,
        budget_id: row.budget_id,
        user_id: row.user_id,
        role: row.role,
        max_po_amount: row.max_po_amount != null ? Number(row.max_po_amount) : null,
        fullName: row.profiles?.full_name ?? null,
        email: row.profiles?.email ?? null,
      }));
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['budget-participants', budgetId] });

  const addParticipant = useMutation({
    mutationFn: async (input: { userId: string; role: string; maxPoAmount: number | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');
      const { error } = await supabase.from('budget_participants').insert({
        budget_id: budgetId!,
        user_id: input.userId,
        organization_id: organizationId,
        role: input.role,
        max_po_amount: input.maxPoAmount,
        invited_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Participant ajouté' }); },
    onError: (e: Error) => toast({
      title: 'Impossible d\'ajouter',
      description: e.message.includes('row-level security')
        ? 'Seul le créateur du budget peut gérer les participants.'
        : e.message,
      variant: 'destructive',
    }),
  });

  const updateParticipant = useMutation({
    mutationFn: async (input: { id: string; role?: string; maxPoAmount?: number | null }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.role !== undefined) patch.role = input.role;
      if (input.maxPoAmount !== undefined) patch.max_po_amount = input.maxPoAmount;
      const { error } = await supabase.from('budget_participants').update(patch).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast({ title: 'Impossible de modifier', description: e.message, variant: 'destructive' }),
  });

  const removeParticipant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_participants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Participant retiré' }); },
    onError: (e: Error) => toast({ title: 'Impossible de retirer', description: e.message, variant: 'destructive' }),
  });

  return { participants: query.data ?? [], isLoading: query.isLoading, addParticipant, updateParticipant, removeParticipant };
}

/**
 * Autorisation d'émettre un BdC d'un montant donné sur un budget.
 *
 * Règle produit : key user/admin libres ; participant invité → son plafond ;
 * créateur du budget → la limite de son rôle d'instance ; tout autre membre
 * de l'organisation → refus.
 */
export async function checkPoAuthorization(
  budgetId: string,
  total: number,
): Promise<{ ok: true } | { ok: false; title: string; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, title: 'Non authentifié', message: 'Reconnectez-vous.' };

  const { fetchMyPermissions } = await import('@/hooks/useOrgTeam');
  const perms = await fetchMyPermissions();
  if (perms.isKeyUser) return { ok: true };

  const fmt = (n: number) => n.toLocaleString('fr-FR');

  // Participant invité sur ce budget : son plafond individuel fait foi.
  const { data: participant } = await supabase
    .from('budget_participants')
    .select('max_po_amount')
    .eq('budget_id', budgetId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (participant) {
    const max = participant.max_po_amount != null ? Number(participant.max_po_amount) : null;
    if (max != null && total > max) {
      return {
        ok: false,
        title: 'Plafond d\'engagement dépassé',
        message: `Votre participation à ce budget limite chaque BdC à ${fmt(max)} €. Total actuel : ${fmt(total)} €.`,
      };
    }
    return { ok: true };
  }

  // Créateur du budget : limite de son rôle d'instance (Équipe → Rôles).
  const { data: budget } = await supabase
    .from('budgets')
    .select('user_id')
    .eq('id', budgetId)
    .maybeSingle();
  if (budget?.user_id === user.id) {
    if (perms.maxPoAmount != null && total > perms.maxPoAmount) {
      return {
        ok: false,
        title: 'Plafond d\'engagement dépassé',
        message: `Votre rôle${perms.roleLabel ? ` (${perms.roleLabel})` : ''} limite chaque BdC à ${fmt(perms.maxPoAmount)} €. Total actuel : ${fmt(total)} €.`,
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    title: 'BdC non autorisé sur ce budget',
    message: 'Seuls le créateur du budget, ses participants invités et le key user peuvent émettre un BdC ici. Demandez au créateur du budget de vous inviter.',
  };
}
