import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentOrganizationId } from '@/utils/organization';
import { useToast } from '@/hooks/use-toast';

/**
 * Équipe d'une instance : grille de rôles, membres, invitations, permissions
 * de l'utilisateur courant.
 *
 * Règle produit : hors participation explicite à un budget, seuls le créateur
 * du budget et le key user/admin créent des budgets et émettent des BdC. La
 * grille (droit de créer des budgets, limite par BdC) se règle dans Équipe →
 * Rôles ; l'enforcement vit dans CreateBudget/CreatePO.
 */

export interface OrgRole {
  id: string;
  key: string;
  label: string;
  is_key_user: boolean;
  can_create_budgets: boolean;
  max_po_amount: number | null;
}

export interface OrgMember {
  id: string;
  fullName: string | null;
  email: string;
  orgRoleId: string | null;
  lastSeenAt: string | null;
}

export interface OrgInvitation {
  id: string;
  email: string;
  orgRoleId: string | null;
  status: string;
  createdAt: string;
}

export function useOrgRoles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['org-roles'],
    queryFn: async (): Promise<OrgRole[]> => {
      const { data, error } = await supabase
        .from('org_roles')
        .select('id, key, label, is_key_user, can_create_budgets, max_po_amount')
        .order('is_key_user', { ascending: false })
        .order('max_po_amount', { ascending: false, nullsFirst: true });
      if (error) throw error;
      return (data || []).map(r => ({ ...r, max_po_amount: r.max_po_amount != null ? Number(r.max_po_amount) : null }));
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['org-roles'] });
  const onError = (e: Error) => toast({ title: 'Impossible de modifier les rôles', description: e.message, variant: 'destructive' });

  const createRole = useMutation({
    mutationFn: async (input: { label: string }) => {
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');
      const key = input.label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'role';
      const { error } = await supabase.from('org_roles').insert({
        organization_id: organizationId,
        key,
        label: input.label,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Rôle créé' }); },
    onError,
  });

  const updateRole = useMutation({
    mutationFn: async (input: { id: string; label?: string; canCreateBudgets?: boolean; maxPoAmount?: number | null }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.label !== undefined) patch.label = input.label;
      if (input.canCreateBudgets !== undefined) patch.can_create_budgets = input.canCreateBudgets;
      if (input.maxPoAmount !== undefined) patch.max_po_amount = input.maxPoAmount;
      const { error } = await supabase.from('org_roles').update(patch).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError,
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('org_roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Rôle supprimé' }); },
    onError: (e: Error) => toast({
      title: 'Impossible de supprimer',
      description: e.message.includes('foreign key')
        ? 'Des membres ou participants portent encore ce rôle.'
        : e.message,
      variant: 'destructive',
    }),
  });

  return { roles: query.data ?? [], isLoading: query.isLoading, createRole, updateRole, deleteRole };
}

export function useOrgMembers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['org-members-full'],
    queryFn: async (): Promise<OrgMember[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, org_role_id, last_seen_at')
        .order('full_name');
      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        orgRoleId: p.org_role_id,
        lastSeenAt: p.last_seen_at,
      }));
    },
  });

  const setMemberRole = useMutation({
    mutationFn: async (input: { userId: string; orgRoleId: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ org_role_id: input.orgRoleId })
        .eq('id', input.userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-members-full'] }),
    onError: (e: Error) => toast({ title: 'Impossible de changer le rôle', description: e.message, variant: 'destructive' }),
  });

  return { members: query.data ?? [], isLoading: query.isLoading, setMemberRole };
}

export function useOrgInvitations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['org-invitations'],
    queryFn: async (): Promise<OrgInvitation[]> => {
      const { data, error } = await supabase
        .from('org_invitations')
        .select('id, email, org_role_id, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(i => ({
        id: i.id, email: i.email, orgRoleId: i.org_role_id, status: i.status, createdAt: i.created_at,
      }));
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['org-invitations'] });

  const invite = useMutation({
    mutationFn: async (input: { email: string; orgRoleId: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');
      const { error } = await supabase.from('org_invitations').insert({
        organization_id: organizationId,
        email: input.email.trim().toLowerCase(),
        org_role_id: input.orgRoleId,
        invited_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Invitation enregistrée', description: 'La personne pourra rejoindre l\'instance en s\'inscrivant avec cet email.' }); },
    onError: (e: Error) => toast({
      title: 'Impossible d\'inviter',
      description: e.message.includes('duplicate') ? 'Cet email est déjà invité.' : e.message,
      variant: 'destructive',
    }),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('org_invitations').update({ status: 'revoked' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Invitation révoquée' }); },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return { invitations: query.data ?? [], isLoading: query.isLoading, invite, revoke };
}

export interface MyPermissions {
  isKeyUser: boolean;
  canCreateBudgets: boolean;
  maxPoAmount: number | null;
  roleLabel: string | null;
}

/** Permissions effectives de l'utilisateur courant (rôle d'instance + admin Sapajoo). */
export function useMyPermissions() {
  return useQuery({
    queryKey: ['my-permissions'],
    queryFn: fetchMyPermissions,
    staleTime: 60_000,
  });
}

export async function fetchMyPermissions(): Promise<MyPermissions> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isKeyUser: false, canCreateBudgets: false, maxPoAmount: null, roleLabel: null };

  const [{ data: profile }, { data: adminRow }] = await Promise.all([
    supabase.from('profiles')
      .select('org_role_id, org_roles:org_role_id(label, is_key_user, can_create_budgets, max_po_amount)')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('user_roles').select('id').eq('user_id', user.id).eq('role', 'admin-sapajoo').maybeSingle(),
  ]);

  const role = (profile as unknown as { org_roles: { label: string; is_key_user: boolean; can_create_budgets: boolean; max_po_amount: number | null } | null } | null)?.org_roles;
  const isAdmin = !!adminRow;
  const isKeyUser = isAdmin || !!role?.is_key_user;
  return {
    isKeyUser,
    canCreateBudgets: isKeyUser || !!role?.can_create_budgets,
    maxPoAmount: isKeyUser ? null : (role?.max_po_amount != null ? Number(role.max_po_amount) : null),
    roleLabel: role?.label ?? null,
  };
}
