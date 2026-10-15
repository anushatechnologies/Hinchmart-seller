import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react';

export function ProductStatusBadge({ status, product, className = '' }) {
  const isRejected =
    status === 'REJECTED' ||
    product?.status === 'REJECTED' ||
    product?.approvalStatus === 'REJECTED';

  const isExplicitlyDeletedByAdmin =
    !isRejected && (
      status === 'DELETED_BY_ADMIN' ||
      status === 'DELETED' ||
      status === 'REMOVED_BY_ADMIN' ||
      Boolean(product?.deletedByAdmin) ||
      product?.status === 'DELETED_BY_ADMIN' ||
      product?.approvalStatus === 'DELETED_BY_ADMIN'
    );

  const isApproved =
    status === 'APPROVED' ||
    status === 'ACTIVE' ||
    product?.status === 'APPROVED' ||
    product?.status === 'ACTIVE' ||
    product?.approvalStatus === 'APPROVED' ||
    Boolean(product?.active);

  const normalizedStatus = isExplicitlyDeletedByAdmin
    ? 'DELETED_BY_ADMIN'
    : isRejected
    ? 'REJECTED'
    : isApproved
    ? 'APPROVED'
    : String(status || product?.status || 'PENDING').toUpperCase();

  switch (normalizedStatus) {
    case 'DELETED_BY_ADMIN':
    case 'DELETED':
    case 'REMOVED_BY_ADMIN':
      return (
        <span
          title="Listing was removed from marketplace by Admin"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs ${className}`}
        >
          <Trash2 className="w-3.5 h-3.5 text-white" />
          <span>DELETED BY ADMIN</span>
        </span>
      );

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

