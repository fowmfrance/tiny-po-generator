import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrentOrganizationId } from '@/utils/organization';

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_id: string | null;
  vat_number: string | null;
  siren: string | null;
  specialty: string | null;
  supplier_type_id: string | null;
  has_negotiated_rates: boolean;
  business_volume: number;
  is_active: boolean;
  kyc_level_id: string | null;
  kyc_status: string;
  is_po_exempt: boolean;
  default_payment_method_id: string | null;
  default_payment_modality_id: string | null;
  default_service_type_id?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  supplier_type?: { id: string; name: string; color: string | null; icon: string | null } | null;
  payment_method?: { id: string; name: string; code: string } | null;
  payment_modality?: { id: string; name: string; code: string } | null;
  service_type?: { id: string; name: string; expense_family?: { id: string; name: string } | null } | null;
  // Computed
  average_rating?: number;
  total_ratings?: number;
  po_count?: number;
  ytd_amount?: number;
  prev_year_amount?: number;
  expense_family_name?: string | null; // famille par défaut (via type de prestation)
  is_mixed?: boolean; // BdC répartis sur plusieurs familles de dépenses
}

export function useSuppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get suppliers with type
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select(`
          *,
          supplier_type:supplier_types(id, name, color, icon),
          payment_method:payment_methods(id, name, code),
          payment_modality:payment_modalities(id, name, code)
        `)
        .order('name');

      if (error) throw error;

      // Get ratings aggregated
      const { data: ratings } = await supabase
        .from('supplier_ratings')
        .select('supplier_id, rating');

      // Get PO counts and amounts
      const { data: pos } = await supabase
        .from('purchase_orders')
        .select('supplier_id, total_amount, created_at');

      // Types de prestation + familles — best-effort tant que la migration
      // service_types/expense_families n'est pas passée (SQL manuel Lovable Cloud)
      const db = supabase as any;
      const { data: serviceTypes } = await db
        .from('service_types')
        .select('id, name, expense_family:expense_families(id, name)');
      const serviceTypeMap = new Map<string, { id: string; name: string; expense_family?: { id: string; name: string } | null }>(
        (serviceTypes || []).map((st: any) => [st.id, st])
      );

      // Familles réellement utilisées sur les BdC (pour dériver « mixte »)
      const { data: poFamilies } = await db
        .from('purchase_orders')
        .select('supplier_id, expense_family_id')
        .not('expense_family_id', 'is', null);
      const poFamilyMap = new Map<string, Set<string>>();
      (poFamilies || []).forEach((p: any) => {
        const set = poFamilyMap.get(p.supplier_id) || new Set<string>();
        set.add(p.expense_family_id);
        poFamilyMap.set(p.supplier_id, set);
      });

      const ratingMap = new Map<string, { sum: number; count: number }>();
      (ratings || []).forEach((r: any) => {
        const existing = ratingMap.get(r.supplier_id) || { sum: 0, count: 0 };
        existing.sum += r.rating;
        existing.count += 1;
        ratingMap.set(r.supplier_id, existing);
      });

      const poCountMap = new Map<string, number>();
      const currentYear = new Date().getFullYear();
      const prevYear = currentYear - 1;
      const ytdMap = new Map<string, number>();
      const prevYearMap = new Map<string, number>();

      (pos || []).forEach((p: any) => {
        poCountMap.set(p.supplier_id, (poCountMap.get(p.supplier_id) || 0) + 1);
        const poYear = new Date(p.created_at).getFullYear();
        const amount = Number(p.total_amount) || 0;
        if (poYear === currentYear) {
          ytdMap.set(p.supplier_id, (ytdMap.get(p.supplier_id) || 0) + amount);
        } else if (poYear === prevYear) {
          prevYearMap.set(p.supplier_id, (prevYearMap.get(p.supplier_id) || 0) + amount);
        }
      });

      return (suppliers || []).map((s: any) => {
        const serviceType = s.default_service_type_id ? serviceTypeMap.get(s.default_service_type_id) || null : null;
        const defaultFamilyId = serviceType?.expense_family?.id || null;
        const usedFamilies = poFamilyMap.get(s.id) || new Set<string>();
        // Mixte = BdC sur plusieurs familles, ou sur une famille ≠ famille par défaut
        const isMixed = usedFamilies.size > 1
          || (usedFamilies.size === 1 && !!defaultFamilyId && !usedFamilies.has(defaultFamilyId));
        return {
        ...s,
        service_type: serviceType,
        expense_family_name: serviceType?.expense_family?.name || null,
        is_mixed: isMixed,
        has_negotiated_rates: s.has_negotiated_rates || false,
        business_volume: Number(s.business_volume) || 0,
        average_rating: ratingMap.has(s.id) 
          ? ratingMap.get(s.id)!.sum / ratingMap.get(s.id)!.count 
          : 0,
        total_ratings: ratingMap.get(s.id)?.count || 0,
        po_count: poCountMap.get(s.id) || 0,
        ytd_amount: ytdMap.get(s.id) || 0,
        prev_year_amount: prevYearMap.get(s.id) || 0,
        };
      });
    },
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: {
      name: string;
      email?: string | null;
      phone?: string;
      address?: string;
      city?: string;
      country?: string;
      specialty?: string;
      supplier_type_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const organizationId = await getCurrentOrganizationId();
      if (!organizationId) throw new Error('Aucune organisation associée au profil.');

      const { data, error } = await supabase
        .from('suppliers')
        // email : colonne NOT NULL en base, '' = « pas d'email » (convention backfill)
        .insert({ ...supplier, email: supplier.email?.trim() || '', user_id: user.id, organization_id: organizationId })
        .select()
        .single();

      if (error) throw error;

      // Send welcome email (best-effort) — seulement si un vrai email est renseigné
      if (data.email && data.email.trim()) {
        try {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'supplier-welcome',
              recipientEmail: data.email,
              idempotencyKey: `supplier-welcome-${data.id}`,
              templateData: { supplierName: data.name },
            },
          });
        } catch {
          // Non-blocking
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Fournisseur créé', description: 'Le fournisseur a été ajouté avec succès.' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Fournisseur mis à jour', description: 'Les modifications ont été enregistrées.' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async ({ id, contactActions }: { 
      id: string; 
      contactActions: Array<{ contactId: string; action: 'delete' | 'move'; targetSupplierId?: string }>;
    }) => {
      // 1. Preserve supplier name in POs and invoices
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', id)
        .single();

      if (supplierData) {
        await supabase
          .from('purchase_orders')
          .update({ supplier_name: supplierData.name } as any)
          .eq('supplier_id', id);
        await supabase
          .from('supplier_invoices')
          .update({ supplier_name: supplierData.name } as any)
          .eq('supplier_id', id);
      }

      // 2. Handle contacts
      for (const ca of contactActions) {
        if (ca.action === 'move' && ca.targetSupplierId) {
          await supabase
            .from('supplier_contacts')
            .update({ supplier_id: ca.targetSupplierId } as any)
            .eq('id', ca.contactId);
        } else {
          await supabase
            .from('supplier_contacts')
            .delete()
            .eq('id', ca.contactId);
        }
      }

      // 3. Delete the supplier (cascades tokens, bank accounts, agreements, ratings, KYC docs)
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Fournisseur supprimé', description: 'Le fournisseur a été supprimé définitivement.' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    suppliers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
