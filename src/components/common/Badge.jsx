import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ children, variant = 'default', size = 'md', className, dot = false }) {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-orange-50 text-orange-800 border-orange-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accent: 'bg-orange-50 text-orange-800 border-orange-200',
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  const dotColors = {
    default: 'bg-slate-500',
    primary: 'bg-orange-500',
    success: 'bg-emerald-500',
    accent: 'bg-orange-500',
    orange: 'bg-orange-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] font-medium',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border shadow-xs transition-colors',
        variants[variant] || variants.default,
        sizes[size] || sizes.md,
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full animate-dot-pulse', dotColors[variant] || dotColors.default)}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Intelligent Status Badge helper that maps common status strings directly to appropriate color variants
 */
export function StatusBadge({ status, className }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  let variant = 'default';
  let dot = true;

  if (
    [
      'active',
      'delivered',
      'completed',
      'pod confirmed',
      'verified',
      'approved',
      'paid',
      'accepted',
      'in stock',
    ].includes(normalized)
  ) {
    variant = 'success';
  } else if (
    [
      'pending',
      'under review',
      'low stock',
      'new',
      'draft',
      'documents pending',
    ].includes(normalized)
  ) {
    variant = 'warning';
  } else if (
    ['rejected', 'out of stock', 'cancelled', 'expired', 'failed'].includes(normalized)
  ) {
    variant = 'danger';
  } else if (
    [
      'processing',
      'packed',
      'packed / ready for dispatch',
      'ready for dispatch',
      'dispatched',
      'in transit',
      'quotation sent',
      'sent to buyer',
      'sent',
      'viewed',
      'responded',
    ].includes(normalized)
  ) {
    variant = 'info';
  } else if (['escrow secured', 'credit (30 days)', 'credit account'].includes(normalized)) {
    variant = 'indigo';
  } else if (['archived'].includes(normalized)) {
    variant = 'default';
    dot = false;
  }

  return (
    <Badge variant={variant} dot={dot} className={className}>
      {status}
    </Badge>
  );
}
