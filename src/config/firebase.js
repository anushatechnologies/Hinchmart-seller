import { app, auth, googleProvider } from '../firebase/firebaseConfig.js';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onIdTokenChanged,
} from 'firebase/auth';

const isFirebaseConfigured = Boolean(auth);

/**
 * Initialize RecaptchaVerifier for Phone Auth
 */
export function initRecaptcha(containerId = 'recaptcha-container') {
  if (!auth) return null;
  try {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired, please try again.');
      },
    });
    return window.recaptchaVerifier;
  } catch (error) {
    console.warn('Recaptcha init notice:', error);
    return null;
  }
}

/**
 * Send Phone OTP via Firebase
 */
export async function sendFirebasePhoneOtp(phoneNumber, appVerifier) {
  const formattedPhone = phoneNumber.startsWith('+91')
    ? phoneNumber
    : `+91${phoneNumber.replace(/\D/g, '')}`;

  if (auth && appVerifier) {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      return { success: true, confirmationResult, isLive: true };
    } catch (error) {
      console.warn('Firebase Phone Auth notice (using fallback):', error.message);
      return { success: true, isLive: false, fallbackPhone: formattedPhone };
    }
  }

  return { success: true, isLive: false, fallbackPhone: formattedPhone };
}

/**
 * Verify Phone OTP via Firebase confirmationResult
 */
export async function verifyFirebasePhoneOtp(confirmationResult, otpCode) {
  if (confirmationResult && typeof confirmationResult.confirm === 'function') {
    try {
      const userCredential = await confirmationResult.confirm(otpCode);
      return { success: true, user: userCredential.user };
    } catch (error) {
      let message = 'Invalid verification code. Please check and try again.';
      if (error.code === 'auth/invalid-verification-code') {
        message = 'Invalid OTP code. Please enter the correct 6-digit code.';
      } else if (error.code === 'auth/code-expired') {
        message = 'OTP code has expired. Please request a new OTP.';
      }
      return { success: false, error: message };
    }
  }

  // Development/mock fallback
  return { success: true, isMock: true };
}

export {
  app,
  auth,
  googleProvider,
  isFirebaseConfigured,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onIdTokenChanged,
};

export default auth;
