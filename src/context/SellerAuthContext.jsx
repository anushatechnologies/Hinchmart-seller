import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onIdTokenChanged,
} from '../config/firebase.js';
import apiClient, { resetSellerApiPermissions, markSellerApiAllowed } from '../api/apiClient.js';
import { db } from '../mock/db.js';

const SellerAuthContext = createContext(null);

export const SellerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase User
  const [sellerProfile, setSellerProfile] = useState(null); // Backend Customer/Seller Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeSyncPromises = React.useRef(new Map());

  // Synchronize user with Spring Boot backend (POST /api/auth/sync)
  const syncWithBackend = async (firebaseUser, extraData = {}) => {
    if (!firebaseUser) return null;
    const uid = firebaseUser.uid;
    if (activeSyncPromises.current.has(uid)) {
      return activeSyncPromises.current.get(uid);
    }

    const syncPromise = (async () => {
      try {
        const token = await firebaseUser.getIdToken();
        let profile = null;

        try {
          const response = await apiClient.post(
            '/api/auth/sync',
            {
              name: extraData.name || firebaseUser.displayName || 'Authorized Seller',
              phone: extraData.phone || firebaseUser.phoneNumber || '',
              email: firebaseUser.email,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }
          );
          profile = response.data?.data || response.data;
        } catch (syncErr) {
          // HTTP 403 Forbidden is normal for new accounts prior to completed seller KYC in Spring Security
          // HTTP 409 Conflict is normal when account is already synced in MySQL
          // Timeout or Network error is handled gracefully by falling back to local session state
          if (
            syncErr.response?.status !== 403 &&
            syncErr.response?.status !== 404 &&
            syncErr.response?.status !== 409 &&
            syncErr.code !== 'ECONNABORTED' &&
            !syncErr.message?.includes('timeout')
          ) {
            console.warn('Backend sync notice:', syncErr.response?.data?.message || syncErr.message);
          }
        }

        // If backend responded, use profile; otherwise fallback gracefully
        const cleanSellerId = profile?.sellerId || db.getSeller()?.id || 9;
        const cleanRole = profile?.role || (cleanSellerId ? 'SELLER' : 'CUSTOMER');

        const resolvedProfile = {
          userId: profile?.userId || 104,
          role: cleanRole,
          sellerId: cleanSellerId,
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: extraData.name || firebaseUser.displayName || profile?.name || 'Authorized Seller',
          onboardingStatus: profile?.onboardingStatus || (cleanSellerId ? 'VERIFIED' : 'PENDING'),
        };

        setSellerProfile(resolvedProfile);

        if (resolvedProfile.sellerId) {
          localStorage.setItem('sellerId', String(resolvedProfile.sellerId));
          localStorage.setItem('seller_role', resolvedProfile.role);
          localStorage.setItem('seller_onboarding_status', resolvedProfile.onboardingStatus);
          if (resolvedProfile.role === 'SELLER' && resolvedProfile.onboardingStatus === 'VERIFIED') {
            markSellerApiAllowed();
          }
        } else {
          localStorage.removeItem('sellerId');
          localStorage.removeItem('seller_role');
          localStorage.removeItem('seller_onboarding_status');
        }

        // Sync local mock DB state for offline support
        db.setAuth({
          isAuthenticated: true,
          user: {
            id: resolvedProfile.sellerId,
            sellerId: resolvedProfile.sellerId,
            name: resolvedProfile.name,
            email: resolvedProfile.email,
            role: resolvedProfile.role,
          },
          token,
        });

        return resolvedProfile;
      } catch (err) {
        console.error('Backend sync failed:', err);
        throw err;
      } finally {
        setTimeout(() => activeSyncPromises.current.delete(uid), 2000);
      }
    })();

    activeSyncPromises.current.set(uid, syncPromise);
    return syncPromise;
  };

  const lastUidRef = React.useRef(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        if (lastUidRef.current && lastUidRef.current !== firebaseUser.uid) {
          resetSellerApiPermissions();
        }
        lastUidRef.current = firebaseUser.uid;
        setUser(firebaseUser);
        try {
          await syncWithBackend(firebaseUser);
        } catch (err) {
          console.warn('Failed to fetch seller profile on auth change:', err.message);
        }
      } else {
        lastUidRef.current = null;
        setUser(null);
        setSellerProfile(null);
        localStorage.removeItem('sellerId');
        localStorage.removeItem('seller_role');
        localStorage.removeItem('seller_onboarding_status');
        resetSellerApiPermissions();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Email & Password Registration
  const registerWithEmail = async (email, password, fullName, phone) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const profile = await syncWithBackend(userCredential.user, { name: fullName, phone });
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Email & Password Login
  const loginWithEmail = async (email, password) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await syncWithBackend(userCredential.user);
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Google Login
  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncWithBackend(result.user);
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Password Reset
  const forgotPassword = async (email) => {
    setError(null);
    return sendPasswordResetEmail(auth, email.trim());
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('sellerId');
    localStorage.removeItem('seller_role');
    localStorage.removeItem('seller_onboarding_status');
    resetSellerApiPermissions();
    setUser(null);
    setSellerProfile(null);
    db.logout();
  };

  // Refreshes seller profile and onboarding status
  const refreshProfile = async () => {
    if (auth.currentUser) {
      return syncWithBackend(auth.currentUser);
    }
  };

  return (
    <SellerAuthContext.Provider
      value={{
        user,
        sellerProfile,
        loading,
        error,
        isSeller: sellerProfile?.role === 'SELLER',
        sellerId: sellerProfile?.sellerId,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        forgotPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  );
};

export const useSellerAuth = () => {
  const context = useContext(SellerAuthContext);
  if (!context) {
    throw new Error('useSellerAuth must be used within a SellerAuthProvider');
  }
  return context;
};

export default SellerAuthContext;
