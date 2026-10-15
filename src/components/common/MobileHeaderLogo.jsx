import React from 'react';
import { Link } from 'react-router-dom';

export function MobileHeaderLogo({ to = '/seller/dashboard' }) {
  const content = (
    <div className="flex items-center gap-2 select-none">
      {/* Construction skyline icon */}
      <svg
        className="w-7 h-7 shrink-0 drop-shadow-xs"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground bar */}
        <rect x="2" y="31" width="32" height="2" rx="1" fill="#93c5fd" />
        {/* Building 1 */}
        <rect x="4" y="18" width="5" height="13" fill="#ffffff" />
        {/* Building 2 */}
        <rect x="10" y="12" width="6" height="19" fill="#ffffff" />
        {/* Building 3 (Tower) */}
        <rect x="17" y="6" width="6" height="25" fill="#ffffff" />
        {/* Building 4 */}
        <rect x="24" y="15" width="5" height="16" fill="#ffffff" />
        {/* Windows */}
        <rect x="12" y="15" width="2" height="2" fill="#0d3b66" />
        <rect x="12" y="19" width="2" height="2" fill="#0d3b66" />
        <rect x="12" y="23" width="2" height="2" fill="#0d3b66" />
        <rect x="19" y="9" width="2" height="2" fill="#0d3b66" />
        <rect x="19" y="13" width="2" height="2" fill="#0d3b66" />
        <rect x="19" y="17" width="2" height="2" fill="#0d3b66" />
        <rect x="19" y="21" width="2" height="2" fill="#0d3b66" />
        {/* Construction Crane Tower & Boom */}
        <line x1="20" y1="6" x2="20" y2="2" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="3" x2="27" y2="3" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="3" x2="26" y2="7" stroke="#ff6b35" strokeWidth="1" strokeDasharray="1.5 1.5" />
      </svg>

      <div className="flex flex-col items-start leading-none">
        <span className="text-base font-black tracking-tight text-white flex items-center">
          HINCH<span className="text-[#ff5252]">MART</span>
        </span>
        <span className="text-[9px] font-bold tracking-[0.24em] text-blue-200 uppercase -mt-0.5">
          SELLER
        </span>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }
  return content;
}
