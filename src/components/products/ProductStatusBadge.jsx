import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function ProductStatusBadge({ status, className = '' }) {
  const normalizedStatus = String(status || 'PENDING').toUpperCase();

  switch (normalizedStatus) {
    case 'APPROVED':
    case 'ACTIVE':
      return (
        <span
          title="Live / approved product"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>APPROVED</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span
          title="Requires correction / Rejected by admin"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>REJECTED</span>
        </span>
      );

    case 'INACTIVE':
      return (
        <span
          title="Temporarily delisted / inactive"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-xs ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>INACTIVE</span>
        </span>
      );

    case 'PENDING':
    default:
      return (
        <span
          title="Waiting for admin approval"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>PENDING</span>
        </span>
      );
  }
}

