
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { mockVendors } from '@/types/vendor';

interface SupplierLoginFormProps {
  setError: (error: string) => void;
}

const SupplierLoginForm: React.FC<SupplierLoginFormProps> = ({ setError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Demo mode only available in development environment
    setTimeout(() => {
      // Find the vendor with the provided email
      const vendor = mockVendors.find(v => v.email.toLowerCase() === email.toLowerCase());
      
      // Only allow demo credentials in development mode
      const isDemoModeAllowed = import.meta.env.DEV;
      const isDemoCredentialsValid = isDemoModeAllowed && password === 'demo123';
      
      if (vendor && isDemoCredentialsValid) {
        // Success - navigate to the supplier dashboard with vendor ID (dev only)
        navigate(`/supplier/purchaseorders/${vendor.id}`);
      } else if (!isDemoModeAllowed) {
        // Production: inform user that demo mode is not available
        setError('L\'authentification fournisseur nécessite une configuration complète. Contactez l\'administrateur.');
      } else {
        // Development: show invalid credentials error
        setError('Email ou mot de passe incorrect.');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      <div>
        <Label htmlFor="email">
          Email
        </Label>
        <div className="mt-1">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="fournisseur@entreprise.com"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">
          Mot de passe
        </Label>
        <div className="mt-1">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Button 
          type="submit" 
          className="w-full bg-po-blue hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </Button>
      </div>
      
      <div className="text-sm text-center">
        <a href="#" className="font-medium text-po-blue hover:text-blue-600">
          Mot de passe oublié ?
        </a>
      </div>
    </form>
  );
};

export default SupplierLoginForm;
