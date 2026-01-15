
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { FileUp, Plus, Check, AlertCircle, Crown } from 'lucide-react';
import { mockPurchaseOrders } from '@/pages/PurchaseOrders';

const mockInvoices = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2023-001',
    poId: '1',
    poNumber: '2023-001',
    amount: 3000,
    currency: 'EUR',
    date: '2023-07-01',
    status: 'paid',
    paymentDate: '2023-07-15'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2023-002',
    poId: '2',
    poNumber: '2023-002',
    amount: 1500,
    currency: 'EUR',
    date: '2023-07-10',
    status: 'pending',
    paymentDate: null
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2023-003',
    poId: '5',
    poNumber: '2023-005',
    amount: 8500,
    currency: 'EUR',
    date: '2023-07-20',
    status: 'paid',
    paymentDate: '2023-08-05'
  }
];

interface SupplierInvoicesProps {
  vendorId: string;
}

const SupplierInvoices: React.FC<SupplierInvoicesProps> = ({ vendorId }) => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState(mockInvoices);
  
  const vendorPOs = mockPurchaseOrders.filter(po => 
    po.vendorId === vendorId && 
    po.status === 'approved' &&
    !invoices.some(inv => inv.poId === po.id)
  );

  const handleCreateInvoice = (poId: string, invoiceNumber: string, amount: number) => {
    const po = mockPurchaseOrders.find(p => p.id === poId);
    if (!po) return;
    
    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      poId,
      poNumber: po.poNumber,
      amount,
      currency: po.currency,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      paymentDate: null
    };
    
    setInvoices([...invoices, newInvoice]);
    
    toast({
      title: "Facture créée",
      description: `La facture ${invoiceNumber} a été soumise avec succès.`,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Invoices</CardTitle>
        <CreateInvoiceDrawer 
          availablePOs={vendorPOs} 
          onCreateInvoice={handleCreateInvoice} 
        />
      </CardHeader>
      <CardContent>
        {invoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Réf. BC</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead>Date paiement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.poNumber}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell className="text-right">
                    {invoice.currency} {invoice.amount.toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-center">
                    {invoice.status === 'paid' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        Payée
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        En attente
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{invoice.paymentDate || 'En attente'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-6">
            <p className="text-gray-500 mb-4">Aucune facture trouvée.</p>
            <CreateInvoiceDrawer 
              availablePOs={vendorPOs} 
              onCreateInvoice={handleCreateInvoice} 
              showEmptyState={true} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CreateInvoiceDrawerProps {
  availablePOs: typeof mockPurchaseOrders;
  onCreateInvoice: (poId: string, invoiceNumber: string, amount: number) => void;
  showEmptyState?: boolean;
}

const CreateInvoiceDrawer: React.FC<CreateInvoiceDrawerProps> = ({ 
  availablePOs, 
  onCreateInvoice,
  showEmptyState = false 
}) => {
  const [selectedPO, setSelectedPO] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPO || !invoiceNumber || !amount || !file) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs et télécharger un fichier de facture.",
      });
      return;
    }
    
    onCreateInvoice(selectedPO, invoiceNumber, parseFloat(amount));
    
    setSelectedPO('');
    setInvoiceNumber('');
    setAmount('');
    setFile(null);
  };

  if (availablePOs.length === 0 && !showEmptyState) {
    return null;
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {showEmptyState ? (
          <Button className="bg-po-blue hover:bg-blue-600">
            Télécharger votre première facture
          </Button>
        ) : (
          <Button className="bg-po-blue hover:bg-blue-600 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Télécharger une facture
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Télécharger une facture</DrawerTitle>
            <DrawerDescription>
              Téléchargez une facture pour un bon de commande approuvé
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            {availablePOs.length > 0 ? (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start">
                  <Crown className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Fonctionnalité Premium disponible</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Passez à la version premium pour accéder à notre éditeur de factures avec pré-remplissage automatique des données BC et génération de données structurées.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="po-select">Bon de commande</Label>
                    <select 
                      id="po-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedPO}
                      onChange={(e) => setSelectedPO(e.target.value)}
                      required
                    >
                      <option value="">Sélectionnez un bon de commande</option>
                      {availablePOs.map(po => (
                        <option key={po.id} value={po.id}>
                          {po.poNumber} - {po.currency} {po.amount.toLocaleString('fr-FR')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoice-number">Numéro de facture</Label>
                    <Input 
                      id="invoice-number"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="ex: FAC-2023-001"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant</Label>
                    <Input 
                      id="amount"
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoice-file">Télécharger le PDF de la facture</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                      <FileUp className="h-8 w-8 text-gray-400 mb-2" />
                      {file ? (
                        <p className="text-sm">{file.name}</p>
                      ) : (
                        <p className="text-sm text-gray-500">Glissez-déposez ou cliquez pour télécharger</p>
                      )}
                      <input
                        id="invoice-file"
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFile(e.target.files[0]);
                          }
                        }}
                        required
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => document.getElementById('invoice-file')?.click()}
                      >
                        Sélectionner un fichier
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-po-blue hover:bg-blue-600"
                  >
                    Soumettre la facture
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center p-6">
                <p className="text-gray-500">Aucun bon de commande approuvé disponible.</p>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SupplierInvoices;
