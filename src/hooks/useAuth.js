import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useAuthStore } from '../store/authStore';

/**
 * useAuth Hook
 * Provides seamless access to authentication context, session state,
 * Firebase user, and login/register/logout actions.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  const store = useAuthStore();

  // If AuthProvider is mounted in tree, return context; otherwise fall back to Zustand store
  if (context) {
    return context;
  }

  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.loginWithEmail || store.login,
    register: store.registerWithEmail || store.register,
    refreshRole: store.refreshRole,
    logout: store.logout,
    clearError: store.clearError,
  };
}

export default useAuth;
