import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { mockVendors } from '@/types/vendor';

const SupplierPortal = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // For demonstration, using fixed credentials or checking against mock vendors
    setTimeout(() => {
      // Find the vendor with the provided email
      const vendor = mockVendors.find(v => v.email.toLowerCase() === email.toLowerCase());
      
      if (vendor && password === 'password') {
        // Success - navigate to the supplier dashboard with vendor ID
        navigate(`/supplier/purchaseorders/${vendor.id}`);
      } else {
        // Show error message
        setError('Email ou mot de passe incorrect.');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img 
          src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
          alt="Sapajoo" 
          className="mx-auto h-16 w-auto object-contain"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Portail Fournisseur
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Accédez à vos bons de commande et gérez vos factures
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

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
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Information
                </span>
              </div>
            </div>
            
            <div className="mt-6 text-sm text-gray-500 text-center">
              <p>Pour le test, utilisez:</p>
              <p className="mt-1"><strong>Email:</strong> procurement@apple.com</p>
              <p><strong>Mot de passe:</strong> password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierPortal;
