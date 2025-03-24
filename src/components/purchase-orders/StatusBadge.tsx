
import React from 'react';
import { Check } from 'lucide-react';
import { PurchaseOrderStatus } from '@/pages/PurchaseOrders';

interface StatusBadgeProps {
  status: PurchaseOrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusClasses = {
    draft: 'bg-gray-200 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    matched: 'bg-blue-100 text-blue-800',
    paid: 'bg-purple-100 text-purple-800'
  };

  const statusMap = {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    matched: 'Matched',
    paid: 'Paid'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`}>
      {status === 'matched' && <Check className="inline w-3 h-3 mr-1" />}
      {statusMap[status]}
    </span>
  );
};
