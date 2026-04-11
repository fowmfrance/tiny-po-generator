import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MailX, CheckCircle, AlertCircle } from 'lucide-react';

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

const Unsubscribe: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
        { headers: { apikey: anonKey } }
      );
      const data = await response.json();
      if (data.valid === false && data.reason === 'already_unsubscribed') {
        setStatus('already');
      } else if (data.valid) {
        setStatus('valid');
      } else {
        setStatus('invalid');
      }
    } catch {
      setStatus('invalid');
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const content = {
    loading: {
      icon: <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />,
      title: 'Vérification...',
      desc: '',
    },
    valid: {
      icon: <MailX className="h-12 w-12 text-muted-foreground mx-auto" />,
      title: 'Se désabonner',
      desc: 'Confirmez pour ne plus recevoir d\'emails de notre part.',
    },
    already: {
      icon: <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />,
      title: 'Déjà désabonné',
      desc: 'Vous êtes déjà désabonné de nos communications.',
    },
    success: {
      icon: <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />,
      title: 'Désabonnement confirmé',
      desc: 'Vous ne recevrez plus d\'emails de notre part.',
    },
    invalid: {
      icon: <AlertCircle className="h-12 w-12 text-destructive mx-auto" />,
      title: 'Lien invalide',
      desc: 'Ce lien de désabonnement est invalide ou a expiré.',
    },
    error: {
      icon: <AlertCircle className="h-12 w-12 text-destructive mx-auto" />,
      title: 'Erreur',
      desc: 'Une erreur est survenue. Veuillez réessayer.',
    },
  };

  const c = content[status];

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {c.icon}
          <CardTitle className="mt-4">{c.title}</CardTitle>
          <CardDescription>{c.desc}</CardDescription>
        </CardHeader>
        {status === 'valid' && (
          <CardContent>
            <Button onClick={handleUnsubscribe} className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmer le désabonnement
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Unsubscribe;
