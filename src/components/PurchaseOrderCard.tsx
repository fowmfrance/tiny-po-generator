import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/components/purchase-orders/StatusBadge';
import { PurchaseOrderStatus } from '@/pages/PurchaseOrders';

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

const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = ({
  id,
  poNumber,
  vendor,
  vendorId,
  amount,
  currency,
  date,
  status,
  paymentProgress = 0
}) => {
  return (
    <div className="group bg-card rounded-xl border border-border hover:border-slate-400 transition-colors duration-200 p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
            BC #{poNumber}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            <Link to={`/vendors/${vendorId}`} className="hover:text-accent transition-colors">
              {vendor}
            </Link>
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mb-6">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {amount.toLocaleString('fr-FR')} €
        </span>
        <div className="text-sm text-muted-foreground mt-1">{date}</div>
      </div>

      {(status === 'approved' || status === 'matched' || status === 'paid') && (
        <div className="mb-4">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-border mt-auto">
        {(status === 'approved' || status === 'matched' || status === 'paid') && (
          <span className="text-xs text-muted-foreground font-medium">
            {paymentProgress}% payé
          </span>
        )}
        {!(status === 'approved' || status === 'matched' || status === 'paid') && (
          <span />
        )}
        <Link 
          to={`/purchase-orders/${id}`} 
          className="text-sm font-medium text-foreground hover:text-accent group-hover:translate-x-1 transition-all flex items-center gap-1"
        >
          Détails
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default PurchaseOrderCard;
