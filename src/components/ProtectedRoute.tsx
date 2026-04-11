import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [state, setState] = useState<'loading' | 'user' | 'admin-sapajoo' | 'unauthenticated'>('loading');

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState('unauthenticated');
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin-sapajoo')
        .maybeSingle();

      setState(data ? 'admin-sapajoo' : 'user');
    };
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setState('unauthenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/auth" replace />;
  }

  if (state === 'admin-sapajoo') {
    return <Navigate to="/backoffice" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
