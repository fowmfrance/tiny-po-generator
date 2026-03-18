import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSupplierAccessToken(supplierId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tokenQuery = useQuery({
    queryKey: ['supplier-access-token', supplierId],
    enabled: !!supplierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_access_tokens' as any)
        .select('*')
        .eq('supplier_id', supplierId!)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const generateToken = useMutation({
    mutationFn: async (supplierIdParam: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Deactivate existing tokens
      await supabase
        .from('supplier_access_tokens' as any)
        .update({ is_active: false } as any)
        .eq('supplier_id', supplierIdParam)
        .eq('is_active', true);

      // Create new token
      const { data, error } = await supabase
        .from('supplier_access_tokens' as any)
        .insert({
          supplier_id: supplierIdParam,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-access-token', supplierId] });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const getPortalUrl = (token: string) => {
    const base = window.location.origin;
    return `${base}/supplier/portal/${token}`;
  };

  const copyPortalLink = async () => {
    let token = tokenQuery.data;
    if (!token && supplierId) {
      token = await generateToken.mutateAsync(supplierId);
    }
    if (token) {
      const url = getPortalUrl(token.token);
      await navigator.clipboard.writeText(url);
      toast({ title: 'Lien copié', description: 'Le lien du portail fournisseur a été copié dans le presse-papiers.' });
      return url;
    }
  };

  return {
    token: tokenQuery.data,
    isLoading: tokenQuery.isLoading,
    generateToken,
    copyPortalLink,
    getPortalUrl,
  };
}
