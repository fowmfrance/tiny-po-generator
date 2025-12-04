import React from 'react';
import { Check } from 'lucide-react';
import { PurchaseOrderStatus } from '@/pages/PurchaseOrders';

interface StatusBadgeProps {
  status: PurchaseOrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusClasses = {
    draft: 'bg-slate-100 text-slate-700 border border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-100',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    rejected: 'bg-red-50 text-red-700 border border-red-100',
    matched: 'bg-blue-50 text-blue-700 border border-blue-100',
    paid: 'bg-indigo-50 text-indigo-700 border border-indigo-100'
  };

  const statusMap = {
    draft: 'Draft',
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    matched: 'Matched',
    paid: 'Payé'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
      {status === 'matched' && <Check className="w-3 h-3 mr-1" />}
      {statusMap[status]}
    </span>
  );
};
