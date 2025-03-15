
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CreatePOButton = () => {
  return (
    <Link to="/purchase-orders/create">
      <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Create Purchase Order
      </Button>
    </Link>
  );
};

export default CreatePOButton;
