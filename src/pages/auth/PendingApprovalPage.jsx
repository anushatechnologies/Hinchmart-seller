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
  CreditCard,
  Shield,
  FileText,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { useAuthStore } from '../../store/authStore';
import { sellerOnboardingService } from '../../services/sellerOnboarding.service';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../mock/db';
import { apiClient, markSellerApiAllowed } from '../../services/apiClient';
import { auth } from '../../config/firebase';

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
    (typeof localStorage !== 'undefined' ? localStorage.getItem('seller_email') : null) ||
    '';

  const sellerPhone =
    sellerProfile?.phone ||
    storeUser?.phone ||
    sellerData?.personalDetails?.phone ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('seller_phone') : null) ||
    '';

  const localSeller = db.getSeller();
  const panNumber =
    localSeller?.panNumber ||
    localSeller?.pan ||
    localSeller?.panCardNumber ||
    localSeller?.legal?.pan ||
    sellerData?.legalDetails?.pan ||
    sellerData?.pan ||
    '';
  const aadhaarNumber =
    localSeller?.aadhaarNumber ||
    localSeller?.aadhaar ||
    localSeller?.legal?.aadhaar ||
    sellerData?.personalDetails?.aadhaar ||
    sellerData?.aadhaar ||
    '';
  const gstin =
    localSeller?.gstin ||
    localSeller?.gst ||
    localSeller?.legal?.gstin ||
    sellerData?.businessTaxDetails?.gstin ||
    sellerData?.gstin ||
    '';

  // Check live approval status from backend and local state
  const checkStatus = async (showToast = true) => {
    const activeId = sellerId || storeUser?.sellerId || db.getSeller()?.id || (typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null);

    setIsChecking(true);
    try {
      // 1. Check local seller registration status
      const currentLocalSeller = db.getSeller();
      const localApproved =
        (typeof localStorage !== 'undefined' && localStorage.getItem('seller_approved') === 'true') ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(currentLocalSeller?.verificationStatus || '').toUpperCase()) ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(currentLocalSeller?.onboardingStatus || '').toUpperCase()) ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(currentLocalSeller?.status || '').toUpperCase()) ||
        Boolean(currentLocalSeller?.verified);

      // 2. Check live backend status through multiple resilient strategies
      let backendApproved = false;
      let oStatus = '';
      let vStatus = '';

      // Strategy A: Refresh Firebase token & verify role via POST /api/auth/sync
      try {
        const currentUser = auth?.currentUser;
        if (currentUser && typeof currentUser.getIdToken === 'function') {
          const freshToken = await currentUser.getIdToken(true);
          const syncRes = await apiClient.post(
            '/api/auth/sync',
            { email: currentUser.email, phone: currentUser.phoneNumber || '' },
            { headers: { Authorization: `Bearer ${freshToken}` }, timeout: 4000 }
          );
          const syncData = syncRes?.data?.data || syncRes?.data;
          if (syncData) {
            const role = String(syncData.role || '').toUpperCase();
            const onboardingStat = String(syncData.onboardingStatus || '').toUpperCase();
            if (role === 'SELLER' || role.includes('SELLER') || onboardingStat === 'VERIFIED' || onboardingStat === 'APPROVED') {
              backendApproved = true;
              if (syncData.accessToken) {
                localStorage.setItem('accessToken', syncData.accessToken);
                localStorage.setItem('sellerToken', syncData.accessToken);
              }
            }
          }
        }
      } catch (_) {}

      // Strategy B: Check seller onboarding summary endpoint if activeId is present
      if (!backendApproved && activeId) {
        try {
          const summary = await sellerOnboardingService.getOnboardingSummary(activeId);
          if (summary) {
            setSellerData(summary);
            oStatus = String(
              summary.onboardingStatus ||
              summary.data?.onboardingStatus ||
              summary.data?.overallStatus ||
              summary.data?.status ||
              ''
            ).toUpperCase();
            vStatus = String(
              summary.verificationStatus ||
              summary.data?.verificationStatus ||
              ''
            ).toUpperCase();

            backendApproved =
              oStatus === 'VERIFIED' ||
              oStatus === 'APPROVED' ||
              oStatus === 'ACTIVE' ||
              vStatus === 'VERIFIED' ||
              vStatus === 'APPROVED' ||
              vStatus === 'ACTIVE';
          }
        } catch (_) {}
      }

      // Strategy C: Probe protected seller API (Spring Boot returns 200 OK once role is ROLE_SELLER)
      if (!backendApproved) {
        try {
          const probeRes = await apiClient.get('/api/seller/products', { params: { limit: 1 }, timeout: 3500 });
          if (probeRes.status === 200) {
            backendApproved = true;
          }
        } catch (_) {}
      }

      const isApproved = backendApproved || localApproved;

      if (isApproved) {
        setApprovalStatus('APPROVED');
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('seller_approved', 'true');
          localStorage.setItem('seller_onboarding_status', 'VERIFIED');
          if (activeId && !localStorage.getItem('sellerId')) {
            localStorage.setItem('sellerId', String(activeId));
          }
        }
        markSellerApiAllowed();
        db.updateSeller({
          verificationStatus: 'VERIFIED',
          onboardingStatus: 'VERIFIED',
          status: 'ACTIVE',
          verified: true,
        });

        if (showToast) {
          addToast({
            title: 'Account Approved!',
            message: 'Your seller account has been approved by admin. Opening Dashboard...',
            type: 'success',
          });
        }

        // Navigate immediately to seller dashboard
        navigate('/seller/dashboard', { replace: true });
        return;
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
            message: 'Your application is awaiting administrator verification.',
            type: 'info',
          });
        }
      }
    } catch (err) {
      console.warn('Status check notice:', err.message);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check approval status immediately on load
    checkStatus(false);

    // Responsive poll every 3 seconds so the moment admin approves, dashboard opens
    const pollInterval = setInterval(() => {
      checkStatus(false);
    }, 3000);

    const handleStorageChange = (e) => {
      if (e.key === 'seller_approved' && e.newValue === 'true') {
        checkStatus(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('hinchmart_seller_approval_sync');
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'SELLER_APPROVED') {
            checkStatus(true);
          }
        };
      }
    } catch (_) {}

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      if (bc) bc.close();
    };
  }, [sellerId]);

  const handleLogout = async () => {
    try {
      if (authLogout) await authLogout();
      if (storeLogout) storeLogout();
      db.clearAuth();
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('seller_approved');
        localStorage.removeItem('seller_onboarding_status');
        localStorage.removeItem('sellerId');
        localStorage.removeItem('seller_company');
        localStorage.removeItem('seller_email');
        localStorage.removeItem('seller_phone');
      }
      navigate('/login');
    } catch (e) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center items-center">
      {/* Background Decorative Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative z-10">
        {/* Header Logo */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <BrandLogo size="login" theme="light" to="/" />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-4 sm:p-8 text-center space-y-5 sm:space-y-6">
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

            {panNumber && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>PAN Card Number</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{panNumber}</span>
              </div>
            )}

            {aadhaarNumber && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Aadhaar Number</span>
                </span>
                <span className="font-mono font-medium text-slate-900">
                  XXXX XXXX {String(aadhaarNumber).replace(/\D/g, '').slice(-4)}
                </span>
              </div>
            )}

            {gstin && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>GSTIN Number</span>
                </span>
                <span className="font-mono font-bold text-emerald-800">{gstin}</span>
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

            {approvalStatus === 'APPROVED' ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('seller_approved', 'true');
                    localStorage.setItem('seller_onboarding_status', 'VERIFIED');
                    if (sellerId && !localStorage.getItem('sellerId')) {
                      localStorage.setItem('sellerId', String(sellerId));
                    }
                  }
                  markSellerApiAllowed();
                  db.updateSeller({
                    verificationStatus: 'VERIFIED',
                    onboardingStatus: 'VERIFIED',
                    status: 'ACTIVE',
                    verified: true,
                  });
                  navigate('/seller/dashboard', { replace: true });
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Seller Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full py-3 px-4 bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                <span>Pending Admin Approval — Dashboard is Locked</span>
              </div>
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
