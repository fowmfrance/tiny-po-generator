import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Building, 
  Star,
  Handshake,
  ShieldOff,
  CreditCard,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupplierTypeIcon } from '@/components/ui/supplier-type-icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

  const hasEmail = !!vendor.email && vendor.email.trim() !== '' && !vendor.email.includes('.temp');
  const hasPhone = !!vendor.phone && vendor.phone.trim() !== '';

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/vendors/${vendor.id}`)}
    >
      <CardHeader className="pb-1 pt-3 px-3">
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold truncate">{vendor.name}</CardTitle>
            <div className="flex items-center gap-1 mt-0.5">
              <SupplierTypeIcon iconName={vendor.supplierTypeIcon} className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground truncate">{vendor.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Contact icons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Mail 
                  className={`h-3.5 w-3.5 ${hasEmail ? 'text-muted-foreground' : 'text-muted-foreground/20'}`}
                  strokeWidth={hasEmail ? 2.5 : 1.5}
                />
              </TooltipTrigger>
              <TooltipContent>{hasEmail ? vendor.email : 'Pas d\'email'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Phone 
                  className={`h-3.5 w-3.5 ${hasPhone ? 'text-muted-foreground' : 'text-muted-foreground/20'}`}
                  strokeWidth={hasPhone ? 2.5 : 1.5}
                />
              </TooltipTrigger>
              <TooltipContent>{hasPhone ? vendor.phone : 'Pas de téléphone'}</TooltipContent>
            </Tooltip>
            {/* Status */}
            {vendor.status === 'active' && (
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            )}
            {vendor.status === 'inactive' && (
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30 flex-shrink-0" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 px-3 pt-1">
        <div className="space-y-1">
          {/* Stats row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              <span>{vendor.totalPOs} BdC</span>
            </div>
            {(vendor.averageRating || 0) > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{vendor.averageRating!.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Spend */}
          {((vendor.ytdAmount || 0) > 0 || (vendor.prevYearAmount || 0) > 0) && (
            <div className="flex gap-2 text-[10px] text-muted-foreground">
              {(vendor.ytdAmount || 0) > 0 && (
                <span>{formatCurrency(vendor.ytdAmount!)} <span className="opacity-60">YTD</span></span>
              )}
              {(vendor.prevYearAmount || 0) > 0 && (
                <span>{formatCurrency(vendor.prevYearAmount!)} <span className="opacity-60">N-1</span></span>
              )}
            </div>
          )}

          {/* Indicators */}
          <div className="flex items-center gap-2 flex-wrap">
            {vendor.isPOExempt && (
              <ShieldOff className="h-3 w-3 text-amber-600" />
            )}
            {vendor.paymentMethodName && (
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <CreditCard className="h-3 w-3" />
                <span className="truncate max-w-[60px]">{vendor.paymentMethodName}</span>
              </div>
            )}
            {vendor.hasNegotiatedRates && (
              <Handshake className="h-3 w-3 text-green-600" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorCard;
