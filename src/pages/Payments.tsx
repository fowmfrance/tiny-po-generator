import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CreditCard, FileText, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { InvoicesTable } from '@/components/payments/InvoicesTable';
import { PaymentSummary } from '@/components/payments/PaymentSummary';
import { CreateInvoiceDialog } from '@/components/payments/CreateInvoiceDialog';
import { PaymentGenerationDialog } from '@/components/payments/PaymentGenerationDialog';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { formatCurrency } from '@/utils/paymentUtils';

export default function Payments() {
  const { invoices, isLoading } = useSupplierInvoices();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Filter invoices by tab
  const filteredInvoices = useMemo(() => {
    switch (activeTab) {
      case 'to-pay':
        // Toutes les non-payées (y compris échéance future) — l'urgence est en badge.
        return invoices.filter(inv => inv.payment_status !== 'paid');
      case 'paid':
        return invoices.filter(inv => inv.payment_status === 'paid');
      default:
        return invoices;
    }
  }, [invoices, activeTab]);

  // Stats
  const stats = useMemo(() => {
    const unpaid = invoices.filter(inv => inv.payment_status !== 'paid');
    const overdue = invoices.filter(inv => inv.payment_status === 'overdue');
    const dueSoon = invoices.filter(inv => inv.payment_status === 'due_soon');
    
    return {
      totalUnpaid: unpaid.reduce((sum, inv) => sum + Number(inv.amount), 0),
      countUnpaid: unpaid.length,
      totalOverdue: overdue.reduce((sum, inv) => sum + Number(inv.amount), 0),
      countOverdue: overdue.length,
      totalDueSoon: dueSoon.reduce((sum, inv) => sum + Number(inv.amount), 0),
      countDueSoon: dueSoon.length,
    };
  }, [invoices]);

  // Auto-select overdue/due_soon when switching to "to-pay" tab
  React.useEffect(() => {
    if (activeTab === 'to-pay') {
      // Pré-sélectionne seulement les urgentes (échues / échéance proche).
      const urgent = new Set(
        invoices
          .filter(inv => inv.payment_status === 'overdue' || inv.payment_status === 'due_soon')
          .map(inv => inv.id)
      );
      setSelectedIds(urgent);
    } else {
      setSelectedIds(new Set());
    }
  }, [activeTab, invoices]);

  const handleSelectionChange = (id: string, selected: boolean) => {
    const newSet = new Set(selectedIds);
    if (selected) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(filteredInvoices.map(inv => inv.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const selectedInvoices = useMemo(() => 
    invoices.filter(inv => selectedIds.has(inv.id)),
    [invoices, selectedIds]
  );

  const handlePaymentGenerated = () => {
    setSelectedIds(new Set());
    setActiveTab('paid');
  };

  return (
    <>
      <Helmet>
        <title>Paiements | Gestion des factures fournisseurs</title>
        <meta name="description" content="Gérez vos factures fournisseurs et générez des fichiers SEPA pour vos paiements." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Paiements</h1>
            <p className="text-muted-foreground">
              Gérez vos factures fournisseurs et générez vos ordres de virement
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Factures à payer</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalUnpaid)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.countUnpaid} facture{stats.countUnpaid > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Échues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{formatCurrency(stats.totalOverdue)}</div>
              <p className="text-xs text-red-600">
                {stats.countOverdue} facture{stats.countOverdue > 1 ? 's' : ''} en retard
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Échéance proche</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">{formatCurrency(stats.totalDueSoon)}</div>
              <p className="text-xs text-amber-600">
                {stats.countDueSoon} facture{stats.countDueSoon > 1 ? 's' : ''} dans les 7 jours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  Toutes ({invoices.length})
                </TabsTrigger>
                <TabsTrigger value="to-pay" className="text-red-600">
                  À payer ({stats.countUnpaid})
                </TabsTrigger>
                <TabsTrigger value="paid">
                  Payées ({invoices.length - stats.countUnpaid})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <InvoicesTable
                  invoices={filteredInvoices}
                  selectedIds={selectedIds}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                />
              </TabsContent>

              <TabsContent value="to-pay" className="mt-4">
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Factures à régler :</strong> Les factures échues et à échéance proche sont pré-sélectionnées. 
                    Décochez celles que vous ne souhaitez pas inclure dans le paiement.
                  </p>
                </div>
                <InvoicesTable
                  invoices={filteredInvoices}
                  selectedIds={selectedIds}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                />
              </TabsContent>

              <TabsContent value="paid" className="mt-4">
                <InvoicesTable
                  invoices={filteredInvoices}
                  selectedIds={selectedIds}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                  showCheckboxes={false}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar - Payment Summary */}
          <div className="space-y-4">
            <PaymentSummary selectedInvoices={selectedInvoices} />
            
            {selectedInvoices.length > 0 && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setIsPaymentDialogOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Valider le paiement ({selectedInvoices.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      <CreateInvoiceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <PaymentGenerationDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        selectedInvoices={selectedInvoices}
        onPaymentGenerated={handlePaymentGenerated}
      />
    </>
  );
}
