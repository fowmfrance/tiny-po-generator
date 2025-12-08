import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building2, Link2, Trash2, RefreshCw, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  sapajoo_category_id: string | null;
  project_code: string | null;
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
      
      if (!selectedConnection && typedData.length > 0) {
        setSelectedConnection(typedData[0]);
        if (typedData[0].bank_accounts.length > 0) {
          setSelectedAccountSlug(typedData[0].bank_accounts[0].slug);
        }
        // Load transactions from DB for the first connection
        loadTransactionsFromDB(typedData[0].id);
      }
    }
    setIsLoading(false);
  };

  const handleConnect = async () => {
    if (!selectedBank || !qontoLogin || !qontoSecretKey) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Vous devez être connecté pour ajouter une banque');
      }

      // Step 1: Validate credentials before storing (credentials sent once, not stored)
      const { data: validateData, error: validateError } = await supabase.functions.invoke('qonto-proxy', {
        body: { 
          action: 'validate_credentials',
          bankData: { login: qontoLogin, secretKey: qontoSecretKey }
        },
      });

      if (validateError) throw new Error(validateError.message || 'Erreur de validation');
      if (validateData?.error) throw new Error(validateData.error);

      const bankAccounts = validateData.organization?.bank_accounts || [];
      
      // Step 2: Create connection with encrypted credentials (server-side encryption)
      const { data: createData, error: createError } = await supabase.functions.invoke('qonto-proxy', {
        body: { 
          action: 'create_connection',
          bankData: {
            login: qontoLogin,
            secretKey: qontoSecretKey,
            bankName: selectedBank,
            organizationName: validateData.organization?.legal_name || 'Qonto',
            bankAccounts: bankAccounts,
          }
        },
      });

      if (createError) throw new Error(createError.message || 'Erreur de création');
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

  const loadTransactionsFromDB = async (connectionId: string) => {
    setIsLoadingTransactions(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('bank_connection_id', connectionId)
      .order('qonto_settled_at', { ascending: false });
    
    if (error) {
      console.error('Error loading transactions:', error);
    } else {
      setTransactions(data || []);
    }
    setIsLoadingTransactions(false);
  };

  const syncTransactions = async (connection: BankConnection, accountSlug?: string) => {
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

    setIsSyncing(true);

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Use secure API with connectionId - credentials decrypted server-side
      const { data, error } = await supabase.functions.invoke('qonto-proxy', {
        body: { 
          action: 'qonto_api',
          connectionId: connection.id,
          endpoint: 'transactions',
          params: {
            slug: slug,
            per_page: 100,
            settled_at_from: thirtyDaysAgo.toISOString().split('T')[0],
          }
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const qontoTxns: QontoTransaction[] = data.transactions || [];
      
      // UPSERT transactions - only update Qonto fields, preserve Sapajoo fields
      const upsertData = qontoTxns.map(tx => ({
        user_id: user.id,
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

      const { error: upsertError } = await supabase.from('transactions').upsert(upsertData, {
        onConflict: 'user_id,qonto_transaction_id',
      });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
      }

      await loadTransactionsFromDB(connection.id);
      
      toast({
        title: "Synchronisation réussie",
        description: `${qontoTxns.length} transactions synchronisées.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de synchroniser les transactions.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const updateTransaction = async (transactionId: string, field: 'sapajoo_category_id' | 'project_code', value: string | null) => {
    const { error } = await supabase
      .from('transactions')
      .update({ [field]: value })
      .eq('id', transactionId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la transaction",
        variant: "destructive",
      });
      return;
    }

    setTransactions(prev => prev.map(tx => 
      tx.id === transactionId ? { ...tx, [field]: value } : tx
    ));
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banques</h1>
          <p className="text-muted-foreground">
            Gérez vos connexions bancaires et consultez vos opérations
          </p>
        </div>
        
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
                    loadTransactionsFromDB(connection.id);
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

              {selectedAccountSlug && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Opérations</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => syncTransactions(selectedConnection)}
                      disabled={isLoadingTransactions || isSyncing}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Chargement...</span>
                      </div>
                    ) : transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune opération trouvée sur les 30 derniers jours
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Libellé</TableHead>
                            <TableHead>Catégorie Sapajoo</TableHead>
                            <TableHead>Code projet</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>
                                {new Date(tx.qonto_settled_at || tx.qonto_emitted_at || '').toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell className="flex items-center gap-2">
                                {tx.qonto_side === 'credit' ? (
                                  <ArrowDownLeft className="w-4 h-4 text-green-500" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                                )}
                                {tx.qonto_label || 'Sans libellé'}
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
                                <Input
                                  className="w-[120px]"
                                  placeholder="Code projet"
                                  value={tx.project_code || ''}
                                  onChange={(e) => updateTransaction(tx.id, 'project_code', e.target.value || null)}
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
                              <TableCell className={`text-right font-medium ${
                                tx.qonto_side === 'credit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatAmount(tx.qonto_amount, tx.qonto_currency, tx.qonto_side || '')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Banks;
