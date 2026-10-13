import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  Users,
  ShieldCheck,
  Edit2,
  FileText,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Truck,
  IndianRupee,
  Landmark,
} from 'lucide-react';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { formatCurrency } from '../../utils/formatters';
import { maskAccountNumber } from '../../constants/banks';

export function CompanyProfilePage() {
  const { profile, isLoadingProfile } = useSellerProfile();

  if (isLoadingProfile || !profile) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const completionPct = profile.completionPercentage || (profile.verified ? 100 : 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Cover Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
        <div className="h-44 sm:h-56 w-full relative">
          <img
            src={profile.coverImage}
            alt="Company Cover"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        </div>

        {/* Profile Info Overlay */}
        <div className="p-6 sm:p-8 relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-4 border-slate-900 bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {profile.companyName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {profile.businessType} • Est. {profile.establishedYear} • {profile.address?.city}, {profile.address?.state}
              </p>
            </div>
          </div>

          <Link to="/seller/company/business-details">
            <Button variant="primary" size="sm" leftIcon={Edit2}>
              Edit Business Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Completion Meter Alert */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Profile Completion Status</span>
            <span className="text-emerald-700 font-extrabold">{completionPct}% Complete</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            High completion score improves your search ranking and RFQ allocations from top tier developers.
          </p>
        </div>

        <Link to="/seller/company/documents">
          <Button variant="secondary" size="sm" leftIcon={FileCheck2}>
            View Compliance Docs
          </Button>
        </Link>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="md:col-span-2 space-y-6">
          {/* About Company */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Company Overview & Supply Chain Capabilities
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">{profile.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Employees
                </span>
                <span className="font-bold text-slate-800">{profile.employees} Staff</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Minimum Order Value
                </span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(profile.minOrderValue || 25000)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Verification
                </span>
                <span className="font-bold text-emerald-600">Active & Compliant</span>
              </div>
            </div>
          </div>

          {/* Operating Address */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Principal Operating Address & Logistics Complex
            </h3>

            <div className="space-y-1 text-xs text-slate-700">
              <p className="font-bold text-slate-900">{profile.companyName}</p>
              <p className="leading-relaxed">{profile.address?.completeAddress}</p>
              <p className="font-mono text-slate-500">
                PIN: {profile.address?.pincode} • State: {profile.address?.state}
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col */}
        <div className="space-y-6">
          {/* Statutory Identifiers */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Statutory Tax Identifiers
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  GSTIN
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {profile.legal?.gstin}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  PAN Number
                </span>
                <span className="font-mono font-bold text-slate-900">{profile.legal?.pan}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  LLPIN / CIN
                </span>
                <span className="font-mono text-slate-700">{profile.legal?.cin}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  MSME Udyam ID
                </span>
                <span className="font-mono text-slate-700">{profile.legal?.msme}</span>
              </div>
            </div>
          </div>

          {/* Settlement Bank Account Details */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                Settlement Bank Account
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Verified
              </span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bank Name</span>
                <span className="font-bold text-slate-900">{profile.bankDetails?.bankName || 'Not configured'}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Account Number</span>
                  <span className="font-mono font-bold text-slate-900">
                    {profile.bankDetails?.accountNumber ? maskAccountNumber(profile.bankDetails.accountNumber) : 'Not configured'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">IFSC Code</span>
                  <span className="font-mono font-bold text-slate-900">{profile.bankDetails?.ifsc || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Territories */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Truck className="w-4 h-4 text-emerald-600" />
              Service & Supply Coverage
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {(profile.serviceAreas && profile.serviceAreas.length > 0 ? profile.serviceAreas : ['PAN India']).map((area, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
