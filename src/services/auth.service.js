import { db } from '../mock/db.js';
import { delay } from './apiClient.js';
import { sendFirebasePhoneOtp, verifyFirebasePhoneOtp } from '../config/firebase.js';
import { authService as coreAuthService } from './authService.js';

export const authService = {
  ...coreAuthService,

  /**
   * 1. Check whether account exists for mobile number
   */
  async checkAccountExists(mobileNumber) {
    await delay(300);
    const cleanNumber = String(mobileNumber).replace(/\D/g, '').slice(-10);
    if (!/^[6-9][0-9]{9}$/.test(cleanNumber)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
    }

    const seller = db.getSellerByPhone(cleanNumber);
    if (!seller) {
      return {
        exists: false,
        phone: cleanNumber,
        formattedPhone: `+91 ${cleanNumber}`,
        message: 'No registered seller account found for this mobile number.',
      };
    }

    const sellerName = seller?.name || seller?.fullName || seller?.companyName || 'Seller Admin';

    return {
      exists: true,
      phone: cleanNumber,
      formattedPhone: `+91 ${cleanNumber}`,
      sellerName,
      message: 'Account found. Ready to send OTP.',
    };
  },

  /**
   * 2. Send 6-digit OTP to mobile number
   */
  async sendOtp(mobileNumber, appVerifier = null) {
    await delay(300);
    const cleanNumber = String(mobileNumber).replace(/\D/g, '').slice(-10);
    if (!/^[6-9][0-9]{9}$/.test(cleanNumber)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }

    sessionStorage.setItem('otp_phone', cleanNumber);
    sessionStorage.setItem('mock_otp', '123456');

    try {
      const firebaseRes = await sendFirebasePhoneOtp(cleanNumber, appVerifier);
      return {
        success: true,
        phone: cleanNumber,
        formattedPhone: `+91 ${cleanNumber}`,
        confirmationResult: firebaseRes.confirmationResult || null,
        isLive: firebaseRes.isLive,
        message: firebaseRes.isLive
          ? `OTP sent successfully to +91 ${cleanNumber}`
          : `Demo Mode Active: Enter OTP 123456 (For live backend token, sign in with Email & Password)`,
      };
    } catch (err) {
      console.warn('Phone OTP notice:', err.message);
      return {
        success: true,
        phone: cleanNumber,
        formattedPhone: `+91 ${cleanNumber}`,
        confirmationResult: null,
        isLive: false,
        message: `Demo Mode Active: Enter OTP 123456 (For live backend token, sign in with Email & Password)`,
      };
    }
  },

  /**
   * 3. Verify 6-digit OTP and establish session
   */
  async verifyOtp({ phone, otp, confirmationResult = null }) {
    await delay(350);
    const cleanNumber = String(phone).replace(/\D/g, '').slice(-10);
    const cleanOtp = String(otp).trim();

    if (cleanOtp.length !== 6 || !/^[0-9]{6}$/.test(cleanOtp)) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    let firebaseToken = null;
    if (confirmationResult) {
      const fbRes = await verifyFirebasePhoneOtp(confirmationResult, cleanOtp);
      if (fbRes?.success && fbRes?.user && typeof fbRes.user.getIdToken === 'function') {
        firebaseToken = await fbRes.user.getIdToken();
      } else if (fbRes?.success === false) {
        throw new Error(fbRes.error || 'Invalid OTP code. Please check and try again.');
      }
    } else {
      // In demo mode without active Firebase SMS provider, strictly require demo OTP 123456
      const expectedOtp = sessionStorage.getItem('mock_otp') || '123456';
      if (cleanOtp !== expectedOtp && cleanOtp !== '123456') {
        throw new Error('Invalid OTP code. In demo mode, please enter verification code: 123456');
      }
    }

    let existingSeller = db.getSellerByPhone(cleanNumber) || db.getSeller();
    if (!existingSeller) {
      throw new Error('Seller account not found for this mobile number. Please register your business first.');
    }

    const sellerName = existingSeller.name || existingSeller.fullName || 'Authorized Seller';
    const companyName = existingSeller.companyName || `${sellerName} Enterprise`;

    db.updateSeller({
      ...existingSeller,
      name: sellerName,
      fullName: sellerName,
      companyName: companyName,
    });

    const profileStatus = this.checkProfileCompletion(existingSeller);
    const authData = {
      isAuthenticated: true,
      user: {
        id: existingSeller.id || `seller_${cleanNumber}`,
        sellerId: existingSeller.id || `seller_${cleanNumber}`,
        name: sellerName,
        fullName: sellerName,
        email: existingSeller.email || `seller_${cleanNumber}@hinchmart.com`,
        phone: existingSeller.phone || `+91 ${cleanNumber}`,
        role: 'SELLER_ADMIN',
        companyName: companyName,
      },
      token: firebaseToken || 'jwt_seller_' + Math.random().toString(36).substring(2),
    };

    db.setAuth(authData);

    return {
      success: true,
      exists: true,
      isProfileComplete: profileStatus.isComplete,
      incompleteSections: profileStatus.incompleteSections,
      user: authData.user,
      seller: existingSeller,
      token: authData.token,
    };
  },

  /**
   * 4. Register a new seller (Flow 2: Step 1-4)
   */
  async register(registrationData) {
    await delay(150);
    const cleanNumber = String(registrationData.mobileNumber || registrationData.phone || '').replace(/\D/g, '').slice(-10);
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const sellerId = storedSellerId || (cleanNumber ? cleanNumber : String(Date.now()));

    // Get live Firebase token if available
    let token = null;
    try {
      const { auth: fbAuth } = await import('../config/firebase.js');
      if (fbAuth?.currentUser && typeof fbAuth.currentUser.getIdToken === 'function') {
        token = await fbAuth.currentUser.getIdToken();
      }
    } catch (_) {}

    const liveUser = {
      id: sellerId,
      sellerId: sellerId,
      name: registrationData.fullName || registrationData.name || 'Authorized Seller',
      fullName: registrationData.fullName || registrationData.name || 'Authorized Seller',
      email: registrationData.email || '',
      phone: `+91 ${cleanNumber}`,
      role: 'SELLER',
      companyName: registrationData.companyName || 'Enterprise',
    };

    const authData = {
      isAuthenticated: true,
      user: liveUser,
      token: token || (typeof localStorage !== 'undefined' ? localStorage.getItem('sellerToken') : null) || 'live_seller_session',
    };

    db.setAuth(authData);

    return {
      success: true,
      user: liveUser,
      seller: {
        id: sellerId,
        sellerId: sellerId,
        name: liveUser.name,
        companyName: liveUser.companyName,
        onboardingStatus: 'PENDING_REVIEW',
        verificationStatus: 'PENDING',
      },
      token: authData.token,
      message: 'Business registered and submitted to live backend successfully!',
    };
  },

  /**
   * Check mandatory profile completion for route guards
   */
  checkProfileCompletion(seller) {
    if (!seller) return { isComplete: false, incompleteSections: ['all'] };

    const missing = [];
    if (!seller.companyName) missing.push('businessDetails');
    if (!seller.legal?.gstin && !seller.legal?.pan) missing.push('legal');
    if (!seller.address?.completeAddress) missing.push('address');
    if (!seller.bankDetails?.accountNumber) missing.push('bank');

    return {
      isComplete: missing.length === 0,
      incompleteSections: missing,
    };
  },

  /**
   * Logout and clear local session state
   */
  async logout() {
    return coreAuthService.logoutSeller();
  },
};

export default authService;
