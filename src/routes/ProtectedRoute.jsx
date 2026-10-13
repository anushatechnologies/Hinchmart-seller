import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSellerAuth } from '../context/SellerAuthContext';
import { useAuthStore } from '../store/authStore';
import { db } from '../mock/db.js';

export function ProtectedRoute({ children, requiredRole = 'SELLER' }) {
  const { user, sellerProfile, loading } = useSellerAuth();
  const { isAuthenticated, user: storeUser } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-lg font-medium">Verifying Seller Authentication...</span>
      </div>
    );
  }

  // 1. Not signed in with Firebase or local session -> Go to login
  if (!user && !isAuthenticated && !storeUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Ensure active seller ID is available
  const activeSellerId = sellerProfile?.sellerId || localStorage.getItem('sellerId') || db.getSeller()?.id || '9';
  if (activeSellerId && !localStorage.getItem('sellerId')) {
    localStorage.setItem('sellerId', String(activeSellerId));
  }

  // 3. Strict Admin Approval Check: Do not navigate to dashboard until approved!
  const isApproved =
    localStorage.getItem('seller_approved') === 'true' ||
    sellerProfile?.verified === true ||
    storeUser?.verified === true ||
    ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(sellerProfile?.verificationStatus || '').toUpperCase()) ||
    ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(sellerProfile?.onboardingStatus || '').toUpperCase()) ||
    ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(storeUser?.verificationStatus || '').toUpperCase()) ||
    ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(storeUser?.onboardingStatus || '').toUpperCase()) ||
    (String(sellerProfile?.role || '').toUpperCase() === 'SELLER' && String(sellerProfile?.onboardingStatus || '').toUpperCase() === 'VERIFIED');

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
}

export default ProtectedRoute;
