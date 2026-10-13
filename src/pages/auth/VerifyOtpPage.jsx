import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RotateCw, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useUIStore } from '../../store/uiStore';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Button } from '../../components/common/Button';

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useUIStore((state) => state.addToast);

  const phone = location.state?.phone || sessionStorage.getItem('otp_phone') || '9876543210';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(45);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleChange = (index, value) => {
    const sanitized = value.replace(/\D/g, '');
    if (!sanitized && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = sanitized.slice(-1);
    setOtp(newOtp);
    if (otpError) setOtpError('');

    if (sanitized && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyOtp({ phone, otp: otpCode });
      if (res.exists) {
        addToast({
          title: 'OTP Verified',
          message: 'Welcome back to HinchMart Seller Portal',
          type: 'success',
        });
        navigate('/seller/dashboard', { replace: true });
      } else {
        navigate('/register', { state: { verifiedMobile: phone } });
      }
    } catch (err) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await authService.sendOtp(phone);
      setTimer(45);
      setOtpError('');
      addToast({
        title: 'OTP Resent',
        message: `A new 6-digit code has been sent to +91 ${phone}`,
        type: 'info',
      });
    } catch (err) {
      setOtpError(err.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl p-7 sm:p-9 rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-center mb-5">
            <BrandLogo size="login" theme="light" to="/" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Verify OTP
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            We have sent a 6-digit OTP to{' '}
            <span className="font-bold text-emerald-700">+91 {phone}</span>
          </p>

          <form onSubmit={handleVerify} className="mt-6 space-y-5">
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-2xs"
                />
              ))}
            </div>

            {otpError && (
              <p className="text-xs font-semibold text-rose-600 animate-in fade-in duration-150">
                {otpError}
              </p>
            )}

            <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <span>Didn't receive OTP?</span>
              {timer > 0 ? (
                <span className="font-bold text-emerald-700">
                  Resend in 00:{timer < 10 ? `0${timer}` : timer}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <span>Verify OTP</span>
              )}
            </button>

            <div>
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-500 hover:text-emerald-700 underline cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Mobile Number</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>

  );
}
