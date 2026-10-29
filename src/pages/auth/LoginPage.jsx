import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Loader2,
  Building2,
  KeyRound,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { BrandLogo } from '../../components/common/BrandLogo';
import { initRecaptcha } from '../../config/firebase';
import { auth } from '../../firebase/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAccountExists, sendOtp, verifyOtp, loginWithEmail, isLoading } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);

  // Authentication Mode: 'EMAIL' | 'PHONE'
  const [authMode, setAuthMode] = useState('EMAIL');

  // Email/Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // Phone OTP States: 'ENTER_PHONE' | 'CHECKING' | 'OTP_ENTRY' | 'ACCOUNT_FOUND' | 'NOT_FOUND'
  const [stage, setStage] = useState('ENTER_PHONE');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [timer, setTimer] = useState(45);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const otpInputsRef = useRef([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (stage === 'OTP_ENTRY' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, timer]);

  // =========================================================================
  // HANDLER: Email & Password Sign In
  // =========================================================================
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email.trim()) {
      setEmailError('Business email address is required.');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid business email address.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    }

    if (hasError) return;

    setIsEmailSubmitting(true);
    try {
      const result = await loginWithEmail(email.trim(), password);
      const user = result?.user;

      addToast({
        title: 'Sign In Successful',
        message: `Welcome back, ${user?.name || 'Seller'}!`,
        type: 'success',
      });

      // Strict Admin Approval & Role Check
      const vStatus = String(user?.verificationStatus || result?.seller?.verificationStatus || '').toUpperCase();
      const oStatus = String(user?.onboardingStatus || result?.seller?.onboardingStatus || '').toUpperCase();
      const st = String(user?.status || result?.seller?.status || '').toUpperCase();

      const isExplicitlyPending =
        localStorage.getItem('seller_approved') === 'false' ||
        vStatus === 'PENDING' ||
        oStatus === 'PENDING_REVIEW' ||
        st === 'PENDING';

      const isApproved =
        !isExplicitlyPending && (
          localStorage.getItem('seller_approved') === 'true' ||
          user?.verified === true ||
          result?.seller?.verified === true ||
          ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(vStatus) ||
          ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(oStatus) ||
          ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(st)
        );

      const role = String(user?.role || user?.claims?.role || '').toUpperCase();
      if (role.includes('ADMIN')) {
        navigate('/seller/dashboard');
      } else if (isApproved) {
        navigate('/seller/dashboard');
      } else if (user?.sellerId || result?.seller?.id) {
        addToast({
          title: 'Account Under Review',
          message: 'Your seller account is awaiting administrator approval before accessing the dashboard.',
          type: 'info',
        });
        navigate('/pending-approval');
      } else {
        addToast({
          title: 'Seller Registration Required',
          message: 'Please complete seller registration to access the supplier dashboard.',
          type: 'info',
        });
        navigate('/register');
      }
    } catch (err) {
      console.error('Email login error:', err);
      let errMsg = 'Invalid email or password. Please check your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        errMsg = 'Incorrect password. Please verify your password or click "Forgot Password?" to reset it.';
      } else if (err.code === 'auth/user-not-found') {
        errMsg = 'No registered seller account found for this email address. Please click Register to create an account.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setPasswordError(errMsg);
      addToast({
        title: 'Authentication Failed',
        message: errMsg,
        type: 'error',
      });
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  // =========================================================================
  // HANDLER: Forgot Password
  // =========================================================================
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      addToast({
        title: 'Invalid Email',
        message: 'Please enter a valid registered business email.',
        type: 'warning',
      });
      return;
    }

    setIsForgotSubmitting(true);
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, forgotEmail);
      }
      addToast({
        title: 'Reset Link Sent',
        message: `Password reset link has been dispatched to ${forgotEmail}. Please check your inbox.`,
        type: 'success',
      });
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err) {
      addToast({
        title: 'Reset Failed',
        message: err.message || 'Could not send reset link. Please verify your email.',
        type: 'error',
      });
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // =========================================================================
  // HANDLERS: Mobile Number & OTP Sign In
  // =========================================================================
  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(val);
    if (mobileError) setMobileError('');
  };

  const handleCheckAccountAndSendOtp = async (e) => {
    e.preventDefault();
    setMobileError('');

    if (!mobileNumber) {
      setMobileError('Mobile number is required.');
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(mobileNumber)) {
      setMobileError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setStage('CHECKING');
    try {
      const res = await checkAccountExists(mobileNumber);
      if (res.exists) {
        try {
          const appVerifier = initRecaptcha('recaptcha-container');
          const otpRes = await sendOtp(mobileNumber, appVerifier);
          setConfirmationResult(otpRes.confirmationResult || null);
          setTimer(30);
          setOtp(['', '', '', '', '', '']);
          setOtpError('');
          setStage('OTP_ENTRY');

          addToast({
            title: otpRes.isLive ? 'OTP Sent' : 'Demo OTP Mode',
            message: otpRes.message || `Verification code sent to +91 ${mobileNumber}`,
            type: otpRes.isLive ? 'success' : 'info',
          });

          setTimeout(() => {
            if (otpInputsRef.current[0]) {
              otpInputsRef.current[0].focus();
            }
          }, 100);
        } catch (otpErr) {
          setStage('ACCOUNT_FOUND');
        }
      } else {
        setStage('NOT_FOUND');
      }
    } catch (err) {
      setStage('ENTER_PHONE');
      setMobileError(err.message || 'Error checking account. Please try again.');
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (otpError) setOtpError('');

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      pasted.split('').forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    try {
      const res = await verifyOtp({
        phone: mobileNumber,
        otp: otpCode,
        confirmationResult,
      });

      addToast({
        title: 'Authentication Successful',
        message: `Welcome back, ${res.seller?.name || res.user?.name || 'Seller'}!`,
        type: 'success',
      });

      const otpVStatus = String(res.seller?.verificationStatus || res.user?.verificationStatus || '').toUpperCase();
      const otpOStatus = String(res.seller?.onboardingStatus || res.user?.onboardingStatus || '').toUpperCase();
      const otpSt = String(res.seller?.status || res.user?.status || '').toUpperCase();

      const isOtpExplicitlyPending =
        localStorage.getItem('seller_approved') === 'false' ||
        otpVStatus === 'PENDING' ||
        otpOStatus === 'PENDING_REVIEW' ||
        otpSt === 'PENDING';

      const isOtpApproved =
        !isOtpExplicitlyPending && (
          localStorage.getItem('seller_approved') === 'true' ||
          res.seller?.verified === true ||
          res.user?.verified === true ||
          ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(otpVStatus) ||
          ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(otpOStatus) ||
          ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(otpSt)
        );

      const otpRole = String(res.user?.role || res.seller?.role || '').toUpperCase();
      if (otpRole.includes('ADMIN')) {
        navigate('/seller/dashboard');
      } else if (isOtpApproved) {
        navigate('/seller/dashboard');
      } else if (res.seller?.id || res.user?.sellerId) {
        addToast({
          title: 'Account Under Review',
          message: 'Your seller account is awaiting administrator approval before accessing the dashboard.',
          type: 'info',
        });
        navigate('/pending-approval');
      } else {
        addToast({
          title: 'Seller Registration Required',
          message: 'Please complete seller registration to access the supplier dashboard.',
          type: 'info',
        });
        navigate('/register');
      }
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired OTP. Please try again.');
    }
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="min-h-screen bg-[#FCFBF7] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans flex flex-col justify-center items-center">
      <div id="recaptcha-container" />

      {/* Background Ambient Glow (Matching Signup Style) */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Top Header with Seamless Transparent Brand Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4 sm:mb-5">
            <BrandLogo size="login" theme="light" to="/" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Seller Portal Login
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Sign in to manage your store, catalog, inventory & orders
          </p>
        </div>

        {/* Login Card (Matching Signup Style) */}
        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-200">
          {/* Segmented Auth Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('EMAIL');
                setStage('ENTER_PHONE');
                setEmailError('');
                setPasswordError('');
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'EMAIL'
                  ? 'bg-white text-slate-950 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Business Email</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('PHONE');
                setStage('ENTER_PHONE');
                setMobileError('');
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'PHONE'
                  ? 'bg-white text-slate-950 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
          </div>

          {/* ── EMAIL & PASSWORD SIGN IN ── */}
          {authMode === 'EMAIL' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  Business Email Address
                </label>
                <div
                  className={`rounded-xl border transition-all ${
                    emailError
                      ? 'border-red-300 ring-2 ring-red-500/10'
                      : 'border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                  }`}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="seller@example.com"
                    autoComplete="email"
                    className="block w-full px-4 py-3 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none"
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div
                  className={`relative rounded-xl border transition-all ${
                    passwordError
                      ? 'border-red-300 ring-2 ring-red-500/10'
                      : 'border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                  }`}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="block w-full px-4 py-3 pr-11 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-start gap-1">
                    <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember this device</span>
                </label>
              </div>

              {/* Submit Button (Matching Gold Brand Action) */}
              <button
                type="submit"
                disabled={isEmailSubmitting || isLoading}
                className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-slate-950 font-black text-sm rounded-xl shadow-md shadow-amber-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isEmailSubmitting || isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── MOBILE NUMBER & INSTANT OTP SIGN IN ── */}
          {authMode === 'PHONE' && (
            <div>
              {stage === 'ENTER_PHONE' && (
                <form onSubmit={handleCheckAccountAndSendOtp} className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      Business Mobile Number
                    </label>
                    <div
                      className={`flex items-stretch rounded-xl overflow-hidden border transition-all ${
                        mobileError
                          ? 'border-red-300 ring-2 ring-red-500/10'
                          : 'border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                      }`}
                    >
                      <div className="flex items-center px-3.5 bg-slate-50 border-r border-slate-200 text-slate-700 font-bold text-sm select-none">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={handleMobileChange}
                        placeholder="9876543210"
                        maxLength={10}
                        autoFocus
                        className="block w-full px-3.5 py-3 bg-white text-sm font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {mobileError && (
                      <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{mobileError}</span>
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      We'll verify your registered account and dispatch a 6-digit OTP.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || mobileNumber.length !== 10}
                    className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-xl shadow-md shadow-amber-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Send Login OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {stage === 'CHECKING' && (
                <div className="py-10 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Verifying your seller account...</p>
                </div>
              )}

              {stage === 'NOT_FOUND' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">No Account Found</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      No registered seller account found for <strong>+91 {mobileNumber}</strong>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate('/register', { state: { verifiedMobile: mobileNumber } })}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Register New Seller Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setStage('ENTER_PHONE')}
                      className="w-full py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Use a different number
                    </button>
                  </div>
                </div>
              )}

              {stage === 'OTP_ENTRY' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">OTP sent to</p>
                      <p className="text-sm font-black text-slate-900 tracking-wide">+91 {mobileNumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStage('ENTER_PHONE')}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="flex justify-between gap-1.5 sm:gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={idx === 0 ? handleOtpPaste : undefined}
                          className="w-10 sm:w-12 h-12 sm:h-13 text-center text-lg font-black bg-white border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                        />
                      ))}
                    </div>
                    {otpError && <p className="mt-2 text-xs text-red-600 font-semibold">{otpError}</p>}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {timer > 0 ? (
                      <span className="text-slate-500 font-medium">Resend OTP in {timer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCheckAccountAndSendOtp}
                        className="font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otp.join('').length !== 6}
                    className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-xl shadow-md shadow-amber-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Log In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Card Footer: Register Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              New to HinchMart?{' '}
              <Link to="/register" className="font-black text-amber-600 hover:text-amber-700 hover:underline transition-colors ml-1">
                Register as a Seller
              </Link>
            </p>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-3.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>256-bit SSL</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verified Sellers</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Enterprise Protected</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/*          FORGOT PASSWORD MODAL              */}
      {/* ═══════════════════════════════════════════ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 text-left animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered business email and we'll send a secure password reset link.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div className="rounded-xl border border-slate-200 overflow-hidden focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seller@example.com"
                  required
                  className="w-full px-4 py-3 bg-white text-sm font-medium focus:outline-none"
                />
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="w-1/2 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  {isForgotSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" /> : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
