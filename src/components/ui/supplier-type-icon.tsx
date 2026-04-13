import React, { lazy, Suspense } from 'react';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { cn } from '@/lib/utils';

interface SupplierTypeIconProps extends Omit<LucideProps, 'ref'> {
  iconName?: string | null;
  className?: string;
}

const IconCache = new Map<string, React.LazyExoticComponent<React.FC<LucideProps>>>();

function getLazyIcon(name: string) {
  if (!IconCache.has(name)) {
    const importFn = dynamicIconImports[name as keyof typeof dynamicIconImports];
    if (!importFn) return null;
    IconCache.set(name, lazy(importFn));
  }
  return IconCache.get(name)!;
}

export function SupplierTypeIcon({ iconName, className, ...props }: SupplierTypeIconProps) {
  if (!iconName) return null;

  const LazyIcon = getLazyIcon(iconName);
  if (!LazyIcon) return null;

  return (
    <Suspense fallback={<div className={cn('h-4 w-4', className)} />}>
      <LazyIcon className={cn('h-4 w-4', className)} {...props} />
    </Suspense>
  );
}
