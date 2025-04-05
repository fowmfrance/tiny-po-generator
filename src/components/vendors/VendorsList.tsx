
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import VendorCard from './VendorCard';
import { Vendor } from '@/types/vendor';

interface VendorsListProps {
  vendors: Vendor[];
}

const VendorsList = ({ vendors }: VendorsListProps) => {
  if (vendors.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500 mb-4">Aucun fournisseur trouvé.</p>
        <Link to="/vendors/new">
          <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un Fournisseur
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
};

export default VendorsList;
