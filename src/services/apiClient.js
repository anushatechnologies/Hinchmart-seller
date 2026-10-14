import axios from 'axios';
import { auth } from '../config/firebase.js';
import { db } from '../mock/db.js';
import { formatNameFromEmail } from '../utils/formatters.js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
export const API_BASE_URL = env.VITE_API_BASE_URL || 'https://api.hinchmart.com';
export const USE_MOCK_API = env.VITE_USE_MOCK_API === 'true';

// Default seller credentials for offline / unauthenticated guest exploration
const DEFAULT_SELLER_EMAIL = 'rajesh.apex7971@hinchmart.com';
const DEFAULT_SELLER_PWD = 'Password@123';
const DEFAULT_SELLER_ID = '16';

let activeSyncPromise = null;

/**
 * Returns the currently stored Spring Boot backend JWT accessToken.
 */
export function getStoredBackendToken() {
  if (typeof localStorage === 'undefined') return null;
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('sellerToken') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('token');
  if (token && typeof token === 'string' && !token.startsWith('jwt_seller_') && token.length > 50 && token.includes('.')) {
    return token;
  }
  return null;
}

/**
 * Exchanges a Firebase ID token for a Spring Boot HS512 JWT accessToken via POST /api/auth/sync.
 */
async function exchangeFirebaseTokenForBackendToken(firebaseToken, profile = {}) {
  try {
    const email = profile.email || auth?.currentUser?.email || db.getAuth()?.user?.email || '';
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const isCleanEmailRajesh = cleanEmail.includes('rajesh');

    let resolvedName = profile.name || auth?.currentUser?.displayName;
    if (!resolvedName || (!isCleanEmailRajesh && /rajesh/i.test(resolvedName))) {
      resolvedName = cleanEmail ? formatNameFromEmail(cleanEmail) : 'Seller Admin';
    }

    const res = await axios.post(
      `${API_BASE_URL}/api/auth/sync`,
      {
        firebaseIdToken: firebaseToken,
        role: 'SELLER',
        email: cleanEmail || undefined,
        name: resolvedName,
        phone: profile.phone || auth?.currentUser?.phoneNumber || db.getAuth()?.user?.phone || undefined,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseToken}`,
        },
        timeout: 15000,
      }
    );

    const data = res.data?.data || res.data;
    const accessToken = data?.accessToken || data?.token;
    if (accessToken && typeof localStorage !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('sellerToken', accessToken);
      localStorage.setItem('authToken', accessToken);
      if (data?.sellerId) {
        localStorage.setItem('sellerId', String(data.sellerId));
      }
    }
    return accessToken || null;
  } catch (err) {
    console.warn('Backend /api/auth/sync exchange failed:', err?.response?.data?.message || err.message);
    return null;
  }
}

/**
 * Guarantees a valid, signed Spring Boot backend JWT token for API requests.
 */
export async function resolveLiveBackendToken(forceRefresh = false) {
  if (USE_MOCK_API) return null;

  if (!forceRefresh) {
    const cached = getStoredBackendToken();
    if (cached) return cached;
  }

  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = (async () => {
    try {
      let fbToken = null;
      let user = auth?.currentUser;

      if (user && typeof user.getIdToken === 'function') {
        fbToken = await user.getIdToken(forceRefresh);
      }

      // Do not auto-sign-in silently if user is logged out

      if (fbToken) {
        const backendToken = await exchangeFirebaseTokenForBackendToken(fbToken, {
          email: user?.email,
          name: user?.displayName,
          phone: user?.phoneNumber,
        });
        if (backendToken) return backendToken;
      }

      return getStoredBackendToken();
    } finally {
      activeSyncPromise = null;
    }
  })();

  return activeSyncPromise;
}

/**
 * Check if a live signed backend session exists.
 */
export function hasValidLiveAuth() {
  if (USE_MOCK_API) return false;
  return Boolean(getStoredBackendToken() || auth?.currentUser);
}

export function isSellerApiForbidden(url = '') {
  return false;
}

export function markSellerApiForbidden(url = '') {}

export function resetSellerApiPermissions() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('hinch_seller_forbidden');
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('hinch_seller_forbidden');
  }
}

export function markSellerApiAllowed() {}

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

// Request Interceptor: Automatically injects valid Spring Boot JWT accessToken & X-Seller-Id
apiClient.interceptors.request.use(
  async (config) => {
    // If request already has authorization header, preserve it
    if (!config.headers.Authorization) {
      try {
        const token = await resolveLiveBackendToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (tokenErr) {
        // Silently proceed
      }
    }

    // If uploading FormData, delete Content-Type to let browser set multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Retrieve sellerId stored in localStorage (synced from backend) or DB
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const rawSellerId = storedSellerId || currentSeller?.sellerId || currentSeller?.id || DEFAULT_SELLER_ID;
    let headerSellerId = DEFAULT_SELLER_ID;
    if (typeof rawSellerId === 'number' && rawSellerId > 0 && rawSellerId <= 2147483647) {
      headerSellerId = String(rawSellerId);
    } else if (typeof rawSellerId === 'string') {
      const clean = rawSellerId.replace(/^seller_/, '');
      const parsed = parseInt(clean, 10);
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

// Response Interceptor: Handles 401 Unauthorized with silent token re-exchange
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const reqUrl = originalRequest?.url || '';

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !reqUrl.includes('/api/auth/sync')
    ) {
      originalRequest._retry = true;
      try {
        const refreshedToken = await resolveLiveBackendToken(true);
        if (refreshedToken) {
          originalRequest.headers['Authorization'] = `Bearer ${refreshedToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        // Fall through
      }
    }

    return Promise.reject(error);
  }
);

export const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));
export default apiClient;
