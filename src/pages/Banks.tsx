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

interface Transaction {
  id: string;
  emitted_at: string;
  settled_at: string;
  amount: number;
  currency: string;
  side: 'credit' | 'debit';
  label: string;
  status: string;
  note: string;
  category: string;
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
  const [selectedConnection, setSelectedConnection] = useState<BankConnection | null>(null);
  const [selectedAccountSlug, setSelectedAccountSlug] = useState<string>('');
  const [activeTab, setActiveTab] = useState('banks');

  useEffect(() => {
    loadConnections();
  }, []);

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

      const { data, error } = await supabase.functions.invoke('qonto-proxy', {
        body: { endpoint: 'organization' },
        headers: {
          'x-qonto-login': qontoLogin,
          'x-qonto-secret': qontoSecretKey,
        },
      });

      if (error) throw new Error(error.message || 'Erreur de connexion');
      if (data?.error) throw new Error(data.error);

      const bankAccounts = data.organization?.bank_accounts || [];
      
      const { data: newConn, error: insertError } = await supabase
        .from('bank_connections')
        .insert({
          user_id: user.id,
          bank_name: selectedBank,
          login: qontoLogin,
          secret_key: qontoSecretKey,
          organization_name: data.organization?.legal_name || 'Qonto',
          bank_accounts: bankAccounts,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(insertError.message);
      }

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
        await fetchTransactions(typedConn, bankAccounts[0].slug);
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

  const fetchTransactions = async (connection: BankConnection, accountSlug?: string) => {
    const slug = accountSlug || selectedAccountSlug;
    if (!slug) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un compte bancaire",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingTransactions(true);
    setTransactions([]);

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase.functions.invoke('qonto-proxy', {
        body: { 
          endpoint: `transactions`,
          params: {
            slug: slug,
            per_page: 100,
            settled_at_from: thirtyDaysAgo.toISOString().split('T')[0],
          }
        },
        headers: {
          'x-qonto-login': connection.login,
          'x-qonto-secret': connection.secret_key,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const txns = data.transactions || [];
      setTransactions(txns);
      
      toast({
        title: "Transactions chargées",
        description: `${txns.length} transactions récupérées.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de charger les transactions.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactions(false);
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
                            fetchTransactions(selectedConnection, account.slug);
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
                      onClick={() => fetchTransactions(selectedConnection)}
                      disabled={isLoadingTransactions}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                      Actualiser
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
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>
                                {new Date(tx.settled_at || tx.emitted_at).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell className="flex items-center gap-2">
                                {tx.side === 'credit' ? (
                                  <ArrowDownLeft className="w-4 h-4 text-green-500" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                                )}
                                {tx.label || 'Sans libellé'}
                              </TableCell>
                              <TableCell>{tx.category || '-'}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  tx.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {tx.status}
                                </span>
                              </TableCell>
                              <TableCell className={`text-right font-medium ${
                                tx.side === 'credit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatAmount(tx.amount, tx.currency, tx.side)}
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
