import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Building,
  FileCheck2,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';

export function VerificationPage() {
  const { profile, documents, submitForVerification, isUpdating } = useSellerProfile();

  const allDocsVerified = documents.length > 0 && documents.every((d) => d.status === 'Verified');
  const hasRejectedDocs = documents.some((d) => d.status === 'Rejected');
  const pendingDocsCount = documents.filter((d) => d.status === 'Pending').length;

  const isFullyVerified = profile?.verified || allDocsVerified;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/seller/company/profile">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Profile
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Seller Verification & Trust Status
            </h1>
            <p className="text-xs text-slate-500">
              Statutory GST and enterprise compliance status for marketplace transactions
            </p>
          </div>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
        <div
          className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto shadow-xs ${
            isFullyVerified
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : hasRejectedDocs
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}
        >
          {isFullyVerified ? (
            <ShieldCheck className="w-9 h-9" />
          ) : hasRejectedDocs ? (
            <AlertCircle className="w-9 h-9" />
          ) : (
            <Clock className="w-9 h-9" />
          )}
        </div>

        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs mb-2 ${
              isFullyVerified
                ? 'bg-emerald-100 text-emerald-800'
                : hasRejectedDocs
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isFullyVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Verified B2B Seller
              </>
            ) : hasRejectedDocs ? (
              <>
                <AlertCircle className="w-4 h-4" /> Action Required (Documents Rejected)
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" /> Pending Compliance Verification
              </>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900">{profile?.companyName}</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {isFullyVerified
              ? `Your business is fully verified with verified GSTIN (${profile?.legal?.gstin}) and compliant trade credentials.`
              : hasRejectedDocs
              ? 'One or more statutory documents were rejected. Please upload revised copies in the Document Vault.'
              : 'Your business documentation is currently under statutory audit.'}
          </p>
        </div>

        {/* Checklist */}
        <div className="max-w-lg mx-auto bg-slate-50 rounded-xl border border-slate-200 p-5 text-left divide-y divide-slate-200/80 text-xs space-y-2 mt-4">
          <div className="pt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 font-bold" /> Mobile OTP Verification
            </span>
            <span className="font-bold text-emerald-600">✓ Verified</span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 font-bold" /> Official Business Email
            </span>
            <span className="font-bold text-emerald-600">✓ Verified</span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 font-bold" /> Business & Operating Address
            </span>
            <span className="font-bold text-emerald-600">✓ Verified</span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 font-bold" /> GSTIN Validated with Portal
            </span>
            <span className="font-bold text-emerald-600">✓ Verified</span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              {allDocsVerified ? (
                <Check className="w-4 h-4 text-emerald-600 font-bold" />
              ) : hasRejectedDocs ? (
                <X className="w-4 h-4 text-rose-600 font-bold" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 font-bold" />
              )}
              Statutory Compliance Documents
            </span>
            {allDocsVerified ? (
              <span className="font-bold text-emerald-600">✓ Verified</span>
            ) : hasRejectedDocs ? (
              <span className="font-bold text-rose-600">✕ Rejected</span>
            ) : (
              <span className="font-bold text-amber-600">⏳ Pending ({pendingDocsCount})</span>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <Link to="/seller/company/documents">
            <Button variant="secondary" size="md" leftIcon={FileCheck2}>
              Manage Uploaded Documents
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="md"
            onClick={() => submitForVerification()}
            isLoading={isUpdating}
            leftIcon={RefreshCw}
          >
            Request Re-Audit
          </Button>
        </div>
      </div>
    </div>
  );
}
