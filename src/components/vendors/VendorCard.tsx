import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Building, 
  Star,
  Handshake,
  TrendingUp,
  ShieldOff,
  CreditCard
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupplierTypeIcon } from '@/components/ui/supplier-type-icon';
import { Vendor } from '@/types/vendor';

interface VendorCardProps {
  vendor: Vendor;
}

const VendorCard = ({ vendor }: VendorCardProps) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const hasEmail = vendor.email && !vendor.email.includes('.temp');
  const hasPhone = !!vendor.phone && vendor.phone.trim() !== '';

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/vendors/${vendor.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SupplierTypeIcon iconName={vendor.supplierTypeIcon} className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{vendor.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{vendor.category}</p>
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
            {(vendor.averageRating || 0) > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-sm">{vendor.averageRating!.toFixed(1)}</span>
                {(vendor.totalRatings || 0) > 0 && (
                  <span className="text-muted-foreground text-xs">({vendor.totalRatings})</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">Pas de note</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Mail 
              className={`h-4 w-4 mr-2 ${hasEmail ? 'text-muted-foreground' : 'text-muted-foreground/20'}`} 
              strokeWidth={hasEmail ? 2.5 : 1.5}
            />
            <span className={hasEmail ? '' : 'text-muted-foreground/40'}>{vendor.email}</span>
          </div>
          <div className="flex items-center text-sm">
            <Phone 
              className={`h-4 w-4 mr-2 ${hasPhone ? 'text-muted-foreground' : 'text-muted-foreground/20'}`}
              strokeWidth={hasPhone ? 2.5 : 1.5}
            />
            <span className={hasPhone ? '' : 'text-muted-foreground/40'}>{hasPhone ? vendor.phone : '—'}</span>
          </div>
          <div className="flex items-center text-sm">
            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{vendor.totalPOs} BdC</span>
          </div>
          
          {/* Indicators row */}
          <div className="flex items-center gap-3 pt-2 border-t mt-2 flex-wrap">
            {vendor.isPOExempt && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <ShieldOff className="h-3 w-3" />
                <span>Dispensé de BdC</span>
              </div>
            )}
            {vendor.paymentMethodName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3" />
                <span>{vendor.paymentMethodName}{vendor.paymentModalityName ? ` · ${vendor.paymentModalityName}` : ''}</span>
              </div>
            )}
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
    </Card>
  );
};

export default VendorCard;
