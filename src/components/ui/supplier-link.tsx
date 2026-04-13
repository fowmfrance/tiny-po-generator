import React from 'react';
import { Link } from 'react-router-dom';

interface SupplierLinkProps {
  supplierId: string;
  name: string;
  className?: string;
}

export function SupplierLink({ supplierId, name, className }: SupplierLinkProps) {
  return (
    <Link
      to={`/vendors/${supplierId}`}
      className={className || 'text-foreground hover:text-primary hover:underline transition-colors'}
      onClick={(e) => e.stopPropagation()}
    >
      {name}
    </Link>
  );
}
