
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { mockPurchaseOrders } from '@/pages/PurchaseOrders';
import { mockVendors } from '@/types/vendor';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileUp, Check, Calendar, FileText } from 'lucide-react';

const SupplierGuestInvoice = () => {
  const [poDetails, setPoDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [success, setSuccess] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const poNumber = params.get('poNumber');
    
    if (!poNumber) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Numéro de bon de commande manquant",
      });
      navigate('/supplier');
      return;
    }
    
    // Find the purchase order by poNumber
    const po = mockPurchaseOrders.find(po => po.poNumber === poNumber);
    
    if (!po) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Bon de commande introuvable",
      });
      navigate('/supplier');
      return;
    }
    
    // Find the vendor
    const vendor = mockVendors.find(v => v.id === po.vendorId);
    
    if (!vendor) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Informations fournisseur introuvables",
      });
      navigate('/supplier');
      return;
    }
    
    // For simulation, we'll say it's either got a down payment or it's past completion date
    const hasDownPayment = Math.random() > 0.5;
    const isPastCompletionDate = Math.random() > 0.5;
    
    // Add these flags to PO details
    const poWithSubmissionConditions = {
      ...po,
      vendor: vendor.name,
      vendorEmail: vendor.email,
      completionDate: "2023-12-15", // Mock completion date
      paymentTerms: hasDownPayment ? "Acompte de 30%" : "Net 30",
      hasDownPayment,
      isPastCompletionDate,
      canSubmitInvoice: hasDownPayment || isPastCompletionDate
    };
    
    setPoDetails(poWithSubmissionConditions);
    setCanSubmit(hasDownPayment || isPastCompletionDate);
    setLoading(false);
  }, [location.search, navigate, toast]);
  
  const handleSendVerificationCode = () => {
    if (!acceptTerms) return;
    
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setVerificationSent(true);
    
    toast({
      title: "Code de vérification envoyé",
      description: `Un code a été envoyé à l'email ${poDetails.vendorEmail}`,
    });
    
    // For demo purposes, we'll show the code in the console
    console.log("Verification code:", code);
  };
  
  const verifyCode = () => {
    if (userCode === verificationCode) {
      submitInvoice();
    } else {
      setCodeError("Code incorrect. Veuillez réessayer.");
    }
  };
  
  const submitInvoice = () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un fichier de facture",
      });
      return;
    }
    
    setSubmitting(true);
    
    // Simulate upload delay
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      
      toast({
        title: "Facture envoyée",
        description: "Votre facture a été soumise avec succès",
      });
    }, 2000);
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement des informations...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto p-4 flex items-center">
          <Button 
            variant="ghost" 
            className="mr-4"
            onClick={() => navigate('/supplier')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Soumettre une facture</h1>
            <p className="text-sm text-gray-500">Bon de commande #{poDetails.poNumber}</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        {success ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Merci pour cet envoi</h2>
              <p className="text-gray-600 mb-6">
                Votre facture sera traitée conformément aux conditions de la commande. 
                Pour toute question vous pouvez contacter l'équipe à l'adresse 
                <span className="font-medium"> finance@sapajoo.com</span>.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-left mb-6">
                <p className="text-blue-800 text-sm">
                  Vous pouvez à tout moment créer votre compte fournisseur pour suivre vos Bons de commande 
                  avec tous vos clients utilisant Sapajoo {" "}
                  <a href="/supplier" className="text-po-blue font-medium underline">ici</a>.
                </p>
              </div>
              
              <Button 
                className="bg-po-blue hover:bg-blue-600"
                onClick={() => navigate('/supplier')}
              >
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Récapitulatif du bon de commande</CardTitle>
                <CardDescription>
                  Veuillez vérifier les informations avant de soumettre votre facture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Numéro de BC</h3>
                    <p className="text-lg font-medium flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      {poDetails.poNumber}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Client</h3>
                    <p className="text-lg font-medium">{poDetails.sender || "Sapajoo SAS"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Montant</h3>
                    <p className="text-lg font-medium">{poDetails.currency} {poDetails.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Date de livraison</h3>
                    <p className="text-lg font-medium flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {poDetails.completionDate}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Conditions de paiement</h3>
                    <p className="text-lg font-medium">{poDetails.paymentTerms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Soumettre votre facture</CardTitle>
                {canSubmit ? (
                  <CardDescription>
                    Veuillez télécharger votre facture au format PDF, JPG ou PNG
                  </CardDescription>
                ) : (
                  <CardDescription className="text-red-500">
                    La soumission de facture n'est pas disponible actuellement. Elle sera disponible après la date de livraison 
                    ou si un acompte est prévu dans les conditions de paiement.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {canSubmit ? (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center">
                      <FileUp className="h-12 w-12 text-gray-400 mb-3" />
                      {file ? (
                        <p className="text-sm font-medium">{file.name}</p>
                      ) : (
                        <p className="text-sm text-gray-500">Glissez et déposez ou cliquez pour télécharger</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Formats acceptés : PDF, JPG, PNG (max 10MB)</p>
                      <input
                        id="invoice-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => document.getElementById('invoice-file')?.click()}
                      >
                        Sélectionner un fichier
                      </Button>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={acceptTerms}
                        onCheckedChange={(checked) => {
                          if (typeof checked === 'boolean') {
                            setAcceptTerms(checked);
                          }
                        }} 
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          J'accepte les conditions
                        </Label>
                        <p className="text-xs text-muted-foreground italic">
                          Je confirme que j'ai lu et approuvé les termes ci-dessus et que je suis habilité(e) à facturer la société {poDetails.sender || "Sapajoo SAS"}.
                        </p>
                      </div>
                    </div>
                    
                    {!verificationSent ? (
                      <Button 
                        className="w-full bg-po-blue hover:bg-blue-600"
                        disabled={!file || !acceptTerms}
                        onClick={handleSendVerificationCode}
                      >
                        Envoyer un code de vérification
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="verification-code">Code de vérification</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="verification-code"
                              value={userCode}
                              onChange={(e) => {
                                setUserCode(e.target.value);
                                setCodeError('');
                              }}
                              placeholder="Entrez le code à 6 chiffres"
                            />
                            <Button onClick={verifyCode}>Vérifier</Button>
                          </div>
                          {codeError && <p className="text-red-500 text-sm mt-1">{codeError}</p>}
                          <p className="text-sm text-gray-500 mt-2">
                            Un code de vérification a été envoyé à {poDetails.vendorEmail}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <p className="text-amber-800 text-sm">
                      Selon les conditions du bon de commande, vous pourrez soumettre votre facture 
                      après la date de livraison ({poDetails.completionDate}) ou si un acompte est prévu 
                      dans les conditions de paiement.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/supplier')}>
                  Annuler
                </Button>
                {canSubmit && (
                  <Button 
                    className="bg-po-blue hover:bg-blue-600"
                    disabled={!file || !acceptTerms || !verificationSent || !userCode || submitting}
                    onClick={verifyCode}
                  >
                    {submitting ? 'Envoi en cours...' : 'Soumettre la facture'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default SupplierGuestInvoice;
