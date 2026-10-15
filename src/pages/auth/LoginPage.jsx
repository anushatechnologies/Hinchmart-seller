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
  TrendingUp,
  Package,
  BarChart3,
  Truck,
  Star,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { BrandLogo } from '../../components/common/BrandLogo';
import { initRecaptcha } from '../../config/firebase';
import { authService } from '../../services/authService';
import { auth } from '../../firebase/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

/* ───────────── Floating animated particles ───────────── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${8 + i * 6}px`,
            height: `${8 + i * 6}px`,
            background: i % 2 === 0
              ? 'linear-gradient(135deg, #f97316, #fb923c)'
              : 'linear-gradient(135deg, #10b981, #34d399)',
            left: `${10 + i * 15}%`,
            top: `${15 + (i * 13) % 70}%`,
            animation: `floatParticle ${6 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ───────────── Feature highlight card ───────────── */
function FeatureCard({ icon: Icon, title, desc, delay }) {
  return (
    <div
      className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.12] hover:border-white/[0.15] transition-all duration-300"
      style={{ animation: `slideUp 0.6s ease-out ${delay}s both` }}
    >
      <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-orange-500/30 to-orange-600/20 border border-orange-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-4 h-4 text-orange-300" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white/90">{title}</h4>
        <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ───────────── Trust badge ───────────── */
function TrustBadge({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5 text-white/50">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[11px] font-medium">{text}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                    MAIN LOGIN PAGE                     */
/* ═══════════════════════════════════════════════════════ */
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

  // UI Animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

      // Strict Admin Approval & Role Check for OTP: Do not navigate to dashboard until approved!
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
    <>
      {/* Global animation keyframes */}
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(-3deg); }
          75% { transform: translateY(-25px) rotate(4deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .login-gradient-bg {
          background: linear-gradient(-45deg, #0f172a, #1e293b, #0c4a6e, #134e4a, #1e293b);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        .glass-card {
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .input-focus-ring {
          transition: all 0.2s ease;
        }
        .input-focus-ring:focus-within {
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
          border-color: #f97316;
        }
        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen flex font-['Inter',sans-serif]">
        <div id="recaptcha-container" />

        {/* ═══════════════════════════════════════════ */}
        {/*       LEFT PANEL — BRANDED SHOWCASE         */}
        {/* ═══════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative login-gradient-bg flex-col justify-between p-8 xl:p-12 overflow-hidden">
          <FloatingParticles />

          {/* Decorative gradient orbs */}
          <div className="absolute top-[-10%] right-[-8%] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[100px] pointer-events-none" style={{ animation: 'pulseGlow 8s ease-in-out infinite' }} />
          <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" style={{ animation: 'pulseGlow 10s ease-in-out infinite 2s' }} />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[60px] pointer-events-none" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

          {/* Top: Logo & Branding */}
          <div className="relative z-10" style={{ animation: 'slideUp 0.6s ease-out both' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center p-1.5">
                <img
                  src="/assets/logo/hinchmart-logo.png"
                  alt="HinchMart"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/logo.png';
                  }}
                />
              </div>
              <div>
                <h2 className="text-white text-lg font-extrabold tracking-tight">HinchMart</h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400/80">Seller Portal</span>
                  <span className="w-1 h-1 rounded-full bg-emerald-400/60" />
                  <span className="text-[10px] font-medium text-white/40">B2B Platform</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Hero Content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
            <div style={{ animation: 'slideUp 0.6s ease-out 0.15s both' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-400/20 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-bold text-orange-300/90 tracking-wide">INDIA'S TRUSTED B2B MARKETPLACE</span>
              </div>
              <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
                Grow Your Business<br />
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">With HinchMart</span>
              </h1>
              <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-md">
                Join thousands of manufacturers, distributors, and suppliers across India. Manage products, track orders, and scale your construction materials business — all from one powerful platform.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="mt-8 grid grid-cols-1 gap-3">
              <FeatureCard
                icon={Package}
                title="Product Management"
                desc="Add and manage your construction materials catalog with ease"
                delay={0.3}
              />
              <FeatureCard
                icon={BarChart3}
                title="Real-Time Analytics"
                desc="Track sales, revenue, and performance with live dashboards"
                delay={0.45}
              />
              <FeatureCard
                icon={Truck}
                title="Order Fulfillment"
                desc="Process orders, manage deliveries, and track consignments"
                delay={0.6}
              />
            </div>
          </div>

          {/* Bottom: Trust Indicators */}
          <div className="relative z-10" style={{ animation: 'slideUp 0.6s ease-out 0.8s both' }}>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
              <span className="text-xs text-white/40 ml-1.5 font-medium">Trusted by 500+ sellers</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <TrustBadge icon={Shield} text="SSL Secured" />
              <TrustBadge icon={ShieldCheck} text="Verified Sellers" />
              <TrustBadge icon={Zap} text="Instant Payouts" />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/*       RIGHT PANEL — LOGIN FORM              */}
        {/* ═══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col justify-center items-center relative bg-[#f8f9fc] overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.4]" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(249,115,22,0.04) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(16,185,129,0.04) 0%, transparent 50%)',
          }} />

          {/* Top decorative line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

          <div
            className="relative z-10 w-full max-w-[420px] mx-auto px-6 sm:px-8"
            style={{ animation: mounted ? 'fadeInScale 0.5s ease-out both' : 'none' }}
          >
            {/* Mobile Logo (shown on small screens where left panel is hidden) */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center p-2.5 mb-4 shadow-xl">
                <img
                  src="/assets/logo/hinchmart-logo.png"
                  alt="HinchMart"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/logo.png';
                  }}
                />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">HinchMart</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600/80 mt-0.5">Seller Portal</span>
            </div>

            {/* Welcome Header */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-slate-500 font-medium">
                Sign in to manage your store, products & orders
              </p>
            </div>

            {/* ═══════ Login Card ═══════ */}
            <div className="glass-card rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/[0.04] p-6 sm:p-7">

              {/* ── EMAIL & PASSWORD SIGN IN ── */}
              {authMode === 'EMAIL' && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Business Email
                    </label>
                    <div className={`rounded-xl border overflow-hidden input-focus-ring ${
                      emailError ? 'border-red-300 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : 'border-slate-200'
                    }`}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError('');
                        }}
                        placeholder="seller@example.com"
                        autoComplete="email"
                        className="block w-full px-4 py-3 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {emailError && <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" />{emailError}</p>}
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setShowForgotModal(true);
                        }}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className={`rounded-xl border overflow-hidden input-focus-ring ${
                      passwordError ? 'border-red-300 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : 'border-slate-200'
                    }`}>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError) setPasswordError('');
                          }}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="block w-full px-4 py-3 pr-11 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {passwordError && <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-start gap-1"><XCircle className="w-3 h-3 mt-0.5 shrink-0" /><span>{passwordError}</span></p>}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500/20 cursor-pointer"
                        />
                      </div>
                      <span className="text-xs text-slate-600 font-medium group-hover:text-slate-800 transition-colors">Remember this device</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isEmailSubmitting || isLoading}
                    className="btn-shine w-full mt-1 py-3.5 px-5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 active:from-orange-700 active:via-orange-800 active:to-orange-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isEmailSubmitting || isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
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
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          Business Mobile Number
                        </label>
                        <div
                          className={`flex items-stretch rounded-xl overflow-hidden border input-focus-ring ${
                            mobileError
                              ? 'border-red-300 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                              : 'border-slate-200'
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
                        {mobileError && <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" />{mobileError}</p>}
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          We'll verify your registered account and send a 6-digit OTP.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || mobileNumber.length !== 10}
                        className="btn-shine w-full py-3.5 px-5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <span>Send Login OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {stage === 'CHECKING' && (
                    <div className="py-10 text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Verifying your account...</p>
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
                          No seller account found for <strong>+91 {mobileNumber}</strong>.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => navigate('/register', { state: { verifiedMobile: mobileNumber } })}
                          className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
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
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          Enter 6-Digit Verification Code
                        </label>
                        <div className="flex justify-between gap-2">
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
                              className="w-11 h-13 text-center text-lg font-black bg-white border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
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
                            className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otp.join('').length !== 6}
                        className="btn-shine w-full py-3.5 px-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

              {/* ── Divider ── */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-400 font-medium">or continue with</span>
                </div>
              </div>

              {/* ── Switch Auth Mode ── */}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'EMAIL' ? 'PHONE' : 'EMAIL');
                  setStage('ENTER_PHONE');
                  setMobileError('');
                  setEmailError('');
                  setPasswordError('');
                }}
                className="w-full py-3 px-4 border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {authMode === 'EMAIL' ? (
                  <>
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>Sign in with Mobile OTP</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>Sign in with Email & Password</span>
                  </>
                )}
              </button>
            </div>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                New to HinchMart?{' '}
                <Link to="/register" className="font-extrabold text-orange-600 hover:text-orange-700 transition-colors">
                  Register as a Seller
                </Link>
              </p>
            </div>

            {/* Security Footer */}
            <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>256-bit SSL</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>SOC 2 Compliant</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>GDPR Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/*          FORGOT PASSWORD MODAL              */}
      {/* ═══════════════════════════════════════════ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-7 shadow-2xl border border-slate-100 space-y-4 text-left"
            style={{ animation: 'fadeInScale 0.2s ease-out both' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200/50 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Reset Password</h3>
              </div>
              <button
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
              <div className="rounded-xl border border-slate-200 overflow-hidden input-focus-ring">
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
                  className="w-1/2 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="w-1/2 py-3 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 transition-all"
                >
                  {isForgotSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
export default LoginPage;
