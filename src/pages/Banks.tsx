import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Building2, Link2, Trash2, RefreshCw, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, Settings, CalendarIcon, Users, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useBudgetsData } from '@/hooks/useBudgetsData';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useClients } from '@/hooks/useClients';
import { useSupplierTypes } from '@/hooks/useSupplierTypes';
import { derivePaymentMethod, paymentMethodBadgeClass } from '@/utils/bankPaymentMethod';
import { getInitials, getMonogramColor } from '@/utils/monogram';
import CreateBudget from '@/pages/CreateBudget';
import VendorDetail from '@/pages/VendorDetail';
import ClientDetail from '@/pages/ClientDetail';
import TiersCell from '@/components/banks/TiersCell';
import ProjectCell from '@/components/banks/ProjectCell';
import { useInvoiceChain, type InvoiceChainEntry } from '@/hooks/useInvoiceChain';
import { findSupplierMatches, nameSimilarity, proposeTiersLinks, type SupplierMatch, type TiersLinkProposal } from '@/utils/fuzzyMatch';
import PostSyncMatchDialog from '@/components/banks/PostSyncMatchDialog';
import PostSyncInvoiceMatchDialog from '@/components/banks/PostSyncInvoiceMatchDialog';
import { proposeInvoiceLinks, type InvoiceLinkProposal } from '@/utils/invoiceMatch';
import { useQueryClient } from '@tanstack/react-query';
import { toProperCase } from '@/utils/properCase';

interface BankAccount {
  slug: string;
  iban: string;
  bic: string;
  name: string;
  balance: number;
  balance_cents: number;
  currency: string;
  authorized_balance: number;
  authorized_balance_cents: number;
}

interface BankConnection {
  id: string;
  bank_name: string;
  login: string;
  secret_key: string;
  organization_name: string;
  bank_accounts: BankAccount[];
  is_active: boolean;
  created_at: string;
}

interface QontoTransaction {
  id: string;
  emitted_at: string;
  settled_at: string;
  amount: number;
  currency: string;
  local_amount?: number;
  local_currency?: string;
  side: 'credit' | 'debit';
  operation_type?: string;
  label: string;
  status: string;
  note?: string;
  reference?: string;
  vat_amount?: number;
  vat_rate?: number;
  initiator_id?: string;
  card_last_digits?: string;
  category?: string;
  attachment_ids?: string[];
}

interface Transaction {
  id: string;
  qonto_transaction_id: string;
  qonto_amount: number;
  qonto_currency: string;
  qonto_side: string;
  qonto_label: string;
  qonto_settled_at: string | null;
  qonto_emitted_at: string | null;
  qonto_status: string;
  qonto_category: string | null;
  qonto_operation_type: string | null;
  qonto_reference: string | null;
  bank_connection_id: string | null;
  sapajoo_category_id: string | null;
  project_code: string | null;
  supplier_id: string | null;
  client_id: string | null;
  supplier_invoice_id: string | null;
}

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

const Banks = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [qontoLogin, setQontoLogin] = useState('');
  const [qontoSecretKey, setQontoSecretKey] = useState('');
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<BankConnection | null>(null);
  const [selectedAccountSlug, setSelectedAccountSlug] = useState<string>('');
  const [activeTab, setActiveTab] = useState('banks');
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [syncStartDate, setSyncStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const navigate = useNavigate();
  const { budgets, refetch: refetchBudgets } = useBudgetsData();
  const { suppliers, createSupplier } = useSuppliers();
  const { invoices, invoiceById, invoicesForSupplier, supplierHasPO } = useInvoiceChain();
  const queryClient = useQueryClient();
  const { clients, createClient } = useClients();
  const { supplierTypes } = useSupplierTypes();
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [createBudgetForTxId, setCreateBudgetForTxId] = useState<string | null>(null);
  const [viewSupplierId, setViewSupplierId] = useState<string | null>(null);
  const [viewClientId, setViewClientId] = useState<string | null>(null);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [createForTxId, setCreateForTxId] = useState<string | null>(null);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierTypeId, setNewSupplierTypeId] = useState<string>('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  // Création client (fiche minimale : nom seul)
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [createClientForTxId, setCreateClientForTxId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);
  // Inc B — dédup : tiers existants proches du nom saisi
  const [dedupCandidates, setDedupCandidates] = useState<SupplierMatch<typeof suppliers[number]>[]>([]);
  const [clientDedupCandidates, setClientDedupCandidates] = useState<SupplierMatch<typeof clients[number]>[]>([]);
  // Rattachement en masse des transactions au même libellé
  const [siblingTxs, setSiblingTxs] = useState<Transaction[]>([]);
  const [siblingTarget, setSiblingTarget] = useState<{ id: string; name: string; kind: 'supplier' | 'client' } | null>(null);
  // Passe fuzzy post-synchronisation : rattachements proposés à valider en masse
  const [postSyncProposals, setPostSyncProposals] = useState<TiersLinkProposal[]>([]);
  const [applyingPostSync, setApplyingPostSync] = useState(false);
  const [invoiceProposals, setInvoiceProposals] = useState<InvoiceLinkProposal[]>([]);
  const [applyingInvoiceProposals, setApplyingInvoiceProposals] = useState(false);
  const [attachingSiblings, setAttachingSiblings] = useState(false);
  // Filtres de la table des opérations
  const [filterTiers, setFilterTiers] = useState<'all' | 'with' | 'without'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'with' | 'without'>('all');
  const [filterSide, setFilterSide] = useState<'all' | 'debit' | 'credit'>('all');
  const [filterSearch, setFilterSearch] = useState('');

  const filteredTransactions = transactions.filter((tx) => {
    const hasTiers = !!(tx.supplier_id || tx.client_id);
    if (filterTiers === 'with' && !hasTiers) return false;
    if (filterTiers === 'without' && hasTiers) return false;
    const hasCat = !!tx.sapajoo_category_id;
    if (filterCategory === 'with' && !hasCat) return false;
    if (filterCategory === 'without' && hasCat) return false;
    if (filterSide !== 'all' && tx.qonto_side !== filterSide) return false;
    const q = filterSearch.trim().toLowerCase();
    if (q && !(tx.qonto_label || '').toLowerCase().includes(q) && !(tx.qonto_reference || '').toLowerCase().includes(q)) return false;
    return true;
  });
  const hasActiveFilter = filterTiers !== 'all' || filterCategory !== 'all' || filterSide !== 'all' || filterSearch.trim() !== '';

  useEffect(() => {
    loadConnections();
    loadExpenseCategories();
  }, []);

  const loadExpenseCategories = async () => {
    const { data } = await supabase
      .from('expense_categories')
      .select('id, name, color')
      .eq('is_active', true);
    if (data) setExpenseCategories(data);
  };

  const loadConnections = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsLoading(false);
      toast({
        title: "Non connecté",
        description: "Veuillez vous connecter pour voir vos banques",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error loading connections:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les connexions bancaires",
        variant: "destructive",
      });
    } else if (data && data.length > 0) {
      const typedData = data.map(conn => ({
        ...conn,
        bank_accounts: (conn.bank_accounts as unknown as BankAccount[]) || []
      }));
      setConnections(typedData);
      // Vue unifiée : on charge toutes les transactions, toutes banques confondues
      loadAllTransactions();

      if (!selectedConnection && typedData.length > 0) {
        setSelectedConnection(typedData[0]);
        if (typedData[0].bank_accounts.length > 0) {
          setSelectedAccountSlug(typedData[0].bank_accounts[0].slug);
        }
      }
    }
    setIsLoading(false);
  };

  const handleConnect = async () => {
    const login = qontoLogin.trim();
    const secretKey = qontoSecretKey.trim();

    if (!selectedBank || !login || !secretKey) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    // supabase-js renvoie l'erreur d'une edge function non-2xx sous forme de
    // FunctionsHttpError dont .context est un objet Response : il faut LIRE son
    // corps pour récupérer le vrai message (sinon on n'a que "non-2xx status code").
    const getInvokeMessage = async (err: unknown) => {
      const anyErr = err as any;
      const ctx = anyErr?.context;
      const status = ctx?.status;
      let parsed: any = null;
      if (ctx && typeof ctx.clone === 'function') {
        try {
          parsed = await ctx.clone().json();
        } catch {
          try {
            const t = await ctx.clone().text();
            parsed = t ? { error: t } : null;
          } catch {
            /* corps illisible */
          }
        }
      }
      return {
        status,
        message: parsed?.error || parsed?.message || anyErr?.message || 'Erreur inconnue',
        code: parsed?.code,
      };
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Vous devez être connecté pour ajouter une banque');
      }

      // Step 1: Validate credentials before storing (credentials sent once, not stored)
      const { data: validateData, error: validateError } = await supabase.functions.invoke('qonto-proxy', {
        body: {
          action: 'validate_credentials',
          bankData: { login, secretKey }
        },
      });

      if (validateError) {
        const info = await getInvokeMessage(validateError);
        if (info.status === 401 || info.code === 'QONTO_UNAUTHORIZED') {
          throw new Error(info.message || "Identifiants Qonto invalides (vérifiez login + clé secrète).");
        }
        throw new Error(info.message || 'Erreur de validation');
      }
      if (validateData?.error) throw new Error(validateData.error);

      const bankAccounts = validateData.organization?.bank_accounts || [];

      // Step 2: Create connection with encrypted credentials (server-side encryption)
      const { data: createData, error: createError } = await supabase.functions.invoke('qonto-proxy', {
        body: {
          action: 'create_connection',
          bankData: {
            login,
            secretKey,
            bankName: selectedBank,
            organizationName: validateData.organization?.legal_name || 'Qonto',
            bankAccounts: bankAccounts,
          }
        },
      });

      if (createError) {
        const info = await getInvokeMessage(createError);
        throw new Error(info.message || 'Erreur de création');
      }
      if (createData?.error) throw new Error(createData.error);

      const newConn = createData.connection;
      const typedConn = {
        ...newConn,
        bank_accounts: bankAccounts as BankAccount[]
      };

      setConnections([...connections, typedConn]);
      setSelectedConnection(typedConn);
      
      toast({
        title: "Connexion réussie",
        description: `Compte ${typedConn.organization_name} connecté avec ${bankAccounts.length} compte(s).`,
      });

      setSelectedBank('');
      setQontoLogin('');
      setQontoSecretKey('');
      setIsDialogOpen(false);

      if (bankAccounts.length > 0) {
        setSelectedAccountSlug(bankAccounts[0].slug);
        setActiveTab('accounts');
        await syncTransactions(typedConn, bankAccounts[0].slug);
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Vérifiez vos identifiants.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Vue unifiée : toutes les transactions de l'utilisateur, toutes banques confondues
  // (la RLS scope déjà par user_id).
  const loadAllTransactions = async (): Promise<Transaction[]> => {
    setIsLoadingTransactions(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('qonto_settled_at', { ascending: false });

    let rows: Transaction[] = [];
    if (error) {
      console.error('Error loading transactions:', error);
    } else {
      rows = (data || []) as unknown as Transaction[];
      setTransactions(rows);
    }
    setIsLoadingTransactions(false);
    return rows;
  };

  const syncTransactions = async (connection: BankConnection, accountSlug?: string, startDate?: Date) => {
    const slug = accountSlug || selectedAccountSlug;
    if (!slug) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un compte bancaire",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { getCurrentOrganizationId } = await import('@/utils/organization');
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      toast({ title: 'Erreur', description: 'Aucune organisation associée au profil.', variant: 'destructive' });
      return;
    }

    setIsSyncing(true);

    try {
      const fromDate = startDate || syncStartDate;

      // Use secure API with connectionId - credentials decrypted server-side.
      // Qonto pagine à 100/page : on boucle sur meta.next_page pour tout récupérer.
      const qontoTxns: QontoTransaction[] = [];
      let page = 1;
      const MAX_PAGES = 100; // garde-fou (10 000 transactions)
      while (page && page <= MAX_PAGES) {
        const { data, error } = await supabase.functions.invoke('qonto-proxy', {
          body: {
            action: 'qonto_api',
            connectionId: connection.id,
            endpoint: 'transactions',
            params: {
              slug: slug,
              per_page: 100,
              current_page: page,
              settled_at_from: format(fromDate, 'yyyy-MM-dd'),
            }
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        qontoTxns.push(...((data.transactions || []) as QontoTransaction[]));

        // Qonto renvoie meta.next_page (numéro) ou null quand c'est fini
        const nextPage = data?.meta?.next_page;
        page = typeof nextPage === 'number' ? nextPage : 0;
      }

      // UPSERT transactions - only update Qonto fields, preserve Sapajoo fields
      const upsertData = qontoTxns.map(tx => ({
        user_id: user.id,
        organization_id: organizationId,
        bank_connection_id: connection.id,
        qonto_transaction_id: tx.id,
        qonto_amount: tx.amount,
        qonto_currency: tx.currency,
        qonto_local_amount: tx.local_amount,
        qonto_local_currency: tx.local_currency,
        qonto_side: tx.side,
        qonto_operation_type: tx.operation_type,
        qonto_label: tx.label,
        qonto_settled_at: tx.settled_at,
        qonto_emitted_at: tx.emitted_at,
        qonto_status: tx.status,
        qonto_note: tx.note,
        qonto_reference: tx.reference,
        qonto_vat_amount: tx.vat_amount,
        qonto_vat_rate: tx.vat_rate,
        qonto_initiator_id: tx.initiator_id,
        qonto_card_last_digits: tx.card_last_digits,
        qonto_category: tx.category,
        qonto_attachment_ids: tx.attachment_ids || [],
        qonto_raw_data: JSON.parse(JSON.stringify(tx)),
      }));

      // Upsert par lots (la pagination peut ramener beaucoup de lignes)
      const BATCH = 500;
      for (let i = 0; i < upsertData.length; i += BATCH) {
        const { error: upsertError } = await supabase
          .from('transactions')
          .upsert(upsertData.slice(i, i + BATCH), { onConflict: 'user_id,qonto_transaction_id' });
        if (upsertError) {
          console.error('Upsert error:', upsertError);
          throw new Error(upsertError.message);
        }
      }

      const refreshed = await loadAllTransactions();

      toast({
        title: "Synchronisation réussie",
        description: `${qontoTxns.length} transactions synchronisées.`,
      });

      // Passe fuzzy post-sync : propose de rattacher les transactions non
      // affectées aux tiers déjà existants (par ressemblance de libellé).
      const proposals = proposeTiersLinks(refreshed, suppliers, clients);
      if (proposals.length > 0) {
        setPostSyncProposals(proposals);
      } else {
        // Pas de tiers à revoir : on enchaîne direct sur les factures au montant exact
        computeInvoiceProposals(refreshed);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Impossible de synchroniser les transactions.";
      
      // Check if connection needs to be reconfigured
      if (errorMessage.includes('reconfigurée') || errorMessage.includes('CREDENTIALS_NOT_ENCRYPTED')) {
        toast({
          title: "Connexion bancaire invalide",
          description: "Cette connexion doit être supprimée et recréée. Veuillez la déconnecter puis la reconnecter.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Navigation A→Z : opération bancaire -> paiement rapproché -> facture -> BdC
  const goToPaymentChain = async (tx: Transaction) => {
    // 1) lien direct : paiement rapproché à cette opération
    const { data: pay } = await supabase
      .from('payment_batch_invoices')
      .select('invoice_id')
      .eq('transaction_id', tx.id)
      .limit(1)
      .maybeSingle();
    let invoiceId: string | undefined = (pay as any)?.invoice_id;

    // 2) fallback : rapprochement par tiers + montant (si pas encore rattaché)
    if (!invoiceId && tx.supplier_id) {
      const amt = Math.abs(Number(tx.qonto_amount));
      const { data: inv } = await supabase
        .from('supplier_invoices')
        .select('id')
        .eq('supplier_id', tx.supplier_id)
        .gte('amount', amt - 0.5)
        .lte('amount', amt + 0.5)
        .limit(1)
        .maybeSingle();
      invoiceId = (inv as any)?.id;
    }

    if (invoiceId) {
      const { data: inv } = await supabase
        .from('supplier_invoices')
        .select('purchase_order_id, supplier_id')
        .eq('id', invoiceId)
        .maybeSingle();
      if ((inv as any)?.purchase_order_id) { navigate(`/purchase-orders/${(inv as any).purchase_order_id}`); return; }
      if ((inv as any)?.supplier_id) { navigate(`/vendors/${(inv as any).supplier_id}`); return; }
    }
    if (tx.supplier_id) { navigate(`/vendors/${tx.supplier_id}`); return; }
    toast({ title: 'Aucun paiement rattaché', description: "Cette opération n'est liée à aucune facture / bon de commande." });
  };

  const updateTransaction = async (transactionId: string, field: 'sapajoo_category_id' | 'project_code' | 'supplier_id', value: string | null) => {
    const { error } = await supabase
      .from('transactions')
      .update({ [field]: value })
      .eq('id', transactionId);

    if (error) {
      console.error('updateTransaction error:', error);
      toast({
        title: "Impossible de mettre à jour",
        description: error.message || "Erreur inconnue.",
        variant: "destructive",
      });
      return;
    }

    setTransactions(prev => prev.map(tx =>
      tx.id === transactionId ? { ...tx, [field]: value } : tx
    ));
  };

  const invalidateInvoiceQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice-chain'] });
    queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  // Au rapprochement, la facture passe payée (montant couvert) ou partielle.
  // Une facture déjà 'paid' n'est pas retouchée (paid_date posée ailleurs).
  const markInvoicePaidOnLink = async (txAmountAbs: number, txDate: string | null, invoice: InvoiceChainEntry) => {
    if (invoice.status === 'paid') return;
    const fullyPaid = txAmountAbs >= invoice.amount - 0.01;
    const patch = fullyPaid
      ? { status: 'paid', paid_date: txDate ? txDate.slice(0, 10) : null }
      : { status: 'partial' };
    const { error } = await supabase.from('supplier_invoices').update(patch).eq('id', invoice.id);
    if (error) console.error('markInvoicePaidOnLink error:', error);
  };

  // Au déliage, la facture redevient 'pending' — sauf si un paiement par lot
  // (payment_batch_invoices) la couvre encore, ou si son statut n'a rien à voir
  // avec un paiement (approved…).
  const revertInvoiceOnUnlink = async (invoiceId: string) => {
    const { count } = await supabase
      .from('payment_batch_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('invoice_id', invoiceId)
      .eq('status', 'paid');
    if (count) return;
    const { error } = await supabase
      .from('supplier_invoices')
      .update({ status: 'pending', paid_date: null })
      .eq('id', invoiceId)
      .in('status', ['paid', 'partial']);
    if (error) console.error('revertInvoiceOnUnlink error:', error);
  };

  // Rapproche l'opération d'une facture fournisseur (ou la délie). Le code
  // projet dérivé (facture → BdC → budget) est figé dans project_code pour que
  // les écrans qui lisent ce champ (reporting) restent justes.
  const linkTransactionInvoice = async (tx: Transaction, invoice: InvoiceChainEntry | null) => {
    const patch = {
      supplier_invoice_id: invoice?.id ?? null,
      project_code: invoice?.projectCode ?? null,
    };
    const { error } = await supabase.from('transactions').update(patch).eq('id', tx.id);

    if (error) {
      console.error('linkTransactionInvoice error:', error);
      toast({ title: 'Impossible de rapprocher', description: error.message || 'Erreur inconnue.', variant: 'destructive' });
      return;
    }

    if (invoice) {
      await markInvoicePaidOnLink(Math.abs(Number(tx.qonto_amount)), tx.qonto_settled_at || tx.qonto_emitted_at, invoice);
    } else if (tx.supplier_invoice_id) {
      await revertInvoiceOnUnlink(tx.supplier_invoice_id);
    }

    setTransactions(prev => prev.map(t => (t.id === tx.id ? { ...t, ...patch } : t)));
    invalidateInvoiceQueries();
  };

  // Passe de pré-rapprochement : propose les factures au montant exact pour les
  // décaissements rattachés à un fournisseur mais pas encore à une facture.
  const computeInvoiceProposals = (txList: Transaction[]) => {
    const proposals = proposeInvoiceLinks(txList, invoices);
    if (proposals.length > 0) setInvoiceProposals(proposals);
  };

  // Applique en masse les rapprochements facture validés dans la revue post-sync.
  const applyInvoiceProposals = async (accepted: InvoiceLinkProposal[]) => {
    setApplyingInvoiceProposals(true);
    let ok = 0;
    for (const p of accepted) {
      const patch = { supplier_invoice_id: p.invoice.id, project_code: p.invoice.projectCode };
      const { error } = await supabase.from('transactions').update(patch).eq('id', p.txId);
      if (error) {
        console.error('applyInvoiceProposals error:', error);
        continue;
      }
      await markInvoicePaidOnLink(Math.abs(Number(p.amount)), p.date, p.invoice);
      ok += 1;
      setTransactions(prev => prev.map(tx => (tx.id === p.txId ? { ...tx, ...patch } : tx)));
    }
    setApplyingInvoiceProposals(false);
    setInvoiceProposals([]);
    invalidateInvoiceQueries();
    toast({
      title: 'Factures rapprochées',
      description: `${ok} opération(s) rapprochée(s) de leur facture, code projet affecté.`,
    });
  };

  // Écrit le tiers (fournisseur XOR client) en une seule mise à jour : on pose
  // l'un et on efface l'autre pour éviter un double rattachement.
  const updateTransactionTiers = async (
    transactionId: string,
    patch: { supplier_id: string | null; client_id: string | null },
  ) => {
    const { error } = await supabase
      .from('transactions')
      .update(patch)
      .eq('id', transactionId);

    if (error) {
      console.error('updateTransactionTiers error:', error);
      toast({ title: 'Impossible de mettre à jour', description: error.message || 'Erreur inconnue.', variant: 'destructive' });
      return;
    }

    setTransactions(prev => prev.map(tx => (tx.id === transactionId ? { ...tx, ...patch } : tx)));
  };

  // Applique en masse les rattachements validés dans la revue post-sync.
  const applyPostSyncProposals = async (accepted: TiersLinkProposal[]) => {
    setApplyingPostSync(true);
    let ok = 0;
    for (const p of accepted) {
      const patch = p.kind === 'supplier'
        ? { supplier_id: p.entityId, client_id: null }
        : { supplier_id: null, client_id: p.entityId };
      const { error } = await supabase.from('transactions').update(patch).eq('id', p.txId);
      if (error) {
        console.error('applyPostSyncProposals error:', error);
      } else {
        ok += 1;
        setTransactions(prev => prev.map(tx => (tx.id === p.txId ? { ...tx, ...patch } : tx)));
      }
    }
    setApplyingPostSync(false);
    setPostSyncProposals([]);
    toast({
      title: 'Rattachements appliqués',
      description: `${ok} transaction(s) rattachée(s) automatiquement à leur tiers.`,
    });

    // Les tiers fraîchement rattachés ouvrent peut-être des rapprochements de
    // factures : on relance la passe sur l'état à jour.
    const acceptedById = new Map(accepted.map(p => [p.txId, p]));
    const updatedTxs = transactions.map(tx => {
      const p = acceptedById.get(tx.id);
      if (!p) return tx;
      return p.kind === 'supplier'
        ? { ...tx, supplier_id: p.entityId, client_id: null }
        : { ...tx, supplier_id: null, client_id: p.entityId };
    });
    computeInvoiceProposals(updatedTxs);
  };

  const resetCreateSupplierForm = () => {
    setIsCreateSupplierOpen(false);
    setNewSupplierName('');
    setNewSupplierEmail('');
    setNewSupplierTypeId('');
    setCreateForTxId(null);
    setDedupCandidates([]);
  };

  const resetCreateClientForm = () => {
    setIsCreateClientOpen(false);
    setNewClientName('');
    setCreateClientForTxId(null);
    setClientDedupCandidates([]);
  };

  // Ouvre le dialog de création depuis la cellule Tiers, pré-rempli du libellé.
  const openCreateSupplier = (tx: Transaction, nameOverride?: string) => {
    setCreateForTxId(tx.id);
    // nameOverride = texte de recherche saisi dans la cellule Tiers (déjà édité) ;
    // sinon défaut = libellé au format propre.
    setNewSupplierName(nameOverride ?? toProperCase(tx.qonto_label || ''));
    setNewSupplierEmail('');
    setNewSupplierTypeId('');
    setDedupCandidates([]);
    setIsCreateSupplierOpen(true);
  };
  const openCreateClient = (tx: Transaction, nameOverride?: string) => {
    setCreateClientForTxId(tx.id);
    setNewClientName(nameOverride ?? toProperCase(tx.qonto_label || ''));
    setClientDedupCandidates([]);
    setIsCreateClientOpen(true);
  };

  // Après liaison (nouveau ou existant) : proposer de rattacher les autres
  // transactions non liées, de même signe, au même libellé. On exclut la
  // transaction qui vient d'être liée (état local pas encore propagé).
  const proposeSiblings = (
    kind: 'supplier' | 'client',
    id: string,
    name: string,
    excludeTxId: string | null,
  ) => {
    const wantCredit = kind === 'client';
    const siblings = transactions.filter(
      (tx) =>
        tx.id !== excludeTxId &&
        !tx.supplier_id &&
        !tx.client_id &&
        (tx.qonto_side === 'credit') === wantCredit &&
        nameSimilarity(name, tx.qonto_label || '') >= 0.85,
    );
    if (siblings.length > 0) {
      setSiblingTxs(siblings);
      setSiblingTarget({ id, name, kind });
    }
  };

  // Lier la transaction courante à un fournisseur existant (dédup).
  const handleLinkExisting = async (supplier: { id: string; name: string }) => {
    const txId = createForTxId;
    if (txId) {
      await updateTransactionTiers(txId, { supplier_id: supplier.id, client_id: null });
    }
    resetCreateSupplierForm();
    proposeSiblings('supplier', supplier.id, supplier.name, txId);
    toast({ title: 'Transaction rattachée', description: `Rattachée au fournisseur existant « ${supplier.name} ».` });
  };

  // Lier la transaction courante à un client existant (dédup).
  const handleLinkExistingClient = async (client: { id: string; name: string }) => {
    const txId = createClientForTxId;
    if (txId) {
      await updateTransactionTiers(txId, { supplier_id: null, client_id: client.id });
    }
    resetCreateClientForm();
    proposeSiblings('client', client.id, client.name, txId);
    toast({ title: 'Transaction rattachée', description: `Rattachée au client existant « ${client.name} ».` });
  };

  const handleCreateSupplier = async (force = false) => {
    // Le défaut pré-rempli est déjà en format propre (openCreateSupplier) ; on
    // respecte ici ce que l'utilisateur a saisi/édité (correcteur neutralisé à l'édition).
    const name = newSupplierName.trim();
    if (!name) {
      toast({ title: 'Nom requis', description: 'Saisissez au moins le nom du fournisseur.', variant: 'destructive' });
      return;
    }
    // Métier obligatoire : sans lui le fournisseur retombe en « Non classé » dans
    // tous les reportings (dashboard, répartition par métier).
    if (!newSupplierTypeId) {
      toast({ title: 'Activité requise', description: 'Choisissez l\'activité / métier du fournisseur.', variant: 'destructive' });
      return;
    }
    // Garde dédup : si des fournisseurs proches existent, on les propose d'abord.
    if (!force) {
      const matches = findSupplierMatches(name, suppliers);
      if (matches.length > 0) {
        setDedupCandidates(matches);
        return;
      }
    }
    setCreatingSupplier(true);
    try {
      const created: any = await createSupplier.mutateAsync({
        name,
        email: newSupplierEmail.trim(), // pas de faux email : vide si non renseigné
        supplier_type_id: newSupplierTypeId,
      });
      const txId = createForTxId;
      if (txId && created?.id) {
        await updateTransactionTiers(txId, { supplier_id: created.id, client_id: null });
      }
      const createdName: string = created?.name ?? name;
      const createdId: string | undefined = created?.id;
      resetCreateSupplierForm();
      if (createdId) proposeSiblings('supplier', createdId, createdName, txId);
      toast({ title: 'Fournisseur créé', description: `${createdName} a été créé et rattaché.` });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de créer le fournisseur.',
        variant: 'destructive',
      });
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleCreateClient = async (force = false) => {
    // Défaut pré-rempli déjà en format propre ; on respecte l'édition utilisateur.
    const name = newClientName.trim();
    if (!name) {
      toast({ title: 'Nom requis', description: 'Saisissez au moins le nom du client.', variant: 'destructive' });
      return;
    }
    if (!force) {
      const matches = findSupplierMatches(name, clients);
      if (matches.length > 0) {
        setClientDedupCandidates(matches);
        return;
      }
    }
    setCreatingClient(true);
    try {
      const created: any = await createClient.mutateAsync({ name });
      const txId = createClientForTxId;
      if (txId && created?.id) {
        await updateTransactionTiers(txId, { supplier_id: null, client_id: created.id });
      }
      const createdName: string = created?.name ?? name;
      const createdId: string | undefined = created?.id;
      resetCreateClientForm();
      if (createdId) proposeSiblings('client', createdId, createdName, txId);
      toast({ title: 'Client créé', description: `${createdName} a été créé et rattaché.` });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de créer le client.',
        variant: 'destructive',
      });
    } finally {
      setCreatingClient(false);
    }
  };

  const handleAttachSiblings = async () => {
    if (!siblingTarget) return;
    setAttachingSiblings(true);
    const patch = siblingTarget.kind === 'supplier'
      ? { supplier_id: siblingTarget.id, client_id: null }
      : { supplier_id: null, client_id: siblingTarget.id };
    try {
      for (const tx of siblingTxs) {
        await updateTransactionTiers(tx.id, patch);
      }
      toast({
        title: 'Transactions rattachées',
        description: `${siblingTxs.length} transaction(s) rattachée(s) à « ${siblingTarget.name} ».`,
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Rattachement partiel — réessayez.',
        variant: 'destructive',
      });
    } finally {
      setAttachingSiblings(false);
      setSiblingTxs([]);
      setSiblingTarget(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    const { error } = await supabase
      .from('bank_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la connexion",
        variant: "destructive",
      });
      return;
    }

    setConnections(connections.filter(c => c.id !== connectionId));
    if (selectedConnection?.id === connectionId) {
      setSelectedConnection(null);
      setTransactions([]);
      setSelectedAccountSlug('');
    }
    toast({
      title: "Banque déconnectée",
      description: "La connexion bancaire a été supprimée.",
    });
  };

  const formatAmount = (amount: number, currency: string, side: string) => {
    const formatted = new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency 
    }).format(Math.abs(amount));
    return side === 'debit' ? `-${formatted}` : `+${formatted}`;
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency 
    }).format(balance);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  const connById = new Map(connections.map((c) => [c.id, c]));
  const showBankAvatar = connections.length > 1;
  const bankAvatar = (connectionId: string | null) => {
    const conn = connectionId ? connById.get(connectionId) : null;
    const label = conn?.organization_name || conn?.bank_name || '?';
    const mono = getMonogramColor(label);
    return (
      <span
        className="inline-flex w-6 h-6 rounded-md items-center justify-center text-[10px] font-medium shrink-0"
        style={{ backgroundColor: mono.bg, color: mono.fg }}
        title={label}
      >
        {getInitials(label)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banques</h1>
          <p className="text-muted-foreground">
            Gérez vos connexions bancaires et consultez vos opérations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une banque
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter une connexion bancaire</DialogTitle>
              <DialogDescription>
                Sélectionnez votre banque et entrez vos identifiants API
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Banque</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une banque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qonto">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Qonto
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedBank === 'qonto' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="login">Login API Qonto</Label>
                    <Input
                      id="login"
                      value={qontoLogin}
                      onChange={(e) => setQontoLogin(e.target.value)}
                      placeholder="Votre login API"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secretKey">Clé secrète API</Label>
                    <Input
                      id="secretKey"
                      type="password"
                      value={qontoSecretKey}
                      onChange={(e) => setQontoSecretKey(e.target.value)}
                      placeholder="Votre clé secrète"
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    <a 
                      href="https://help.qonto.com/fr/articles/4359692-comment-recuperer-mes-identifiants-api" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Comment récupérer mes identifiants API Qonto ?
                    </a>
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleConnect} disabled={isConnecting || !selectedBank}>
                {isConnecting ? 'Connexion...' : 'Connecter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="banks" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Banques
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2" disabled={connections.length === 0}>
            <CreditCard className="w-4 h-4" />
            Comptes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banks" className="mt-6">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune banque connectée</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Connectez votre première banque pour commencer à synchroniser vos données financières.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une banque
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <Card 
                  key={connection.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedConnection?.id === connection.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setSelectedConnection(connection);
                    if (connection.bank_accounts.length > 0) {
                      setSelectedAccountSlug(connection.bank_accounts[0].slug);
                    }
                    loadAllTransactions();
                  }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {connection.organization_name}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnect(connection.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Link2 className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Connecté</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {connection.bank_accounts.length} compte(s) bancaire(s)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Connecté le {new Date(connection.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConnection(connection);
                          if (connection.bank_accounts.length > 0) {
                            setSelectedAccountSlug(connection.bank_accounts[0].slug);
                          }
                          setActiveTab('accounts');
                        }}
                      >
                        Voir les comptes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accounts" className="mt-6 space-y-6">
          {selectedConnection && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Comptes - {selectedConnection.organization_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedConnection.bank_accounts.length === 0 ? (
                    <p className="text-muted-foreground">Aucun compte trouvé</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {selectedConnection.bank_accounts.map((account) => (
                        <Card 
                          key={account.slug}
                          className={`cursor-pointer transition-all hover:shadow-md ${selectedAccountSlug === account.slug ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => {
                            setSelectedAccountSlug(account.slug);
                            syncTransactions(selectedConnection, account.slug);
                          }}
                        >
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <p className="font-medium">{account.name || 'Compte principal'}</p>
                              <p className="text-2xl font-bold">
                                {formatBalance(account.balance, account.currency)}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {account.iban}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {connections.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Toutes les opérations</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground whitespace-nowrap">Depuis le</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "w-[160px] justify-start text-left font-normal",
                                !syncStartDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {syncStartDate ? format(syncStartDate, "dd MMM yyyy", { locale: fr }) : "Choisir..."}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={syncStartDate}
                              onSelect={(date) => date && setSyncStartDate(date)}
                              initialFocus
                              locale={fr}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => syncTransactions(selectedConnection, undefined, syncStartDate)}
                        disabled={isLoadingTransactions || isSyncing}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Chargement...</span>
                      </div>
                    ) : transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune opération trouvée depuis le {format(syncStartDate, "dd MMMM yyyy", { locale: fr })}
                      </p>
                    ) : (
                      <>
                      {/* Barre de filtres */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="relative w-[200px]">
                          <input
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            placeholder="Rechercher libellé / réf…"
                            className="w-full h-8 rounded-md border border-border bg-background pl-2.5 pr-2 text-sm"
                          />
                        </div>
                        <Select value={filterTiers} onValueChange={(v) => setFilterTiers(v as any)}>
                          <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tiers : tous</SelectItem>
                            <SelectItem value="with">Avec tiers</SelectItem>
                            <SelectItem value="without">Sans tiers</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as any)}>
                          <SelectTrigger className="w-[170px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Catégorie : toutes</SelectItem>
                            <SelectItem value="with">Avec catégorie</SelectItem>
                            <SelectItem value="without">Sans catégorie</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterSide} onValueChange={(v) => setFilterSide(v as any)}>
                          <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Sens : tous</SelectItem>
                            <SelectItem value="debit">Décaissements</SelectItem>
                            <SelectItem value="credit">Encaissements</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground ml-1">
                          {filteredTransactions.length} / {transactions.length}
                        </span>
                        {hasActiveFilter && (
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs"
                            onClick={() => { setFilterTiers('all'); setFilterCategory('all'); setFilterSide('all'); setFilterSearch(''); }}>
                            Réinitialiser
                          </Button>
                        )}
                      </div>
                      {filteredTransactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Aucune opération ne correspond aux filtres.</p>
                      ) : (
                      // [&>div]:overflow-visible neutralise le wrapper overflow-auto de shadcn Table,
                      // sinon l'en-tête sticky s'ancre à ce div interne (non scrollable) au lieu du conteneur max-h
                      <div className="max-h-[calc(100vh-20rem)] overflow-auto rounded-md border border-border [&>div]:overflow-visible">
                      <Table className="text-[13px] [&_td]:py-1.5 [&_td]:px-2.5 [&_th]:px-2.5">
                        <TableHeader className="sticky top-0 z-20 bg-secondary [&_th]:bg-secondary [&_th]:h-9 [&_th]:whitespace-nowrap">
                          <TableRow>
                            {showBankAvatar && <TableHead className="w-8"></TableHead>}
                            <TableHead>Date</TableHead>
                            <TableHead>Libellé</TableHead>
                            <TableHead>Qonto</TableHead>
                            <TableHead>Sapajoo</TableHead>
                            <TableHead>Tiers</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Projet</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                              {showBankAvatar && (
                                <TableCell className="w-8 pr-0">{bankAvatar(tx.bank_connection_id)}</TableCell>
                              )}
                              <TableCell>
                                {new Date(tx.qonto_settled_at || tx.qonto_emitted_at || '').toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {tx.qonto_side === 'credit' ? (
                                    <ArrowDownLeft className="w-4 h-4 text-green-500 shrink-0" />
                                  ) : (
                                    <ArrowUpRight className="w-4 h-4 text-red-500 shrink-0" />
                                  )}
                                  <span>{tx.qonto_label || 'Sans libellé'}</span>
                                </div>
                                {tx.qonto_reference && (
                                  <div className="text-xs text-muted-foreground mt-0.5 ml-6">
                                    Réf : {tx.qonto_reference}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {tx.qonto_category || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={tx.sapajoo_category_id || 'none'}
                                  onValueChange={(value) => updateTransaction(tx.id, 'sapajoo_category_id', value === 'none' ? null : value)}
                                >
                                  <SelectTrigger className="w-[132px] h-8">
                                    <SelectValue placeholder="Catégorie" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Aucune</SelectItem>
                                    {expenseCategories.map(cat => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        <span className="flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                          {cat.name}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <TiersCell
                                  txId={tx.id}
                                  qontoSide={tx.qonto_side}
                                  qontoLabel={tx.qonto_label}
                                  supplierId={tx.supplier_id}
                                  clientId={tx.client_id}
                                  suppliers={suppliers}
                                  clients={clients}
                                  onSave={(patch) => updateTransactionTiers(tx.id, patch)}
                                  onCreateSupplier={(name) => openCreateSupplier(tx, name)}
                                  onCreateClient={(name) => openCreateClient(tx, name)}
                                  onOpenSupplier={(id) => setViewSupplierId(id)}
                                  onOpenClient={(id) => setViewClientId(id)}
                                />
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const method = derivePaymentMethod(tx.qonto_operation_type);
                                  return (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${paymentMethodBadgeClass[method]}`}>
                                      {method}
                                    </span>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                <ProjectCell
                                  txAmount={tx.qonto_amount}
                                  supplierId={tx.supplier_id}
                                  supplierName={suppliers.find(s => s.id === tx.supplier_id)?.name}
                                  supplierInvoiceId={tx.supplier_invoice_id}
                                  projectCode={tx.project_code}
                                  budgets={budgets}
                                  supplierHasPO={supplierHasPO(tx.supplier_id)}
                                  linkedInvoice={tx.supplier_invoice_id ? invoiceById.get(tx.supplier_invoice_id) : undefined}
                                  supplierInvoices={tx.supplier_id ? invoicesForSupplier(tx.supplier_id) : []}
                                  onLinkInvoice={(invoice) => linkTransactionInvoice(tx, invoice)}
                                  onSelectCode={(code) => updateTransaction(tx.id, 'project_code', code)}
                                  onCreateBudget={() => {
                                    setCreateBudgetForTxId(tx.id);
                                    setIsCreateBudgetOpen(true);
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  tx.qonto_status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  tx.qonto_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {tx.qonto_status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <button
                                  type="button"
                                  onClick={() => goToPaymentChain(tx)}
                                  title="Voir le paiement / la facture / le bon de commande liés"
                                  className={`font-medium hover:underline underline-offset-2 ${
                                    tx.qonto_side === 'credit' ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {formatAmount(tx.qonto_amount, tx.qonto_currency, tx.qonto_side || '')}
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                      )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateSupplierOpen} onOpenChange={(o) => { if (!o) resetCreateSupplierForm(); else setIsCreateSupplierOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau fournisseur</DialogTitle>
            <DialogDescription>Créez un fournisseur et rattachez-le à la transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-supplier-name">Nom</Label>
              <Input
                id="new-supplier-name"
                value={newSupplierName}
                onChange={(e) => { setNewSupplierName(e.target.value); setDedupCandidates([]); }}
                placeholder="Nom du fournisseur"
              />
            </div>
            {dedupCandidates.length > 0 && (
              <div className="rounded-lg border border-brand/30 bg-brand-subtle/60 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-brand">
                  <Sparkles className="h-4 w-4" />
                  Fournisseur similaire déjà existant
                </div>
                <p className="text-xs text-muted-foreground">
                  Liez la transaction à un fournisseur existant plutôt que de créer un doublon.
                </p>
                <div className="space-y-1.5">
                  {dedupCandidates.map(({ supplier, score }) => (
                    <div key={supplier.id} className="flex items-center justify-between gap-2 rounded-md bg-background/70 px-2.5 py-1.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-sm font-medium">{supplier.name}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{Math.round(score * 100)}%</span>
                      </span>
                      <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => handleLinkExisting(supplier)}>
                        <Link2 className="h-3.5 w-3.5 mr-1" /> Lier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Activité / métier *</Label>
              <Select value={newSupplierTypeId} onValueChange={setNewSupplierTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une activité" />
                </SelectTrigger>
                <SelectContent>
                  {supplierTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        {t.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />}
                        {t.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {supplierTypes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucune activité définie pour cette organisation. Créez-en dans Réglages → Catalogue fournisseurs.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-supplier-email">Email (optionnel)</Label>
              <Input
                id="new-supplier-email"
                type="email"
                value={newSupplierEmail}
                onChange={(e) => setNewSupplierEmail(e.target.value)}
                placeholder="contact@fournisseur.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetCreateSupplierForm}>Annuler</Button>
            <Button onClick={() => handleCreateSupplier(dedupCandidates.length > 0)} disabled={creatingSupplier}>
              {creatingSupplier ? 'Création…' : dedupCandidates.length > 0 ? 'Créer quand même' : 'Créer et rattacher'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateClientOpen} onOpenChange={(o) => { if (!o) resetCreateClientForm(); else setIsCreateClientOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription>Créez un client et rattachez-le à la transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-client-name">Nom</Label>
              <Input
                id="new-client-name"
                value={newClientName}
                onChange={(e) => { setNewClientName(e.target.value); setClientDedupCandidates([]); }}
                placeholder="Nom du client"
              />
            </div>
            {clientDedupCandidates.length > 0 && (
              <div className="rounded-lg border border-brand/30 bg-brand-subtle/60 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-brand">
                  <Sparkles className="h-4 w-4" />
                  Client similaire déjà existant
                </div>
                <p className="text-xs text-muted-foreground">
                  Liez la transaction à un client existant plutôt que de créer un doublon.
                </p>
                <div className="space-y-1.5">
                  {clientDedupCandidates.map(({ supplier: client, score }) => (
                    <div key={client.id} className="flex items-center justify-between gap-2 rounded-md bg-background/70 px-2.5 py-1.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-sm font-medium">{client.name}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{Math.round(score * 100)}%</span>
                      </span>
                      <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => handleLinkExistingClient(client)}>
                        <Link2 className="h-3.5 w-3.5 mr-1" /> Lier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetCreateClientForm}>Annuler</Button>
            <Button onClick={() => handleCreateClient(clientDedupCandidates.length > 0)} disabled={creatingClient}>
              {creatingClient ? 'Création…' : clientDedupCandidates.length > 0 ? 'Créer quand même' : 'Créer et rattacher'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PostSyncMatchDialog
        proposals={postSyncProposals}
        isApplying={applyingPostSync}
        onConfirm={applyPostSyncProposals}
        onClose={() => {
          setPostSyncProposals([]);
          // Même si la revue tiers est ignorée, les transactions déjà rattachées
          // à un fournisseur peuvent avoir une facture au montant exact.
          computeInvoiceProposals(transactions);
        }}
      />

      <PostSyncInvoiceMatchDialog
        proposals={invoiceProposals}
        isApplying={applyingInvoiceProposals}
        onConfirm={applyInvoiceProposals}
        onClose={() => setInvoiceProposals([])}
      />

      <Dialog open={siblingTxs.length > 0} onOpenChange={(o) => { if (!o) { setSiblingTxs([]); setSiblingTarget(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand" />
              Rattacher les transactions similaires
            </DialogTitle>
            <DialogDescription>
              {siblingTxs.length} autre(s) transaction(s) non rattachée(s) portent le même libellé que
              {siblingTarget ? ` « ${siblingTarget.name} »` : ''}. Les rattacher aussi ?
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-1 py-1">
            {siblingTxs.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5 text-sm">
                <span className="truncate">{tx.qonto_label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: tx.qonto_currency || 'EUR' }).format(tx.qonto_amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setSiblingTxs([]); setSiblingTarget(null); }}>Ignorer</Button>
            <Button onClick={handleAttachSiblings} disabled={attachingSiblings}>
              {attachingSiblings ? 'Rattachement…' : `Rattacher les ${siblingTxs.length}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateBudgetOpen} onOpenChange={setIsCreateBudgetOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau code projet</DialogTitle>
            <DialogDescription>
              Créez un budget / code projet et rattachez-le directement à la transaction.
            </DialogDescription>
          </DialogHeader>
          <CreateBudget
            embedded
            onCancel={() => {
              setIsCreateBudgetOpen(false);
              setCreateBudgetForTxId(null);
            }}
            onCreated={async (budget) => {
              await refetchBudgets();
              if (createBudgetForTxId && budget?.code) {
                await updateTransaction(createBudgetForTxId, 'project_code', budget.code);
              }
              setIsCreateBudgetOpen(false);
              setCreateBudgetForTxId(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewSupplierId} onOpenChange={(o) => !o && setViewSupplierId(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          {viewSupplierId && <VendorDetail embedded supplierId={viewSupplierId} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewClientId} onOpenChange={(o) => !o && setViewClientId(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          {viewClientId && <ClientDetail embedded clientId={viewClientId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Banks;
