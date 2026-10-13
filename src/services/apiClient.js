import axios from 'axios';
import { auth } from '../config/firebase.js';
import { db } from '../mock/db.js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
export const API_BASE_URL = env.VITE_API_BASE_URL || 'https://api.hinchmart.com';
export const USE_MOCK_API = env.VITE_USE_MOCK_API === 'true';

// In-memory set of forbidden endpoints for the current session
const forbiddenEndpoints = new Set();

/**
 * Check if a live signed Firebase JWT session exists.
 */
export function hasValidLiveAuth() {
  if (USE_MOCK_API) return false;
  const user = auth?.currentUser;
  if (user) return true;
  const localAuth = db.getAuth();
  if (localAuth?.token && !localAuth.token.startsWith('jwt_seller_') && localAuth.token.length > 50) {
    return true;
  }
  return false;
}

/**
 * Check if seller endpoints are currently marked as forbidden (403) for this session.
 * Never blocks onboarding or authentication endpoints.
 */
export function isSellerApiForbidden(url = '') {
  if (!url) return false;
  // Never block onboarding, auth, or public endpoints
  if (url.includes('/onboarding') || url.includes('/auth/')) {
    return false;
  }
  return false;
}

/**
 * Mark seller API / endpoint as forbidden to prevent redundant 403 network spam.
 */
export function markSellerApiForbidden(url = '') {
  // Do not block onboarding or live backend operations
}

/**
 * Reset forbidden cache when user logs in, switches accounts, or refreshes verification.
 */
export function resetSellerApiPermissions() {
  forbiddenEndpoints.clear();
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('hinch_seller_forbidden');
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('hinch_seller_forbidden');
    localStorage.removeItem('seller_api_allowed');
  }
}

/**
 * Mark seller API permissions as allowed/approved.
 */
export function markSellerApiAllowed() {
  forbiddenEndpoints.clear();
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('hinch_seller_forbidden');
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('hinch_seller_forbidden');
    localStorage.setItem('seller_api_allowed', 'true');
  }
}

/**
 * Check if seller-protected live API can be queried.
 */
export function canAccessSellerApi(url = '') {
  return true;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Deduplicate concurrent in-flight GET requests
const inFlightGets = new Map();
const originalGet = apiClient.get.bind(apiClient);
apiClient.get = function (url, config = {}) {
  const cacheKey = `${url}__${JSON.stringify(config?.params || {})}`;
  if (inFlightGets.has(cacheKey)) {
    return inFlightGets.get(cacheKey);
  }
  const promise = originalGet(url, config)
    .finally(() => {
      inFlightGets.delete(cacheKey);
    });
  inFlightGets.set(cacheKey, promise);
  return promise;
};

// Request Interceptor: Automatically injects live Firebase ID Token & X-Seller-Id
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const user = auth?.currentUser;
      if (user && typeof user.getIdToken === 'function') {
        const firebaseToken = await user.getIdToken();
        if (firebaseToken) {
          config.headers.Authorization = `Bearer ${firebaseToken}`;
        }
      } else {
        const localAuth = db.getAuth();
        if (localAuth?.token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${localAuth.token}`;
        }
      }
    } catch (tokenErr) {
      // Handled silently
    }

    // If uploading FormData, delete Content-Type to let browser set multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Retrieve sellerId stored in localStorage (synced from backend) or DB
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const rawSellerId = storedSellerId || currentSeller?.sellerId || currentSeller?.id;
    let headerSellerId = '9';
    if (typeof rawSellerId === 'number' && rawSellerId > 0 && rawSellerId <= 2147483647) {
      headerSellerId = String(rawSellerId);
    } else if (typeof rawSellerId === 'string') {
      const parsed = parseInt(rawSellerId, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 2147483647) {
        headerSellerId = String(parsed);
      }
    }
    config.headers['X-Seller-Id'] = headerSellerId;

    // Normalize URL path to prevent duplicate /api/api/
    if (config.url) {
      config.url = config.url.replace(/\/api\/api\//g, '/api/');
      if (config.baseURL && config.baseURL.endsWith('/api') && config.url.startsWith('/api/')) {
        config.url = config.url.substring(4);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles 401 Unauthorized / 403 Forbidden
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const reqUrl = originalRequest?.url || '';

    // Handle 403 Forbidden: record permission restriction for seller endpoints
    if (status === 403 && reqUrl.includes('/api/seller/')) {
      markSellerApiForbidden(reqUrl);
    }

    // Handle 401 Unauthorized: token refresh
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/sync') &&
      !originalRequest.url?.includes('/api/seller/store')
    ) {
      const currentUser = auth?.currentUser;
      if (currentUser && typeof currentUser.getIdToken === 'function') {
        try {
          originalRequest._retry = true;
          const newToken = await currentUser.getIdToken(true);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          // Handled silently
        }
      }
    }

    return Promise.reject(error);
  }
);

export const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));
export default apiClient;
