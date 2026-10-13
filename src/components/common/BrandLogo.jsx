import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Official HinchMart Brand Logo Component
 * Uses the exact official HinchMart logo asset (Blue 'H' + Orange 'M' + Construction Skyline & Typography)
 * Supports responsive proportions, crisp rendering, and seamless dark/light surface integration.
 */
export function BrandLogoIcon({ size = 36, className = '' }) {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/assets/logo/hinchmart-logo.png"
        alt="HinchMart Icon"
        className="w-full h-full object-contain filter drop-shadow-xs"
        loading="eager"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/logo.png';
        }}
      />
    </div>
  );
}

export function BrandLogo({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'navbar' | 'sidebar' | 'login'
  variant = 'full', // 'full' | 'icon'
  theme = 'dark', // 'dark' | 'light'
  showBadge = false,
  badgeText = 'SELLER PORTAL',
  to = '/seller/dashboard',
  className = '',
  imgClassName = '',
}) {
  // Dimension presets matching official guidelines:
  // Navbar: ~120-150px | Sidebar: ~140-160px | Login/landing: ~220-280px | Mobile: ~100-140px
  const sizeClasses = {
    sm: 'w-[115px] sm:w-[130px] max-h-9',
    navbar: 'w-[130px] sm:w-[145px] max-h-10',
    md: 'w-[145px] sm:w-[155px] max-h-11',
    sidebar: 'w-[150px] sm:w-[160px] max-h-12',
    lg: 'w-[230px] sm:w-[260px] max-h-16',
    login: 'w-[240px] sm:w-[270px] max-h-20',
    xl: 'w-[280px] sm:w-[320px] max-h-24',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  if (variant === 'icon') {
    const isLight = theme === 'light';
    const IconContent = (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`w-10 h-10 p-1.5 rounded-xl border shadow-2xs flex items-center justify-center ${
          isLight ? 'bg-slate-100/90 border-slate-200/80' : 'bg-slate-800/80 border-slate-700/60'
        }`}>
          <img
            src="/assets/logo/hinchmart-logo.png"
            alt="HinchMart"
            className="w-full h-full object-contain"
            loading="eager"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo.png';
            }}
          />
        </div>
      </div>
    );

    if (to) {
      return (
        <Link to={to} className="inline-flex items-center transition-transform hover:scale-[1.02]">
          {IconContent}
        </Link>
      );
    }
    return IconContent;
  }

  const LogoContent = (
    <div className={`inline-flex flex-col items-start gap-1 select-none ${className}`}>
      <div className="flex items-center gap-2">
        <img
          src="/assets/logo/hinchmart-logo.png"
          alt="HinchMart - B2B Construction Commerce"
          className={`h-auto object-contain transition-all duration-150 ${selectedSizeClass} ${imgClassName}`}
          loading="eager"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/logo.png';
          }}
        />
        {showBadge && (
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-500 text-white shadow-2xs">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center transition-opacity hover:opacity-95 cursor-pointer focus:outline-none"
        title="HinchMart Seller Portal"
      >
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}

