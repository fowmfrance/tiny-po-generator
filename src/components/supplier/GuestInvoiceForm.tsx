
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

interface GuestInvoiceFormProps {
  setError: (error: string) => void;
}

const GuestInvoiceForm: React.FC<GuestInvoiceFormProps> = ({ setError }) => {
  const [poNumber, setPoNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGuestSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate PO number
    if (!poNumber) {
      setError('Veuillez saisir le numéro de bon de commande.');
      setLoading(false);
      return;
    }

    // For demonstration, navigate to guest invoice submission page
    setTimeout(() => {
      navigate(`/supplier/guest-invoice?poNumber=${poNumber}`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Soumettre ma facture sans créer d'espace fournisseur
      </p>
      
      <form onSubmit={handleGuestSubmission} className="space-y-6">
        <div>
          <Label htmlFor="poNumber">
            Numéro de bon de commande
          </Label>
          <div className="mt-1">
            <Input
              id="poNumber"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="Ex: 2023-001"
              required
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-po-blue hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Recherche en cours...' : 'Continuer'}
        </Button>
      </form>
    </div>
  );
};

export default GuestInvoiceForm;
