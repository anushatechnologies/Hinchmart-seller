import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, onAuthStateChanged } from '../firebase/firebaseConfig';
import { authService } from '../services/authService';
import { db } from '../mock/db';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const initialAuth = db.getAuth();
  const [user, setUser] = useState(initialAuth?.user || null);
  const [token, setToken] = useState(initialAuth?.token || null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialAuth?.isAuthenticated && initialAuth?.user));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize authentication state on initial mount & Firebase changes
  useEffect(() => {
    let unsubscribe = () => {};

    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
        setFirebaseUser(currentFbUser);
        if (currentFbUser) {
          try {
            const idToken = await currentFbUser.getIdToken();
            setToken(idToken);

            // Fetch verified backend user role & sellerId
            const backendUser = await authService.fetchCurrentUserDetails();
            const activeUser = {
              id: backendUser.sellerId || backendUser.userId || '9',
              sellerId: backendUser.sellerId || '9',
              name: backendUser.name || currentFbUser.displayName || 'Authorized Seller',
              email: currentFbUser.email,
              phone: backendUser.phone || '',
              role: backendUser.role || 'SELLER_ADMIN',
              companyName: backendUser.companyName || `${backendUser.name || 'Seller'} Enterprise`,
              claims: backendUser.claims || {},
            };

            setUser(activeUser);
            setIsAuthenticated(true);
            db.setAuth({ isAuthenticated: true, user: activeUser, token: idToken });
          } catch (syncErr) {
            // Local state preservation
          }
        } else {
          // If not logged into Firebase, inspect local storage auth session
          const localAuth = db.getAuth();
          if (localAuth?.isAuthenticated && localAuth?.user) {
            setUser(localAuth.user);
            setToken(localAuth.token);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
          }
        }
        setIsLoading(false);
      });
    } else {
      const localAuth = db.getAuth();
      if (localAuth?.isAuthenticated && localAuth?.user) {
        setUser(localAuth.user);
        setToken(localAuth.token);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  /**
   * 1. Login with Email & Password
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.loginSellerWithEmail(email, password);
      setUser(result.user);
      setToken(result.token);
      setIsAuthenticated(true);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  /**
   * 2. Register with Email & Password + Backend Sync
   */
  const register = useCallback(async (email, password, fullName, phone) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.registerSellerWithEmail(email, password, fullName, phone);
      setUser(result.user);
      setToken(result.token);
      setIsAuthenticated(true);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  /**
   * 3. Refresh Seller Role & Custom Claims after Admin Approval
   */
  const refreshRole = useCallback(async () => {
    try {
      const res = await authService.refreshSellerRole();
      if (res?.data) {
        setUser((prev) => ({
          ...prev,
          role: res.role,
          sellerId: res.sellerId,
        }));
      }
      return res;
    } catch (err) {
      console.warn('Role refresh notice:', err.message);
      return null;
    }
  }, []);

  /**
   * 4. Logout Seller
   */
  const logout = useCallback(async () => {
    await authService.logoutSeller();
    setUser(null);
    setToken(null);
    setFirebaseUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const value = {
    user,
    token,
    firebaseUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    refreshRole,
    logout,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
