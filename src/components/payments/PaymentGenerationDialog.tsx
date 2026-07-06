import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Download, FileText } from 'lucide-react';
import { generateSepaXml, downloadSepaXml } from '@/utils/sepaGenerator';
import { groupInvoicesBySupplierAndCurrency, formatCurrency, generateBatchReference } from '@/utils/paymentUtils';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { useToast } from '@/hooks/use-toast';
import { getCurrentOrganizationId } from '@/utils/organization';
import type { InvoiceWithPaymentStatus } from '@/types/payment';

interface PaymentGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvoices: InvoiceWithPaymentStatus[];
  onPaymentGenerated: () => void;
}

export function PaymentGenerationDialog({
  open,
  onOpenChange,
  selectedInvoices,
  onPaymentGenerated,
}: PaymentGenerationDialogProps) {
  const { toast } = useToast();
  const { markAsPaid } = useSupplierInvoices();
  const [isGenerating, setIsGenerating] = useState(false);
  const [debtorInfo, setDebtorInfo] = useState({
    name: '',
    iban: '',
    bic: '',
  });

  // Get bank connections for debtor info
  const { data: bankConnections } = useQuery({
    queryKey: ['bank-connections-for-payment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      if (error) throw error;
      return data;
    },
  });

  // Get supplier bank accounts
  const supplierIds = [...new Set(selectedInvoices.map(inv => inv.supplier_id))];
  
  const { data: supplierBankAccounts } = useQuery({
    queryKey: ['supplier-bank-accounts', supplierIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_bank_accounts')
        .select('*')
        .in('supplier_id', supplierIds)
        .eq('is_primary', true)
        .eq('is_archived', false);
      if (error) throw error;
      return data;
    },
    enabled: supplierIds.length > 0,
  });

  const groups = groupInvoicesBySupplierAndCurrency(selectedInvoices);
  
  // Check for missing bank accounts
  const suppliersWithoutBank = groups.filter(
    group => !supplierBankAccounts?.some(ba => ba.supplier_id === group.supplier_id)
  );

  const handleGenerate = async () => {
    if (!debtorInfo.name || !debtorInfo.iban || !debtorInfo.bic) {
      toast({
        title: 'Informations manquantes',
        description: 'Veuillez renseigner les informations du compte débiteur.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Build creditor bank info map
      // Note: In production, you'd decrypt the IBAN/BIC here
      const creditorBankInfo = new Map<string, { iban: string; bic: string }>();
      
      for (const ba of supplierBankAccounts || []) {
        // For now, using encrypted values - in production, decrypt them
        creditorBankInfo.set(ba.supplier_id, {
          iban: ba.encrypted_iban, // Should be decrypted
          bic: ba.encrypted_bic,   // Should be decrypted
        });
      }

      // Filter groups with bank info
      const validGroups = groups.filter(g => creditorBankInfo.has(g.supplier_id));
      
      if (validGroups.length === 0) {
        throw new Error('Aucun fournisseur avec coordonnées bancaires valides');
      }

      // Generate SEPA XML
      const sepaXml = generateSepaXml(validGroups, debtorInfo, creditorBankInfo);
      
      // Generate filename
      const batchRef = generateBatchReference();
      const filename = `${batchRef}.xml`;
      
      // Download the file
      downloadSepaXml(sepaXml, filename);

      // Mark invoices as paid
      const invoiceIds = validGroups.flatMap(g => g.invoices.map(i => i.id));
      await markAsPaid.mutateAsync(invoiceIds);

      // Save batch to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('payment_batches').insert({
          user_id: user.id,
          batch_reference: batchRef,
          currency: 'MULTI', // Multiple currencies possible
          total_amount: validGroups.reduce((sum, g) => sum + g.total_amount, 0),
          invoice_count: invoiceIds.length,
          status: 'generated',
          sepa_xml: sepaXml,
          generated_at: new Date().toISOString(),
        });
      }

      toast({
        title: 'Fichier SEPA généré',
        description: `Le fichier ${filename} a été téléchargé. ${invoiceIds.length} factures marquées comme payées.`,
      });

      onPaymentGenerated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de générer le fichier SEPA.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Pre-fill debtor info from bank connection
  React.useEffect(() => {
    if (bankConnections?.[0]?.bank_accounts) {
      const accounts = bankConnections[0].bank_accounts as any[];
      if (accounts[0]) {
        setDebtorInfo({
          name: bankConnections[0].organization_name || '',
          iban: accounts[0].iban || '',
          bic: accounts[0].bic || '',
        });
      }
    }
  }, [bankConnections]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générer le fichier SEPA
          </DialogTitle>
          <DialogDescription>
            Créez un fichier pain.001 pour vos virements bancaires
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {suppliersWithoutBank.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {suppliersWithoutBank.length} fournisseur(s) sans coordonnées bancaires :
                {' '}{suppliersWithoutBank.map(g => g.supplier_name).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Récapitulatif :</p>
            <ul className="text-sm space-y-1">
              <li>{selectedInvoices.length} factures</li>
              <li>{groups.length} virements à générer</li>
              {[...new Set(selectedInvoices.map(i => i.currency))].map(currency => {
                const total = selectedInvoices
                  .filter(i => i.currency === currency)
                  .reduce((sum, i) => sum + Number(i.amount), 0);
                return (
                  <li key={currency} className="font-medium">
                    Total {currency}: {formatCurrency(total, currency)}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Compte débiteur</p>
            
            <div className="space-y-2">
              <Label htmlFor="debtor-name">Nom du titulaire</Label>
              <Input
                id="debtor-name"
                value={debtorInfo.name}
                onChange={(e) => setDebtorInfo({ ...debtorInfo, name: e.target.value })}
                placeholder="Société XYZ"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="debtor-iban">IBAN</Label>
              <Input
                id="debtor-iban"
                value={debtorInfo.iban}
                onChange={(e) => setDebtorInfo({ ...debtorInfo, iban: e.target.value })}
                placeholder="FR7630001007941234567890185"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="debtor-bic">BIC</Label>
              <Input
                id="debtor-bic"
                value={debtorInfo.bic}
                onChange={(e) => setDebtorInfo({ ...debtorInfo, bic: e.target.value })}
                placeholder="BNPAFRPP"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || suppliersWithoutBank.length === groups.length}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Génération...' : 'Générer et télécharger'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
