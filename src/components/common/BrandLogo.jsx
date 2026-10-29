import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Official HinchMart Brand Logo Component
 * - 100% Transparent, seamless background (no white card, no boxy patchup).
 * - Automatic surface theme selection:
 *   - theme="light" (default for light surfaces): Obsidian Black 'HINCH' + Metallic Gold 'MART'.
 *   - theme="dark" (for dark sidebars/headers): Crisp White 'HINCH' + Metallic Gold 'MART'.
 * - Preserves native aspect ratio with zero distortion.
 */
export function BrandLogoIcon({ size = 36, theme = 'light', className = '' }) {
  const isDark = theme === 'dark';
  const logoSrc = isDark ? '/assets/logo/hinchmart-logo-dark.png' : '/assets/logo/hinchmart-logo.png';
  const fallbackSrc = isDark ? '/logo-dark.png' : '/logo.png';

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={logoSrc}
        alt="HinchMart Icon"
        className="w-full h-full object-contain"
        loading="eager"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = fallbackSrc;
        }}
      />
    </div>
  );
}

export function BrandLogo({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'navbar' | 'sidebar' | 'login'
  variant = 'full', // 'full' | 'icon'
  theme = 'light', // 'light' | 'dark'
  showBadge = false,
  badgeText = 'SELLER PORTAL',
  to = '/seller/dashboard',
  className = '',
  imgClassName = '',
}) {
  const isDark = theme === 'dark';
  const logoSrc = isDark ? '/assets/logo/hinchmart-logo-dark.png' : '/assets/logo/hinchmart-logo.png';
  const fallbackSrc = isDark ? '/logo-dark.png' : '/logo.png';

  const sizeClasses = {
    sm: 'h-7 w-auto max-w-[100px]',
    navbar: 'h-8 sm:h-9 w-auto max-w-[130px]',
    sidebar: 'h-10 w-auto max-w-[125px]',
    md: 'h-10 sm:h-11 w-auto max-w-[140px]',
    lg: 'h-12 sm:h-14 w-auto max-w-[200px]',
    login: 'h-14 sm:h-16 w-auto max-w-[240px]',
    xl: 'h-16 sm:h-20 w-auto max-w-[280px]',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  if (variant === 'icon') {
    const IconContent = (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src={logoSrc}
          alt="HinchMart"
          className="w-10 h-10 object-contain"
          loading="eager"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackSrc;
          }}
        />
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
    <div className={`inline-flex items-center gap-2 select-none bg-transparent ${className}`}>
      <img
        src={logoSrc}
        alt="HinchMart - B2B Construction & Home Materials"
        className={`object-contain shrink-0 transition-all duration-150 ${selectedSizeClass} ${imgClassName}`}
        loading="eager"
        decoding="async"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = fallbackSrc;
        }}
      />
      {showBadge && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs shrink-0">
          {badgeText}
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center transition-opacity hover:opacity-95 cursor-pointer focus:outline-none bg-transparent"
        title="HinchMart Seller Portal"
      >
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}
