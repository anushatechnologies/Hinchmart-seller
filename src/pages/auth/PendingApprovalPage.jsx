import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  ShieldCheck,
  Building2,
  RefreshCw,
  LogOut,
  CheckCircle2,
  ArrowRight,
  FileCheck2,
  AlertCircle,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { useAuthStore } from '../../store/authStore';
import { sellerOnboardingService } from '../../services/sellerOnboarding.service';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../mock/db';

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const { user, sellerProfile, logout: authLogout } = useSellerAuth();
  const { user: storeUser, logout: storeLogout } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);

  const [isChecking, setIsChecking] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('PENDING_REVIEW');
  const [sellerData, setSellerData] = useState(null);

  const sellerId =
    sellerProfile?.sellerId ||
    storeUser?.sellerId ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null) ||
    '';

  const companyName =
    sellerProfile?.companyName ||
    storeUser?.companyName ||
    sellerData?.businessTaxDetails?.companyName ||
    sellerData?.companyName ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('seller_company') : null) ||
    'Your Business';

  const sellerEmail =
    sellerProfile?.email ||
    storeUser?.email ||
    user?.email ||
    sellerData?.personalDetails?.email ||
    '';

  const sellerPhone =
    sellerProfile?.phone ||
    storeUser?.phone ||
    sellerData?.personalDetails?.phone ||
    '';

  // Check live approval status from backend
  const checkStatus = async (showToast = true) => {
    if (!sellerId) return;
    setIsChecking(true);
    try {
      const summary = await sellerOnboardingService.getOnboardingSummary(sellerId);
      if (summary) {
        setSellerData(summary);
        const oStatus = String(summary.onboardingStatus || '').toUpperCase();
        const vStatus = String(summary.verificationStatus || '').toUpperCase();
        const isApproved =
          oStatus === 'VERIFIED' ||
          oStatus === 'APPROVED' ||
          oStatus === 'ACTIVE' ||
          vStatus === 'VERIFIED' ||
          vStatus === 'APPROVED' ||
          vStatus === 'ACTIVE';

        if (isApproved) {
          setApprovalStatus('APPROVED');
          localStorage.setItem('seller_approved', 'true');
          localStorage.setItem('seller_onboarding_status', 'VERIFIED');
          if (showToast) {
            addToast({
              title: 'Account Approved!',
              message: 'Your seller account has been verified. Welcome to HinchMart!',
              type: 'success',
            });
          }
          setTimeout(() => {
            navigate('/seller/dashboard');
          }, 1500);
        } else if (oStatus === 'REJECTED' || vStatus === 'REJECTED') {
          setApprovalStatus('REJECTED');
          if (showToast) {
            addToast({
              title: 'Application Rejected',
              message: 'Your application requires revision or was rejected by Admin.',
              type: 'error',
            });
          }
        } else {
          setApprovalStatus('PENDING_REVIEW');
          if (showToast) {
            addToast({
              title: 'Under Review',
              message: 'Your application is still under review by the HinchMart verification team.',
              type: 'info',
            });
          }
        }
      }
    } catch (err) {
      console.warn('Status check notice:', err.message);
      if (showToast) {
        addToast({
          title: 'Status Check',
          message: 'Unable to refresh status at this time. Please try again shortly.',
          type: 'warning',
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus(false);
  }, [sellerId]);

  const handleLogout = async () => {
    try {
      if (authLogout) await authLogout();
      if (storeLogout) storeLogout();
      db.clearAuth();
      navigate('/login');
    } catch (e) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center items-center">
      {/* Background Decorative Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative z-10">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <BrandLogo size="login" theme="light" to="/" />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center space-y-6">
          {/* Status Icon */}
          <div className="relative mx-auto w-20 h-20">
            {approvalStatus === 'APPROVED' ? (
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : approvalStatus === 'REJECTED' ? (
              <div className="w-20 h-20 rounded-full bg-rose-50 border-4 border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
                <AlertCircle className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10 animate-pulse">
                <Clock className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* Heading and Notice */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Verification Status: Pending Admin Approval</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Application Under Review
            </h1>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for registering <strong className="text-slate-900">{companyName}</strong> on HinchMart. 
              Your trade credentials and GST details have been submitted to our compliance team for moderation.
            </p>
          </div>

          {/* Seller Metadata Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-500">
              <span className="font-semibold">Seller ID</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                #{sellerId || 'N/A'}
              </span>
            </div>

            {sellerEmail && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Email</span>
                </span>
                <span className="font-medium text-slate-900">{sellerEmail}</span>
              </div>
            )}

            {sellerPhone && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Number</span>
                </span>
                <span className="font-medium text-slate-900">+91 {String(sellerPhone).replace(/\D/g, '').slice(-10)}</span>
              </div>
            )}
          </div>

          {/* Verification Steps Audit Trail */}
          <div className="space-y-2 text-left bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-xs">
            <h3 className="font-bold text-slate-800 text-[11.5px] uppercase tracking-wider mb-2">
              Onboarding Checklist Status
            </h3>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Step 1: Personal & KYC Details Verified</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Step 2: Business & GST Statutory Filing Saved</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Step 3: Bank Settlement Account Configured</span>
            </div>
            <div className="flex items-center gap-2 text-amber-700 font-semibold">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
              <span>Step 4: Admin Moderation & Approval (Estimated: 2–4 Business Hours)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={() => checkStatus(true)}
              disabled={isChecking}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking Approval Status...' : 'Check Approval Status'}</span>
            </button>

            {approvalStatus === 'APPROVED' && (
              <button
                type="button"
                onClick={() => navigate('/seller/dashboard')}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Seller Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Footer Support */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Need urgent onboarding assistance? Contact{' '}
          <a href="mailto:support@hinchmart.com" className="text-emerald-600 font-bold hover:underline">
            support@hinchmart.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default PendingApprovalPage;
