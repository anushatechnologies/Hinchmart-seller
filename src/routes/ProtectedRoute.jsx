import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSellerAuth } from '../context/SellerAuthContext';
import { useAuthStore } from '../store/authStore';
import { db } from '../mock/db.js';

export function ProtectedRoute({ children, requiredRole = 'SELLER' }) {
  const { user, sellerProfile, loading } = useSellerAuth();
  const { isAuthenticated, user: storeUser } = useAuthStore();
  const location = useLocation();

  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Only show blocking loading screen if neither Firebase nor local session is ready, and before timeout
  const hasLocalSession = Boolean(isAuthenticated || storeUser || localStorage.getItem('sellerId'));
  if (loading && !timedOut && !hasLocalSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-lg font-medium">Verifying Seller Authentication...</span>
      </div>
    );
  }

  // 1. Not signed in with Firebase or local session -> Go to login
  if (!user && !isAuthenticated && !storeUser && !localStorage.getItem('sellerId')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Ensure active seller ID is available
  const activeSellerId = sellerProfile?.sellerId || storeUser?.sellerId || localStorage.getItem('sellerId') || db.getSeller()?.id;
  if (activeSellerId && !localStorage.getItem('sellerId')) {
    localStorage.setItem('sellerId', String(activeSellerId));
  }

  // 3. Admin Approval Check: Strictly verify approval status
  const isExplicitlyPending =
    localStorage.getItem('seller_approved') === 'false' ||
    ['PENDING', 'PENDING_REVIEW'].includes(String(sellerProfile?.verificationStatus || storeUser?.verificationStatus || '').toUpperCase());

  const isApproved =
    !isExplicitlyPending && (
      localStorage.getItem('seller_approved') === 'true' ||
      sellerProfile?.verified === true ||
      storeUser?.verified === true ||
      ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(sellerProfile?.verificationStatus || '').toUpperCase()) ||
      ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(sellerProfile?.onboardingStatus || '').toUpperCase()) ||
      ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(sellerProfile?.status || '').toUpperCase()) ||
      ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(storeUser?.verificationStatus || '').toUpperCase()) ||
      ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(storeUser?.onboardingStatus || '').toUpperCase()) ||
      ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(storeUser?.status || '').toUpperCase())
    );

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
}

export default ProtectedRoute;
