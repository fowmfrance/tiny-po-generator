import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Chaîne fournisseur → BdC → facture, vue depuis l'écran banque.
 *
 * Le code projet d'une facture se dérive en priorité de son BdC
 * (purchase_orders.budget_id → budgets.code), sinon de son project_code propre
 * (factures hors BdC, ex. backfill). Convention app : supplier_invoices.amount = TTC.
 */
export interface InvoiceChainEntry {
  id: string;
  supplierId: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  amount: number;
  status: string | null;
  poNumber: string | null;
  projectCode: string | null;
}

interface InvoiceChainRow {
  id: string;
  supplier_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  amount: number | null;
  status: string | null;
  project_code: string | null;
  purchase_orders: { po_number: string | null; budgets: { code: string | null } | null } | null;
}

export const useInvoiceChain = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['invoice-chain'],
    queryFn: async () => {
      const [invoicesRes, posRes] = await Promise.all([
        supabase
          .from('supplier_invoices')
          .select('id, supplier_id, invoice_number, invoice_date, amount, status, project_code, purchase_orders(po_number, budgets(code))')
          .neq('status', 'cancelled'),
        supabase.from('purchase_orders').select('supplier_id'),
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (posRes.error) throw posRes.error;

      const invoices: InvoiceChainEntry[] = ((invoicesRes.data || []) as unknown as InvoiceChainRow[]).map(row => ({
        id: row.id,
        supplierId: row.supplier_id,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        amount: Number(row.amount ?? 0),
        status: row.status,
        poNumber: row.purchase_orders?.po_number ?? null,
        projectCode: row.purchase_orders?.budgets?.code ?? row.project_code ?? null,
      }));

      const suppliersWithPO = new Set<string>();
      for (const po of posRes.data || []) {
        if (po.supplier_id) suppliersWithPO.add(po.supplier_id);
      }

      return { invoices, suppliersWithPO };
    },
    staleTime: 60_000,
  });

  const invoices = data?.invoices ?? [];
  const invoiceById = new Map(invoices.map(inv => [inv.id, inv]));

  return {
    isLoading,
    invoiceById,
    invoicesForSupplier: (supplierId: string) => invoices.filter(inv => inv.supplierId === supplierId),
    supplierHasPO: (supplierId: string | null) => !!supplierId && !!data?.suppliersWithPO.has(supplierId),
  };
};
