
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CreatePOButton = () => {
  return (
    <Link to="/purchase-orders/create">
      <Button className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Nouveau Bon de Commande
      </Button>
    </Link>
  );
};

export default CreatePOButton;
