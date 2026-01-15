
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Building, 
  ArrowRight,
  MapPin,
  Star,
  Handshake,
  TrendingUp
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vendor } from '@/types/vendor';

interface VendorCardProps {
  vendor: Vendor;
}

const VendorCard = ({ vendor }: VendorCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderRating = (rating: number | undefined, totalRatings: number | undefined) => {
    if (!rating || rating === 0) {
      return <span className="text-muted-foreground text-xs">Pas de note</span>;
    }
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{rating.toFixed(1)}</span>
        {totalRatings && totalRatings > 0 && (
          <span className="text-muted-foreground text-xs">({totalRatings})</span>
        )}
      </div>
    );
  };

  return (
    <Card key={vendor.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{vendor.name}</CardTitle>
            <CardDescription>{vendor.category}</CardDescription>
            {vendor.specialty && (
              <Badge variant="secondary" className="text-xs">
                {vendor.specialty}
              </Badge>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {vendor.status === 'active' && (
              <span className="status-badge status-approved">Actif</span>
            )}
            {vendor.status === 'pending' && (
              <span className="status-badge status-pending">En attente</span>
            )}
            {vendor.status === 'inactive' && (
              <span className="status-badge status-draft">Inactif</span>
            )}
            {renderRating(vendor.averageRating, vendor.totalRatings)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{vendor.email}</span>
          </div>
          <div className="flex items-center text-sm">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{vendor.phone}</span>
          </div>
          <div className="flex items-center text-sm">
            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{vendor.totalPOs} Bons de Commande</span>
          </div>
          {vendor.city && vendor.country && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{vendor.city}, {vendor.country}</span>
            </div>
          )}
          
          {/* New indicators row */}
          <div className="flex items-center gap-3 pt-2 border-t mt-2">
            {vendor.hasNegotiatedRates && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Handshake className="h-3 w-3" />
                <span>Tarifs négociés</span>
              </div>
            )}
            {vendor.businessVolume !== undefined && vendor.businessVolume > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{formatCurrency(vendor.businessVolume)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 pt-3">
        <Link 
          to={`/vendors/${vendor.id}`} 
          className="text-primary hover:text-primary/80 text-sm flex items-center ml-auto"
        >
          Voir les détails
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default VendorCard;
