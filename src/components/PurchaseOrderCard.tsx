import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Truck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from '@/components/purchase-orders/StatusBadge';
import { PurchaseOrderStatus } from '@/pages/PurchaseOrders';
import { SupplierLink } from '@/components/ui/supplier-link';

interface PurchaseOrderCardProps {
  id: string;
  poNumber: string;
  vendor: string;
  vendorId: string;
  amount: number;
  currency: string;
  date: string;
  status: PurchaseOrderStatus;
  paymentProgress?: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = ({
  id,
  poNumber,
  vendor,
  vendorId,
  amount,
  currency,
  date,
  status,
  paymentProgress = 0,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/purchase-orders/${id}`)}
    >
      <CardHeader className="pb-1 pt-3 px-3">
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold truncate">
              BC #{poNumber}
            </CardTitle>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              <SupplierLink supplierId={vendorId} name={vendor} className="text-muted-foreground hover:text-primary hover:underline transition-colors text-xs" />
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="pb-3 px-3 pt-1">
        <div className="space-y-1">
          {/* Amount */}
          <div className="text-sm font-bold text-foreground">
            {formatCurrency(amount)}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>{date}</span>
          </div>

          {/* Payment progress — only shown once payment has started */}
          {paymentProgress > 0 && (status === 'approved' || status === 'matched' || status === 'paid') && (
            <div className="space-y-0.5">
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div
                  className="bg-brand rounded-full h-1.5 transition-all"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{paymentProgress}% payé</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderCard;
