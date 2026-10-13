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
  RotateCw,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Building2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { BrandLogo } from '../../components/common/BrandLogo';
import { initRecaptcha } from '../../config/firebase';
import { authService } from '../../services/authService';
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

      // Strict Admin Approval & Role Check: Do not navigate to dashboard until approved!
      const isApproved =
        localStorage.getItem('seller_approved') === 'true' ||
        user?.verified === true ||
        result?.seller?.verified === true ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(user?.verificationStatus || '').toUpperCase()) ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(user?.onboardingStatus || '').toUpperCase()) ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(result?.seller?.verificationStatus || '').toUpperCase()) ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(result?.seller?.onboardingStatus || '').toUpperCase()) ||
        (String(user?.role || '').toUpperCase() === 'SELLER' && String(user?.onboardingStatus || '').toUpperCase() === 'VERIFIED');

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
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errMsg = 'No registered seller account found with these credentials.';
      } else if (err.code === 'auth/wrong-password') {
        errMsg = 'Incorrect password. Please retry or click Forgot Password.';
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

      // Strict Admin Approval & Role Check for OTP: Do not navigate to dashboard until approved!
      const isOtpApproved =
        localStorage.getItem('seller_approved') === 'true' ||
        res.seller?.verified === true ||
        res.user?.verified === true ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(res.seller?.verificationStatus || '').toUpperCase()) ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(res.seller?.onboardingStatus || '').toUpperCase()) ||
        ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(String(res.user?.verificationStatus || '').toUpperCase()) ||
        (String(res.user?.role || '').toUpperCase() === 'SELLER' && String(res.user?.onboardingStatus || '').toUpperCase() === 'VERIFIED');

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

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div id="recaptcha-container" />

      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <BrandLogo size="login" theme="light" to="/" />
        </div>
        <h1 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Sign in to Seller Portal
        </h1>
        <p className="mt-1.5 text-center text-xs text-slate-500 font-medium">
          Access your B2B supplier dashboard, inventory, and quotations
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-xl shadow-slate-900/5 rounded-2xl border border-slate-200 text-left">
          
          {/* ========================================================================= */}
          {/* AUTH MODE TOGGLE TABS (Email & Password VS Mobile OTP) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('EMAIL');
                setStage('ENTER_PHONE');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'EMAIL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Email & Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('PHONE');
                setStage('ENTER_PHONE');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'PHONE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mobile OTP</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: EMAIL & PASSWORD SIGN IN */}
          {/* ========================================================================= */}
          {authMode === 'EMAIL' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="seller@patelsteels.com"
                    autoComplete="email"
                    className={`block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      emailError
                        ? 'border-rose-300 ring-2 ring-rose-500/10'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                {emailError && <p className="mt-1 text-xs text-rose-600 font-semibold">{emailError}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className={`block w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      passwordError
                        ? 'border-rose-300 ring-2 ring-rose-500/10'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="mt-1 text-xs text-rose-600 font-semibold">{passwordError}</p>}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember this workstation</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isEmailSubmitting || isLoading}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isEmailSubmitting || isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Seller Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MOBILE NUMBER & INSTANT OTP SIGN IN */}
          {/* ========================================================================= */}
          {authMode === 'PHONE' && (
            <div>
              {stage === 'ENTER_PHONE' && (
                <form onSubmit={handleCheckAccountAndSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Business Mobile <span className="text-rose-500">*</span>
                    </label>
                    <div
                      className={`flex items-stretch rounded-xl overflow-hidden bg-slate-50 border transition-all ${
                        mobileError
                          ? 'border-rose-300 ring-2 ring-rose-500/10'
                          : 'border-slate-200 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
                      }`}
                    >
                      <div className="flex items-center px-3.5 bg-slate-100 border-r border-slate-200 text-slate-700 font-bold text-sm select-none">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={handleMobileChange}
                        placeholder="9876543210"
                        maxLength={10}
                        autoFocus
                        className="block w-full px-3.5 py-2.5 bg-transparent text-sm font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {mobileError && <p className="mt-1 text-xs text-rose-600 font-semibold">{mobileError}</p>}
                    <p className="mt-1 text-[11px] text-slate-500">
                      We will check your registered account and send a 6-digit SMS OTP.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || mobileNumber.length !== 10}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Send Login OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {stage === 'CHECKING' && (
                <div className="py-8 text-center space-y-3 animate-in fade-in duration-150">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Verifying account credentials...</p>
                </div>
              )}

              {stage === 'NOT_FOUND' && (
                <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">No Account Found</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      No seller registration found for <strong>+91 {mobileNumber}</strong>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate('/register', { state: { verifiedMobile: mobileNumber } })}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
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
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">OTP sent to</p>
                      <p className="text-sm font-black text-slate-900 tracking-wide">+91 {mobileNumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStage('ENTER_PHONE')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="flex justify-between gap-1.5 sm:gap-2 on-paste={handleOtpPaste}">
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
                          className="w-10 sm:w-11 h-12 text-center text-lg font-black bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                        />
                      ))}
                    </div>
                    {otpError && <p className="mt-2 text-xs text-rose-600 font-semibold">{otpError}</p>}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {timer > 0 ? (
                      <span className="text-slate-500 font-medium">Resend OTP in {timer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCheckAccountAndSendOtp}
                        className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otp.join('').length !== 6}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
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

          {/* Footer Link to Register */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              New supplier or manufacturer on HinchMart?{' '}
              <Link to="/register" className="font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline">
                Register as a Seller
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Reset Password</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered official business email. We'll send you a secure link to reset your seller password.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seller@patelsteels.com"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isForgotSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Link'}
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
