import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building2, Link2, Trash2, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BankConnection {
  id: string;
  bankName: string;
  login: string;
  secretKey: string;
  organizationName: string;
  bankAccountSlug: string;
  isActive: boolean;
  createdAt: Date;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<BankConnection | null>(null);

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
      const { data, error } = await supabase.functions.invoke('qonto-proxy', {
        body: { endpoint: 'organization' },
        headers: {
          'x-qonto-login': qontoLogin,
          'x-qonto-secret': qontoSecretKey,
        },
      });

      if (error) throw new Error(error.message || 'Erreur de connexion');
      if (data?.error) throw new Error(data.error);

      const bankAccountSlug = data.organization?.bank_accounts?.[0]?.slug || '';
      
      const newConnection: BankConnection = {
        id: crypto.randomUUID(),
        bankName: selectedBank,
        login: qontoLogin,
        secretKey: qontoSecretKey,
        organizationName: data.organization?.legal_name || 'Qonto',
        bankAccountSlug,
        isActive: true,
        createdAt: new Date(),
      };

      setConnections([...connections, newConnection]);
      setSelectedConnection(newConnection);
      
      toast({
        title: "Connexion réussie",
        description: `Compte ${newConnection.organizationName} connecté.`,
      });

      setSelectedBank('');
      setQontoLogin('');
      setQontoSecretKey('');
      setIsDialogOpen(false);

      // Fetch transactions immediately
      await fetchTransactions(newConnection);
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Vérifiez vos identifiants.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchTransactions = async (connection: BankConnection) => {
    if (!connection.bankAccountSlug) {
      toast({
        title: "Erreur",
        description: "Aucun compte bancaire trouvé",
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
            slug: connection.bankAccountSlug,
            per_page: 100,
            settled_at_from: thirtyDaysAgo.toISOString().split('T')[0],
          }
        },
        headers: {
          'x-qonto-login': connection.login,
          'x-qonto-secret': connection.secretKey,
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

  const handleDisconnect = (connectionId: string) => {
    setConnections(connections.filter(c => c.id !== connectionId));
    if (selectedConnection?.id === connectionId) {
      setSelectedConnection(null);
      setTransactions([]);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banques</h1>
          <p className="text-muted-foreground">
            Connectez vos comptes bancaires pour synchroniser vos données
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
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <Card 
                key={connection.id} 
                className={`cursor-pointer transition-all ${selectedConnection?.id === connection.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => {
                  setSelectedConnection(connection);
                  if (transactions.length === 0) fetchTransactions(connection);
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {connection.organizationName}
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Link2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Connecté</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Connecté le {connection.createdAt.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedConnection && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transactions - {selectedConnection.organizationName}</CardTitle>
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
                    Aucune transaction trouvée sur les 30 derniers jours
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
    </div>
  );
};

export default Banks;
