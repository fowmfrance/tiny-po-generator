import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { PurchaseOrderStatus } from '@/pages/PurchaseOrders';
import { getInitials, getMonogramColor } from '@/utils/monogram';

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
  invoicedTtc?: number;
  invoicedPct?: number;
  invoiceCount?: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

const STATUS_META: Record<PurchaseOrderStatus, { label: string; dot: string; text: string }> = {
  draft: { label: 'Brouillon', dot: '#94A3B8', text: 'text-slate-500' },
  sent: { label: 'Envoyé', dot: '#378ADD', text: 'text-blue-600' },
  pending: { label: 'En attente', dot: '#F59E0B', text: 'text-amber-600' },
  approved: { label: 'Approuvé', dot: '#94A3B8', text: 'text-slate-500' },
  rejected: { label: 'Rejeté', dot: '#EF4444', text: 'text-red-600' },
  matched: { label: 'Rapproché', dot: '#378ADD', text: 'text-blue-600' },
  paid: { label: 'Payé', dot: '#10B981', text: 'text-emerald-600' },
};

const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = ({
  id,
  poNumber,
  vendor,
  amount,
  date,
  status,
  paymentProgress = 0,
  invoicedTtc = 0,
  invoicedPct = 0,
  invoiceCount = 0,
}) => {
  const navigate = useNavigate();
  const mono = getMonogramColor(vendor);
  const meta = STATUS_META[status] ?? STATUS_META.approved;
  const showProgress = status === 'approved' || status === 'sent' || status === 'matched' || status === 'paid';
  const invoicedColor =
    invoicedPct > 100 ? 'text-red-600' : invoicedPct >= 100 ? 'text-emerald-600' : 'text-amber-600';

  return (
    <Card
      className="p-3.5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => navigate(`/purchase-orders/${id}`)}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] font-medium shrink-0"
          style={{ backgroundColor: mono.bg, color: mono.fg }}
        >
          {getInitials(vendor)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">{vendor}</div>
          <div className="text-xs text-muted-foreground truncate">{poNumber}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="num text-base font-semibold text-foreground">
            {formatCurrency(amount)}
          </div>
          <div className={`text-[11px] flex items-center gap-1 justify-end ${meta.text}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
            {meta.label}
          </div>
        </div>
      </div>

      {showProgress && (
        <>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              Facturé {invoiceCount > 1 ? `(${invoiceCount})` : ''}
            </span>
            {invoiceCount > 0 ? (
              <span className={`font-medium ${invoicedColor}`}>
                {formatCurrency(invoicedTtc)} · {invoicedPct}%
              </span>
            ) : (
              <span className="text-muted-foreground/60">aucune facture</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full ${paymentProgress >= 100 ? 'bg-emerald-500' : 'bg-brand'}`}
                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{paymentProgress}% payé</span>
          </div>
        </>
      )}

      <div className="mt-2 text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
        {date}
      </div>
    </Card>
  );
};

export default PurchaseOrderCard;
