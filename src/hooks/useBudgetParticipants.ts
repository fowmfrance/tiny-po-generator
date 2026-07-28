import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentOrganizationId } from '@/utils/organization';
import { useToast } from '@/hooks/use-toast';

/**
 * Participants d'un budget : collaborateurs de l'organisation invités par le
 * créateur du budget à émettre des BdC sur son projet, avec un plafond
 * d'engagement PAR BdC selon le rôle.
 *
 * Phase 1 : rôles et plafonds par défaut codés ici, plafond ajustable par
 * participant. Phase 2 : grille paramétrable par instance (key user).
 */
export const PARTICIPANT_ROLES: Record<string, { label: string; defaultMax: number }> = {
  chef_de_projet: { label: 'Chef de projet', defaultMax: 500 },
  responsable: { label: 'Responsable', defaultMax: 2000 },
  directeur: { label: 'Directeur', defaultMax: 10000 },
};

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
    mutationFn: async (input: { userId: string; role: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');
      const { error } = await supabase.from('budget_participants').insert({
        budget_id: budgetId!,
        user_id: input.userId,
        organization_id: organizationId,
        role: input.role,
        max_po_amount: PARTICIPANT_ROLES[input.role]?.defaultMax ?? null,
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
      if (input.role !== undefined) {
        patch.role = input.role;
        patch.max_po_amount = PARTICIPANT_ROLES[input.role]?.defaultMax ?? null;
      }
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
 * Plafond d'engagement de l'utilisateur courant sur un budget donné.
 * Renvoie null si l'utilisateur n'est pas plafonné : créateur du budget,
 * non-participant (RLS org ouverte, durcissement en phase 2) ou plafond vide.
 */
export async function getMyPoCeiling(budgetId: string): Promise<{ max: number; role: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: budget } = await supabase
    .from('budgets')
    .select('user_id')
    .eq('id', budgetId)
    .maybeSingle();
  if (budget?.user_id === user.id) return null;

  const { data: row } = await supabase
    .from('budget_participants')
    .select('role, max_po_amount')
    .eq('budget_id', budgetId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!row || row.max_po_amount == null) return null;
  return { max: Number(row.max_po_amount), role: row.role };
}
