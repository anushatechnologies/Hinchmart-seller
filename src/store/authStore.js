import { create } from 'zustand';
import { db } from '../mock/db';
import { authService } from '../services/auth.service';

const initialAuth = db.getAuth();

export const useAuthStore = create((set, get) => ({
  user: initialAuth?.user || null,
  token: initialAuth?.token || null,
  isAuthenticated: Boolean(initialAuth?.isAuthenticated && initialAuth?.user),
  onboardingSellerId: sessionStorage.getItem('hinchmart_onboarding_seller_id') || null,
  isLoading: false,
  error: null,

  setOnboardingSellerId: (sellerId) => {
    if (sellerId) {
      sessionStorage.setItem('hinchmart_onboarding_seller_id', String(sellerId));
    } else {
      sessionStorage.removeItem('hinchmart_onboarding_seller_id');
    }
    set({ onboardingSellerId: sellerId });
  },

  clearOnboardingSellerId: () => {
    sessionStorage.removeItem('hinchmart_onboarding_seller_id');
    set({ onboardingSellerId: null });
  },

  checkAccountExists: async (mobileNumber) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.checkAccountExists(mobileNumber);
      set({ isLoading: false });
      return res;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  sendOtp: async (mobileNumber, appVerifier = null) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.sendOtp(mobileNumber, appVerifier);
      set({ isLoading: false });
      return res;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  verifyOtp: async ({ phone, otp, confirmationResult = null }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.verifyOtp({ phone, otp, confirmationResult });
      if (res.exists && res.user) {
        set({
          isAuthenticated: true,
          user: res.user,
          token: res.token,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
      return res;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (regData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(regData);
      set({
        isAuthenticated: true,
        user: data.user,
        token: data.token,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  registerWithEmail: async (email, password, fullName, phone) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.registerSellerWithEmail(email, password, fullName, phone);
      set({
        isAuthenticated: true,
        user: data.user,
        token: data.token,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.loginSellerWithEmail(credentials.email, credentials.password);
      set({
        isAuthenticated: true,
        user: data.user,
        token: data.token,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  loginWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.loginSellerWithEmail(email, password);
      set({
        isAuthenticated: true,
        user: data.user,
        token: data.token,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  refreshRole: async () => {
    try {
      const res = await authService.refreshSellerRole();
      if (res?.data) {
        set((prev) => ({
          user: {
            ...prev.user,
            role: res.role,
            sellerId: res.sellerId,
          },
        }));
      }
      return res;
    } catch (err) {
      console.warn('Refresh role error:', err);
      return null;
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
