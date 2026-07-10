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
import { derivePaymentMethod, paymentMethodBadgeClass } from '@/utils/bankPaymentMethod';
import { getInitials, getMonogramColor } from '@/utils/monogram';
import CreateBudget from '@/pages/CreateBudget';
import VendorDetail from '@/pages/VendorDetail';
import { findSupplierMatches, findSiblingTransactions, type SupplierMatch } from '@/utils/fuzzyMatch';

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
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [createBudgetForTxId, setCreateBudgetForTxId] = useState<string | null>(null);
  const [viewSupplierId, setViewSupplierId] = useState<string | null>(null);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [createForTxId, setCreateForTxId] = useState<string | null>(null);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  // Inc B — dédup : fournisseurs existants proches du nom saisi
  const [dedupCandidates, setDedupCandidates] = useState<SupplierMatch<typeof suppliers[number]>[]>([]);
  // Rattachement en masse des transactions au même libellé
  const [siblingTxs, setSiblingTxs] = useState<Transaction[]>([]);
  const [siblingTarget, setSiblingTarget] = useState<{ id: string; name: string } | null>(null);
  const [attachingSiblings, setAttachingSiblings] = useState(false);

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
  const loadAllTransactions = async () => {
    setIsLoadingTransactions(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('qonto_settled_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
    } else {
      setTransactions((data || []) as Transaction[]);
    }
    setIsLoadingTransactions(false);
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

      await loadAllTransactions();
      
      toast({
        title: "Synchronisation réussie",
        description: `${qontoTxns.length} transactions synchronisées.`,
      });
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

  const resetCreateSupplierForm = () => {
    setIsCreateSupplierOpen(false);
    setNewSupplierName('');
    setNewSupplierEmail('');
    setCreateForTxId(null);
    setDedupCandidates([]);
  };

  // Après liaison (nouveau ou existant) : proposer de rattacher les autres
  // transactions non liées au même libellé. On exclut la transaction qui vient
  // d'être liée (dont l'état local n'est pas encore propagé dans `transactions`).
  const proposeSiblings = (supplierId: string, supplierName: string, excludeTxId: string | null) => {
    const siblings = findSiblingTransactions(supplierName, transactions).filter(
      (tx) => tx.id !== excludeTxId && !tx.supplier_id,
    );
    if (siblings.length > 0) {
      setSiblingTxs(siblings);
      setSiblingTarget({ id: supplierId, name: supplierName });
    }
  };

  // Lier la transaction courante à un fournisseur existant (dédup).
  const handleLinkExisting = async (supplier: { id: string; name: string }) => {
    const txId = createForTxId;
    if (txId) {
      await updateTransaction(txId, 'supplier_id', supplier.id);
    }
    resetCreateSupplierForm();
    proposeSiblings(supplier.id, supplier.name, txId);
    toast({ title: 'Transaction rattachée', description: `Rattachée au fournisseur existant « ${supplier.name} ».` });
  };

  const handleCreateSupplier = async (force = false) => {
    const name = newSupplierName.trim();
    if (!name) {
      toast({ title: 'Nom requis', description: 'Saisissez au moins le nom du fournisseur.', variant: 'destructive' });
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
        email: newSupplierEmail.trim() || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@a-renseigner.local`,
      });
      const txId = createForTxId;
      if (txId && created?.id) {
        await updateTransaction(txId, 'supplier_id', created.id);
      }
      const createdName: string = created?.name ?? name;
      const createdId: string | undefined = created?.id;
      resetCreateSupplierForm();
      if (createdId) proposeSiblings(createdId, createdName, txId);
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

  const handleAttachSiblings = async () => {
    if (!siblingTarget) return;
    setAttachingSiblings(true);
    try {
      for (const tx of siblingTxs) {
        await updateTransaction(tx.id, 'supplier_id', siblingTarget.id);
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
                      <div className="max-h-[calc(100vh-22rem)] overflow-auto rounded-md border border-border">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-secondary [&_th]:bg-secondary">
                          <TableRow>
                            {showBankAvatar && <TableHead className="w-8"></TableHead>}
                            <TableHead>Date</TableHead>
                            <TableHead>Libellé</TableHead>
                            <TableHead>Catégorie Qonto</TableHead>
                            <TableHead>Catégorie Sapajoo</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Code projet</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx) => (
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
                                  <SelectTrigger className="w-[180px]">
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
                                <div className="flex items-center gap-1.5">
                                <Select
                                  value={tx.supplier_id || 'none'}
                                  onValueChange={(value) => {
                                    if (value === '__new__') {
                                      setCreateForTxId(tx.id);
                                      setNewSupplierName(tx.qonto_label || '');
                                      setNewSupplierEmail('');
                                      setDedupCandidates([]);
                                      setIsCreateSupplierOpen(true);
                                      return;
                                    }
                                    updateTransaction(tx.id, 'supplier_id', value === 'none' ? null : value);
                                  }}
                                >
                                  <SelectTrigger className={`w-[180px] ${tx.supplier_id ? 'border-brand text-brand font-medium' : ''}`}>
                                    <SelectValue placeholder="Fournisseur" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Non rattaché</SelectItem>
                                    <SelectItem value="__new__" className="text-brand font-medium">
                                      + Nouveau fournisseur
                                    </SelectItem>
                                    {suppliers.map(s => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {tx.supplier_id && (
                                  <button
                                    type="button"
                                    onClick={() => setViewSupplierId(tx.supplier_id)}
                                    title="Ouvrir la fiche fournisseur"
                                    className="text-brand hover:text-brand/70 shrink-0"
                                  >
                                    <Link2 className="h-4 w-4" />
                                  </button>
                                )}
                                </div>
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
                                <Select
                                  value={tx.project_code || 'none'}
                                  onValueChange={(value) => {
                                    if (value === '__new_budget__') {
                                      setCreateBudgetForTxId(tx.id);
                                      setIsCreateBudgetOpen(true);
                                      return;
                                    }
                                    updateTransaction(tx.id, 'project_code', value === 'none' ? null : value);
                                  }}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Projet" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    <SelectItem value="__new_budget__" className="text-brand font-medium">
                                      + Nouveau code projet
                                    </SelectItem>
                                    {budgets.map(budget => (
                                      <SelectItem key={budget.id} value={budget.code}>
                                        {budget.code}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                              <TableCell className={`text-right font-medium ${
                                tx.qonto_side === 'credit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatAmount(tx.qonto_amount, tx.qonto_currency, tx.qonto_side || '')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
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
    </div>
  );
};

export default Banks;
