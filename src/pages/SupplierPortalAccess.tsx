import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

type Step = 'loading' | 'verified' | 'error';

const SupplierPortalAccess: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) validateAndRedirect();
  }, [token]);

  const validateAndRedirect = async () => {
    // Look up the token
    const { data, error: fetchError } = await supabase
      .from('supplier_access_tokens' as any)
      .select('id, token, email_verified')
      .eq('token', token!)
      .eq('is_active', true)
      .maybeSingle();

    if (fetchError || !data) {
      setStep('error');
      setError('Lien invalide ou expiré.');
      return;
    }

    const tokenData = data as any;

    if (!tokenData.email_verified) {
      await supabase
        .from('supplier_access_tokens' as any)
        .update({
          email_verified: true,
          verified_at: new Date().toISOString(),
        } as any)
        .eq('id', tokenData.id);
    }

    navigate(`/supplier/purchaseorders/${tokenData.token}`, { replace: true });
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Vérification de votre accès...</p>
        </div>
      </div>
    );
  }

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
};

export default SupplierPortalAccess;
