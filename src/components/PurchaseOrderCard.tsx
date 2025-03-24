
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-medium">PO #{poNumber}</h3>
            <Link to={`/vendors/${vendorId}`} className="text-sm text-po-blue hover:underline">
              {vendor}
            </Link>
          </div>
          <div>
            <StatusBadge status={status} />
          </div>
        </div>
        
        <div className="mb-3">
          <p className="text-2xl font-semibold">
            {currency} {amount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
        
        {(status === 'approved' || status === 'matched' || status === 'paid') && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Payment Progress</span>
              <span>{paymentProgress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${paymentProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 p-3 border-t border-gray-100">
        <Link 
          to={`/purchase-orders/${id}`} 
          className="text-po-blue hover:text-blue-700 text-sm flex items-center justify-end"
        >
          View Details
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default PurchaseOrderCard;
