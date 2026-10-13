import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { useAuthStore } from '../../store/authStore';

export const SellerProtectedRoute = ({ children, requiredRole = 'SELLER' }) => {
  const { user, sellerProfile, loading } = useSellerAuth();
  const { isAuthenticated } = useAuthStore();
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
  if (!user && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Signed in, but has not completed Seller Onboarding -> Go to onboarding
  const sellerId = sellerProfile?.sellerId || localStorage.getItem('sellerId');
  if (!sellerId && location.pathname !== '/seller/onboarding') {
    return <Navigate to="/seller/onboarding" replace />;
  }

  // 3. Strict Admin Approval Check: Do not navigate to dashboard until approved!
  const isApproved =
    localStorage.getItem('seller_approved') === 'true' ||
    sellerProfile?.verified === true ||
    ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(sellerProfile?.verificationStatus || '').toUpperCase()) ||
    ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(sellerProfile?.onboardingStatus || '').toUpperCase()) ||
    (String(sellerProfile?.role || '').toUpperCase() === 'SELLER' && String(sellerProfile?.onboardingStatus || '').toUpperCase() === 'VERIFIED');

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  // 4. User is signed in and authorized
  return children;
};

export default SellerProtectedRoute;
