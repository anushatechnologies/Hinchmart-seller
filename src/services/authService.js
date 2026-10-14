import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '../firebase/firebaseConfig.js';
import { apiClient, delay, USE_MOCK_API, hasValidLiveAuth } from './apiClient.js';
import { db } from '../mock/db.js';
import { formatNameFromEmail } from '../utils/formatters.js';

export const authService = {
  /**
   * 1. Register seller with Firebase Email & Password + Backend User Sync
   */
  async registerSellerWithEmail(email, password, fullName, phone) {
    let firebaseUser = null;
    let token = null;

    if (auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        token = await firebaseUser.getIdToken();
      } catch (fbErr) {
        // Handled silently for offline / local-first dev accounts
      }
    }

    // Sync with backend database: POST /api/auth/sync
    let syncData = null;
    if (token && !USE_MOCK_API) {
      try {
        syncData = await this.syncUserWithBackend(fullName, phone);
      } catch (syncErr) {
        // Handled silently
      }
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    const sellerId = syncData?.sellerId || (cleanPhone ? `seller_${cleanPhone}` : `seller_${Date.now()}`);
    const sellerName = fullName || syncData?.name || (email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Authorized Seller');
    const companyName = `${sellerName} Enterprise`;

    const authData = {
      isAuthenticated: true,
      user: {
        id: sellerId,
        sellerId: sellerId,
        name: sellerName,
        fullName: sellerName,
        email: email || syncData?.email || '',
        phone: phone || syncData?.phone || (cleanPhone ? `+91 ${cleanPhone}` : '+91 98201 54321'),
        role: syncData?.role || 'SELLER_ADMIN',
        companyName: companyName,
      },
      token: token || 'jwt_seller_' + Math.random().toString(36).substring(2),
    };

    db.setAuth(authData);
    db.updateSeller({
      id: sellerId,
      sellerId: sellerId,
      name: sellerName,
      fullName: sellerName,
      email: email,
      phone: authData.user.phone,
      mobile: cleanPhone,
      companyName: companyName,
      companyEmail: email,
    });

    return {
      success: true,
      user: authData.user,
      sellerId: sellerId,
      token: authData.token,
      syncData,
    };
  },

  /**
   * 2. Login seller with Firebase Email & Password
   */
  async loginSellerWithEmail(email, password) {
    if (!email || !email.trim()) {
      const err = new Error('Business email address is required.');
      err.code = 'auth/invalid-credential';
      throw err;
    }

    if (!password) {
      const err = new Error('Password is required.');
      err.code = 'auth/wrong-password';
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();
    let firebaseUser = null;
    let token = null;
    let firebaseAuthSuccess = false;

    if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        firebaseUser = userCredential.user;
        token = await firebaseUser.getIdToken();
        firebaseAuthSuccess = true;
      } catch (fbErr) {
        // If Firebase explicitly detects a wrong password, reject with clear password message
        if (fbErr.code === 'auth/wrong-password') {
          const err = new Error('Incorrect password. Please retry or click Forgot Password.');
          err.code = 'auth/wrong-password';
          throw err;
        }

        // If user does not exist in Firebase, verify against local database
        if (fbErr.code === 'auth/user-not-found') {
          const matchedSeller = db.getSellerByEmail(cleanEmail);
          if (matchedSeller && matchedSeller.password && matchedSeller.password !== password) {
            const err = new Error('Incorrect password. Please retry or click Forgot Password.');
            err.code = 'auth/wrong-password';
            throw err;
          }
          if (!matchedSeller) {
            const err = new Error('No registered account found with this email. Please click Register to create a seller account.');
            err.code = 'auth/user-not-found';
            throw err;
          }
        }

        // Modern Firebase returns auth/invalid-credential for wrong passwords (enumeration protection)
        if (
          fbErr.code === 'auth/invalid-credential' ||
          fbErr.code === 'auth/invalid-login-credentials'
        ) {
          const matchedSeller = db.getSellerByEmail(cleanEmail);
          if (matchedSeller && matchedSeller.password && matchedSeller.password === password) {
            // Local password matched
          } else {
            const err = new Error('Incorrect password. Please check your password or click Forgot Password to reset.');
            err.code = 'auth/wrong-password';
            throw err;
          }
        }
      }
    }

    // Lookup seller profile by email
    const matchedSeller = db.getSellerByEmail(cleanEmail);

    if (!firebaseAuthSuccess) {
      if (!matchedSeller) {
        const err = new Error('Incorrect password. Please check your credentials or click Forgot Password to reset.');
        err.code = 'auth/wrong-password';
        throw err;
      }

      // Strict password check for registered account
      if (matchedSeller.password && matchedSeller.password !== password) {
        const err = new Error('Incorrect password. Please retry or click Forgot Password.');
        err.code = 'auth/wrong-password';
        throw err;
      }
    }

    const emailPrefixName = formatNameFromEmail(cleanEmail);
    const isCleanEmailRajesh = cleanEmail.includes('rajesh');

    const sanitizeName = (n) => {
      if (!n || typeof n !== 'string') return null;
      const trimmed = n.trim();
      if (!isCleanEmailRajesh && /rajesh/i.test(trimmed)) return null;
      if (trimmed === 'Seller Admin' || trimmed === 'Authorized Seller') return null;
      return trimmed;
    };

    let userDetails = null;
    let syncData = null;
    if (token && !USE_MOCK_API) {
      try {
        const candidateSyncName =
          sanitizeName(firebaseUser?.displayName) ||
          sanitizeName(matchedSeller?.fullName) ||
          sanitizeName(matchedSeller?.name) ||
          emailPrefixName;

        syncData = await this.syncUserWithBackend(
          candidateSyncName,
          matchedSeller?.phone || matchedSeller?.mobile
        );
      } catch (syncErr) {
        // Handled silently
      }

      try {
        userDetails = await this.fetchCurrentUserDetails();
      } catch (meErr) {
        // Handled silently
      }
    }

    const sellerName =
      sanitizeName(firebaseUser?.displayName) ||
      sanitizeName(userDetails?.name) ||
      sanitizeName(syncData?.name) ||
      sanitizeName(matchedSeller?.fullName) ||
      sanitizeName(matchedSeller?.name) ||
      emailPrefixName;

    const companyName =
      (userDetails?.companyName && (isCleanEmailRajesh || !/rajesh/i.test(userDetails.companyName)) ? userDetails.companyName : null) ||
      (matchedSeller?.companyName && (isCleanEmailRajesh || !/rajesh/i.test(matchedSeller.companyName)) && matchedSeller.companyName !== 'Registered Enterprise' ? matchedSeller.companyName : null) ||
      `${sellerName} Enterprise`;

    const sellerPhone =
      syncData?.phone ||
      userDetails?.phone ||
      matchedSeller?.phone ||
      matchedSeller?.mobile ||
      '+91 98201 54321';

    const cleanMobile = String(sellerPhone).replace(/\D/g, '').slice(-10);
    const resolvedRawId =
      syncData?.sellerId ||
      userDetails?.sellerId ||
      matchedSeller?.sellerId ||
      matchedSeller?.id ||
      (cleanMobile ? `seller_${cleanMobile}` : (firebaseUser?.uid ? `seller_${firebaseUser.uid.substring(0, 10)}` : `seller_${Date.now()}`));

    const cleanSellerId = String(resolvedRawId).replace(/^seller_/, '');
    const sellerId = cleanSellerId || (cleanMobile ? cleanMobile : `${Date.now()}`);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sellerId', String(sellerId));
    }

    const authData = {
      isAuthenticated: true,
      user: {
        id: sellerId,
        sellerId: sellerId,
        name: sellerName,
        fullName: sellerName,
        email: cleanEmail,
        phone: sellerPhone,
        role: syncData?.role || userDetails?.role || matchedSeller?.role || 'SELLER_ADMIN',
        companyName: companyName,
      },
      token: token || db.getAuth()?.token || 'jwt_seller_' + Math.random().toString(36).substring(2),
    };

    db.setAuth(authData);

    const updatedSeller = {
      ...(matchedSeller || {}),
      id: sellerId,
      sellerId: sellerId,
      name: sellerName,
      fullName: sellerName,
      companyName: companyName,
      email: cleanEmail,
      phone: sellerPhone,
      mobile: cleanMobile,
    };
    db.updateSeller(updatedSeller);

    return {
      success: true,
      user: authData.user,
      sellerId: sellerId,
      token: authData.token,
      data: syncData || userDetails || updatedSeller,
    };
  },

  /**
   * 3. Logout Seller (Endpoint 5: POST /api/auth/logout)
   */
  async logoutSeller() {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      // Backend logout is best-effort
    }

    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase SignOut notice:', err.message);
      }
    }
    if (typeof db.logout === 'function') {
      db.logout();
    } else if (typeof db.clearAuth === 'function') {
      db.clearAuth();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('sellerUser');
      localStorage.removeItem('sellerId');
      localStorage.removeItem('hinchmart_auth');
      localStorage.removeItem('hinchmart_seller');
      localStorage.removeItem('seller_approved');
      localStorage.removeItem('seller_role');
      localStorage.removeItem('seller_onboarding_status');
    }
    try {
      const { resetSellerApiPermissions } = await import('./apiClient.js');
      if (typeof resetSellerApiPermissions === 'function') resetSellerApiPermissions();
    } catch (_) {}
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('hinchmart_onboarding_seller_id');
      sessionStorage.removeItem('otp_phone');
      sessionStorage.removeItem('mock_otp');
    }
    return { success: true };
  },

  /**
   * 4. Get Current Firebase User
   */
  getCurrentFirebaseUser() {
    return auth?.currentUser || null;
  },

  /**
   * 5. Get Firebase ID Token (with optional force refresh)
   */
  async getFirebaseIdToken(forceRefresh = false) {
    const user = auth?.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      return await user.getIdToken(forceRefresh);
    }
    return db.getAuth()?.token || null;
  },

  /**
   * 6. POST /api/auth/sync (Endpoint 2)
   * Synchronizes Firebase user with backend MySQL database and returns Spring Boot JWT accessToken
   */
  async syncUserWithBackend(name, phone) {
    try {
      const user = auth?.currentUser;
      const fbToken = user ? await user.getIdToken() : null;
      const cleanPhone = phone ? (phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`) : undefined;
      const userEmail = user?.email || db.getAuth()?.user?.email || '';
      const fallbackCleanName = formatNameFromEmail(userEmail);
      
      const payload = {
        firebaseIdToken: fbToken || undefined,
        role: 'SELLER',
        email: userEmail || undefined,
        name: name || user?.displayName || fallbackCleanName,
        phone: cleanPhone || user?.phoneNumber || undefined,
      };

      const response = await apiClient.post('/api/auth/sync', payload, {
        headers: fbToken ? { Authorization: `Bearer ${fbToken}` } : {},
      });
      const data = response.data?.data || response.data;
      if (data) {
        if (data.accessToken && typeof localStorage !== 'undefined') {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('sellerToken', data.accessToken);
          localStorage.setItem('authToken', data.accessToken);
          if (data.sellerId) {
            localStorage.setItem('sellerId', String(data.sellerId));
          }
        }
        return data;
      }
    } catch (err) {
      console.warn('Backend /api/auth/sync notice:', err?.response?.data?.message || err.message);
    }

    await delay(150);
    const currentUser = auth?.currentUser;
    const currentAuthUser = db.getAuth()?.user;
    const userEmail = currentUser?.email || currentAuthUser?.email || '';
    const resolvedFallbackName = name || currentUser?.displayName || formatNameFromEmail(userEmail);

    return {
      userId: currentAuthUser?.id || 109,
      firebaseUid: currentUser?.uid || 'seller_' + Date.now(),
      email: userEmail,
      name: resolvedFallbackName,
      phone: phone || currentUser?.phoneNumber || currentAuthUser?.phone || '',
      role: 'SELLER',
      sellerId: currentAuthUser?.sellerId || (typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null) || 16,
      claims: { role: 'SELLER' },
    };
  },

  /**
   * 7. GET /api/auth/me (Endpoint 3) - Current Authenticated User Profile
   */
  async fetchCurrentUserDetails() {
    try {
      const response = await apiClient.get('/api/auth/me');
      const data = response.data?.data || response.data;
      if (data && (data.userId || data.sellerId || data.customerId)) {
        const resolvedSellerId = data.sellerId || data.userId || 16;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sellerId', String(resolvedSellerId));
        }
        return {
          userId: data.userId || data.customerId,
          sellerId: resolvedSellerId,
          storeId: resolvedSellerId,
          firebaseUid: data.firebaseUid,
          email: data.email,
          name: data.name,
          fullName: data.name,
          phone: data.phone,
          role: data.role || 'SELLER',
          claims: data.claims || { role: data.role },
          isProfileComplete: data.isProfileComplete ?? true,
        };
      }
    } catch (err) {
      console.warn('Backend /api/auth/me notice (using fallback):', err?.response?.data?.message || err.message);
    }

    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const authState = db.getAuth();
    const seller = db.getSeller();
    const rawId = storedSellerId || authState?.user?.sellerId || seller?.sellerId || seller?.id;
    const cleanId = String(rawId || '').replace(/^seller_/, '');
    const resolvedSellerId = Number(cleanId) || 16;

    const currentUser = auth?.currentUser;
    const resolvedEmail = currentUser?.email || authState?.user?.email || seller?.email || 'seller@hinchmart.com';
    const resolvedName =
      currentUser?.displayName ||
      authState?.user?.name ||
      seller?.fullName ||
      seller?.name ||
      (resolvedEmail ? resolvedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Authorized Seller');
    const resolvedPhone = currentUser?.phoneNumber || seller?.phone || authState?.user?.phone || '+919848054013';

    return {
      userId: resolvedSellerId,
      sellerId: resolvedSellerId,
      storeId: resolvedSellerId,
      firebaseUid: currentUser?.uid || 'seller_uid',
      email: resolvedEmail,
      name: resolvedName,
      fullName: resolvedName,
      companyName: seller?.companyName || `${resolvedName} Enterprise`,
      phone: resolvedPhone,
      role: 'SELLER',
      status: seller?.status || 'ACTIVE',
      claims: { role: 'SELLER' },
      isProfileComplete: true,
    };
  },

  /**
   * 8. POST /api/auth/refresh-token (Endpoint 4) - Session Refresh / Token Re-evaluation
   */
  async refreshSession() {
    try {
      const res = await apiClient.post('/api/auth/refresh-token');
      const data = res.data?.data || res.data;
      if (data) return data;
    } catch (err) {
      console.warn('POST /api/auth/refresh-token notice (re-syncing via Firebase ID token):', err.message);
    }

    // Phase 3 Flow: Retrieve fresh Firebase ID Token silently and call POST /api/auth/sync
    const refreshedToken = await resolveLiveBackendToken(true);
    if (refreshedToken) {
      return await this.fetchCurrentUserDetails();
    }
    return null;
  },

  /**
   * 9. POST /api/auth/claim-admin (Endpoint 6) - Claim Admin Role
   */
  async claimAdminRole() {
    const res = await apiClient.post('/api/auth/claim-admin');
    return res.data?.data || res.data;
  },

  /**
   * 10. Post-Approval Role Verification & Custom Claims Refresh
   */
  async refreshSellerRole() {
    try {
      if (auth?.currentUser && typeof auth.currentUser.getIdToken === 'function') {
        await auth.currentUser.getIdToken(true);
      }
      const meData = await this.fetchCurrentUserDetails();
      const isSeller = meData?.role === 'SELLER' || meData?.claims?.role === 'SELLER';
      return {
        isSeller,
        role: meData?.role || 'SELLER',
        sellerId: meData?.sellerId || 16,
        data: meData,
      };
    } catch (err) {
      console.warn('refreshSellerRole notice:', err.message);
      return { isSeller: true, role: 'SELLER', sellerId: 16 };
    }
  },
};

export default authService;
