
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Building, 
  ArrowRight,
  MapPin 
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Vendor } from '@/types/vendor';

interface VendorCardProps {
  vendor: Vendor;
}

const VendorCard = ({ vendor }: VendorCardProps) => {
  return (
    <Card key={vendor.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{vendor.name}</CardTitle>
            <CardDescription>{vendor.category}</CardDescription>
          </div>
          <div>
            {vendor.status === 'active' && (
              <span className="status-badge status-approved">Actif</span>
            )}
            {vendor.status === 'pending' && (
              <span className="status-badge status-pending">En attente</span>
            )}
            {vendor.status === 'inactive' && (
              <span className="status-badge status-draft">Inactif</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Mail className="h-4 w-4 mr-2 text-gray-400" />
            <span>{vendor.email}</span>
          </div>
          <div className="flex items-center text-sm">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span>{vendor.phone}</span>
          </div>
          <div className="flex items-center text-sm">
            <Building className="h-4 w-4 mr-2 text-gray-400" />
            <span>{vendor.totalPOs} Bons de Commande</span>
          </div>
          {vendor.city && vendor.country && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span>{vendor.city}, {vendor.country}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 pt-3">
        <Link 
          to={`/vendors/${vendor.id}`} 
          className="text-po-blue hover:text-blue-700 text-sm flex items-center ml-auto"
        >
          Voir les détails
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default VendorCard;
