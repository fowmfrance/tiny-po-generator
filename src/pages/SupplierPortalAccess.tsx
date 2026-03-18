import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Step = 'loading' | 'verify-email' | 'enter-code' | 'verified' | 'error';

const SupplierPortalAccess: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('loading');
  const [tokenData, setTokenData] = useState<any>(null);
  const [supplierData, setSupplierData] = useState<any>(null);
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) loadToken();
  }, [token]);

  const loadToken = async () => {
    const { data, error } = await supabase
      .from('supplier_access_tokens' as any)
      .select('*, supplier:suppliers(id, name, email)')
      .eq('token', token!)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      setStep('error');
      setError('Lien invalide ou expiré.');
      return;
    }

    setTokenData(data);
    setSupplierData((data as any).supplier);

    if ((data as any).email_verified) {
      // Already verified, go to dashboard
      navigate(`/supplier/purchaseorders/${(data as any).supplier_id}`);
    } else {
      setStep('verify-email');
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check email matches the supplier's email
    if (emailInput.toLowerCase() !== supplierData?.email?.toLowerCase()) {
      setError('L\'email ne correspond pas au fournisseur associé à ce lien.');
      setLoading(false);
      return;
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    const { error: updateError } = await supabase
      .from('supplier_access_tokens' as any)
      .update({
        verification_code: code,
        verification_code_expires_at: expiresAt,
      } as any)
      .eq('id', tokenData.id);

    if (updateError) {
      setError('Erreur lors de l\'envoi du code.');
      setLoading(false);
      return;
    }

    // In production, this would send an email. For now, show the code in a toast (dev mode).
    toast({
      title: 'Code de vérification',
      description: `Votre code : ${code} (en production, envoyé par email)`,
      duration: 30000,
    });

    setStep('enter-code');
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Re-fetch token to get the code
    const { data: freshToken } = await supabase
      .from('supplier_access_tokens' as any)
      .select('*')
      .eq('id', tokenData.id)
      .single();

    if (!freshToken) {
      setError('Token introuvable.');
      setLoading(false);
      return;
    }

    const ft = freshToken as any;
    
    if (ft.verification_code !== codeInput) {
      setError('Code incorrect.');
      setLoading(false);
      return;
    }

    if (new Date(ft.verification_code_expires_at) < new Date()) {
      setError('Code expiré. Veuillez en demander un nouveau.');
      setStep('verify-email');
      setLoading(false);
      return;
    }

    // Mark as verified
    const { error: verifyError } = await supabase
      .from('supplier_access_tokens' as any)
      .update({
        email_verified: true,
        verified_at: new Date().toISOString(),
        verification_code: null,
        verification_code_expires_at: null,
      } as any)
      .eq('id', tokenData.id);

    if (verifyError) {
      setError('Erreur lors de la vérification.');
      setLoading(false);
      return;
    }

    toast({ title: 'Email vérifié', description: 'Vous avez accès à votre espace fournisseur.' });
    navigate(`/supplier/purchaseorders/${ft.supplier_id}`);
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle>Accès impossible</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle>Portail Fournisseur</CardTitle>
          <CardDescription>
            {supplierData?.name} — Vérification de votre identité
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'verify-email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pour accéder à votre espace, veuillez confirmer votre adresse email.
                Un code de vérification vous sera envoyé.
              </p>
              <div>
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="votre@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Envoyer le code
              </Button>
            </form>
          )}

          {step === 'enter-code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Un code à 6 chiffres a été envoyé à <strong>{emailInput}</strong>. 
                Saisissez-le ci-dessous.
              </p>
              <div>
                <Label htmlFor="code">Code de vérification</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="text-center text-2xl tracking-widest mt-1"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || codeInput.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Vérifier
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => { setStep('verify-email'); setError(''); }}
              >
                Renvoyer un code
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierPortalAccess;
