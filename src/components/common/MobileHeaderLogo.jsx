import React from 'react';
import { Link } from 'react-router-dom';

export function MobileHeaderLogo({ to = '/seller/dashboard' }) {
  const content = (
    <div className="flex items-center gap-2 select-none bg-transparent">
      <img
        src="/assets/logo/hinchmart-logo-dark.png"
        alt="HinchMart"
        className="h-8 w-auto max-w-[140px] object-contain transition-opacity"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/logo-dark.png';
        }}
      />
      <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs">
        SELLER
      </span>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none bg-transparent">
        {content}
      </Link>
    );
  }
  return content;
}
