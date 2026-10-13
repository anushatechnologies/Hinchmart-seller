import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  ChevronDown,
  Building2,
  Settings,
  FileCheck,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mic,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useNotifications } from '../../hooks/useNotifications';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { HeaderSearch } from './HeaderSearch';
import { BrandLogo } from '../common/BrandLogo';
import { formatRelativeTime } from '../../utils/formatters';

export function Header() {
  const navigate = useNavigate();
  const { toggleMobileMenu } = useUIStore();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { profile } = useSellerProfile();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sellerDisplayName = profile?.companyName || user?.companyName || profile?.name || user?.name || 'Seller Enterprise';
  const sellerContactName = profile?.name || profile?.fullName || user?.name || user?.fullName || 'Seller Admin';
  const sellerMonogram = (profile?.companyName || user?.companyName || profile?.name || user?.name || 'SE')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'SE';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 shadow-xs header-gradient-border">
      {/* Left: Mobile Toggle + Logo + Global Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 md:hidden focus:outline-none cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo (Visible on mobile header) */}
        <div className="md:hidden">
          <BrandLogo size="navbar" theme="light" to="/seller/dashboard" />
        </div>

        {/* Real Production Header Search Bar with Voice Mic */}
        <div className="hidden sm:flex items-center w-full max-w-xl lg:max-w-2xl">
          <HeaderSearch />
        </div>
      </div>

      {/* Right: Support + Notifications + Company Avatar */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Mobile Search Icon Toggle */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-md sm:hidden cursor-pointer"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Support Link */}
        <a
          href="#help"
          onClick={(e) => {
            e.preventDefault();
            window.alert('HinchMart B2B Seller Desk: 1800-202-6000 | Email: sellersupport@hinchmart.com');
          }}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors hidden md:flex items-center gap-1.5 text-xs font-semibold"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Support</span>
        </a>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bell-bounce' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-orange-600 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-modal-spring">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) {
                          setNotifDropdownOpen(false);
                          navigate(n.link);
                        }
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.read ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1 text-[11px] leading-tight">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 p-2 text-center">
                <Link
                  to="/seller/notifications"
                  onClick={() => setNotifDropdownOpen(false)}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Seller Profile Monogram & Avatar Badge */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none group"
          >
            {/* Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center border border-orange-600/30 shadow-sm glow-ring">
              {sellerMonogram}
            </div>

            <div className="text-left hidden lg:block max-w-[170px]">
              <p className="text-xs font-extrabold text-slate-900 truncate leading-tight uppercase tracking-tight">
                {sellerDisplayName}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                <span>✓ Verified Seller</span>
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-modal-spring">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-extrabold text-slate-900 uppercase truncate">
                  {sellerDisplayName}
                </p>
                <p className="text-[11px] text-orange-600 font-semibold truncate">
                  {sellerContactName}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                  GSTIN: {profile?.legal?.gstin || profile?.gstin || 'Not Provided'}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100">
                  <span className="text-slate-600 font-medium">Compliance Health</span>
                  <span className={`font-bold ${profile?.verificationStatus === 'Verified' || profile?.verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {profile?.verificationStatus === 'Verified' || profile?.verified ? 'Verified ✓' : (profile?.verificationStatus || 'Pending')}
                  </span>
                </div>
              </div>

              <div className="py-1 text-xs text-slate-700">
                <Link
                  to="/seller/company/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-slate-900"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Business Profile</span>
                </Link>

                <Link
                  to="/seller/company/documents"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-slate-900"
                >
                  <FileCheck className="w-4 h-4 text-slate-400" />
                  <span>Documents & GSTIN</span>
                </Link>

                <Link
                  to="/seller/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-slate-900"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {mobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 z-40 bg-white p-3 border-b border-slate-200 shadow-md sm:hidden animate-in slide-in-from-top duration-150">
          <HeaderSearch />
        </div>
      )}
    </header>
  );
}
