import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CatalogSupplier {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
  typeId: string | null;
  typeName: string; // « Non classé » si absent
  typeColor: string | null;
  typeIcon: string | null;
  ltmVolume: number; // somme des flux (|montant|) rattachés sur 12 mois glissants
  ltmCount: number;
}

const UNCLASSIFIED = 'Non classé';

/**
 * Données de l'annuaire fournisseurs : chaque fournisseur enrichi de son métier
 * (supplier_type) et de son volume de transactions LTM (12 mois glissants, tous
 * flux confondus — débits + crédits en valeur absolue).
 */
export function useSupplierCatalog() {
  const query = useQuery({
    queryKey: ['supplier-catalog'],
    queryFn: async (): Promise<CatalogSupplier[]> => {
      const since = new Date();
      since.setFullYear(since.getFullYear() - 1);

      const [suppliersRes, txRes] = await Promise.all([
        supabase
          .from('suppliers')
          .select('id, name, created_at, is_active, supplier_type_id, supplier_type:supplier_types(id, name, color, icon)')
          .order('name'),
        supabase
          .from('transactions')
          .select('supplier_id, qonto_amount, qonto_settled_at, qonto_emitted_at')
          .not('supplier_id', 'is', null),
      ]);

      if (suppliersRes.error) throw suppliersRes.error;
      if (txRes.error) throw txRes.error;

      // Agrégation LTM par fournisseur (valeur absolue = « volume »).
      const volume = new Map<string, number>();
      const count = new Map<string, number>();
      for (const tx of txRes.data || []) {
        const sid = (tx as any).supplier_id as string | null;
        if (!sid) continue;
        const dateStr = (tx as any).qonto_settled_at || (tx as any).qonto_emitted_at;
        if (dateStr && new Date(dateStr) < since) continue;
        volume.set(sid, (volume.get(sid) || 0) + Math.abs(Number((tx as any).qonto_amount) || 0));
        count.set(sid, (count.get(sid) || 0) + 1);
      }

      return (suppliersRes.data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        createdAt: s.created_at,
        isActive: s.is_active ?? true,
        typeId: s.supplier_type_id ?? null,
        typeName: s.supplier_type?.name || UNCLASSIFIED,
        typeColor: s.supplier_type?.color ?? null,
        typeIcon: s.supplier_type?.icon ?? null,
        ltmVolume: volume.get(s.id) || 0,
        ltmCount: count.get(s.id) || 0,
      }));
    },
  });

  return {
    suppliers: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
