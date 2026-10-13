import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSellerAuth } from '../context/SellerAuthContext';

export const SellerLogin = () => {
  const { loginWithEmail, loginWithGoogle } = useSellerAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const profile = await loginWithEmail(email, password);
      if (profile.sellerId && profile.role === 'SELLER') {
        navigate('/seller/dashboard');
      } else {
        navigate('/seller/onboarding');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const profile = await loginWithGoogle();
      if (profile.sellerId && profile.role === 'SELLER') {
        navigate('/seller/dashboard');
      } else {
        navigate('/seller/onboarding');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Google Sign-In failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center aurora-bg p-4 relative overflow-hidden">
      {/* Floating Decorative Orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-48 h-48 bg-amber-500/8 rounded-full blur-2xl animate-float-delayed pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-56 h-56 bg-teal-400/6 rounded-full blur-3xl animate-float pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative animate-fade-in-up">
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-t-2xl" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 text-emerald-400 font-black text-xl mb-3 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 glow-ring">
            HM
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Seller Portal</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5">Sign in to manage your wholesale catalog and orders</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500/40 rounded-xl text-red-300 text-xs animate-fade-in-up backdrop-blur-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 tracking-wider">Business Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seller@company.com"
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 text-sm transition-all backdrop-blur-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-300 tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 text-sm transition-all backdrop-blur-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 disabled:opacity-50 text-sm press-scale relative overflow-hidden group"
          >
            <span className="relative z-10">{isSubmitting ? 'Signing In...' : 'Sign In to Seller Portal'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/60"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900/80 backdrop-blur-sm px-3 text-slate-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={isSubmitting}
          className="w-full py-3 bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/50 text-white font-medium rounded-xl transition-all flex items-center justify-center space-x-2 text-sm press-scale backdrop-blur-sm hover:border-slate-600/60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="mt-6 text-center text-xs text-slate-400">
          Want to become a seller?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Apply for Seller Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SellerLogin;
