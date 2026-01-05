import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react';
import type { PaymentStatus } from '@/types/payment';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

const statusConfig: Record<PaymentStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ElementType;
  className: string;
}> = {
  overdue: {
    label: 'Échu',
    variant: 'destructive',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  due_soon: {
    label: 'Échu bientôt',
    variant: 'secondary',
    icon: Clock,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  not_due: {
    label: 'Non échu',
    variant: 'outline',
    icon: Calendar,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  paid: {
    label: 'Payé',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
