import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Package, FileText, BarChart2, User } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';

export function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { orders = [] } = useOrders();
  const pendingCount = orders.filter((o) =>
    ['new', 'pending'].includes(String(o.orderStatus || o.status || '').toLowerCase())
  ).length;

  const navItems = [
    {
      label: 'Home',
      to: '/seller/dashboard',
      icon: Home,
      isActive: currentPath === '/seller/dashboard' || currentPath === '/seller',
    },
    {
      label: 'Products',
      to: '/seller/products',
      icon: Package,
      isActive: currentPath.startsWith('/seller/products'),
    },
    {
      label: 'Orders',
      to: '/seller/orders',
      icon: FileText,
      badge: pendingCount > 0,
      isActive: currentPath.startsWith('/seller/orders'),
    },
    {
      label: 'Reports',
      to: '/seller/analytics',
      icon: BarChart2,
      isActive: currentPath.startsWith('/seller/analytics'),
    },
    {
      label: 'Profile',
      to: '/seller/company/profile',
      icon: User,
      isActive: currentPath.startsWith('/seller/company') || currentPath.startsWith('/seller/settings'),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-around px-2 py-1.5 transition-all select-none"
      style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom, 0.4rem))' }}
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive;
        return (
          <NavLink
            key={item.label}
            to={item.to}
            className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] transition-colors relative ${
              active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-6 h-6 transition-transform ${
                  active ? 'stroke-[2.4] scale-105' : 'stroke-[1.8]'
                }`}
              />
              {item.badge && (
                <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </div>
            <span
              className={`text-[11px] mt-1 transition-all ${
                active ? 'font-bold text-blue-600' : 'font-medium text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
