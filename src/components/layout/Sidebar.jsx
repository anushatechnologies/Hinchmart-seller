import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  Package,
  Warehouse,
  Receipt,
  CreditCard,
  Tag,
  Truck,
  Navigation,
  BarChart3,
  Building2,
  FileCheck,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  X,
  LogOut,
  HelpCircle,
  Bell,
  Settings,
  Layers,
  Store,
  LifeBuoy,
  User,
  Home,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { MobileHeaderLogo } from '../common/MobileHeaderLogo';
import { NAV_GROUPS } from '../../constants/navigation';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { useOrders } from '../../hooks/useOrders';
import { useEnquiries } from '../../hooks/useEnquiries';
import { useInventory } from '../../hooks/useInventory';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../utils/cn';

const ICON_MAP = {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  Package,
  Warehouse,
  Receipt,
  CreditCard,
  Tag,
  Truck,
  Navigation,
  BarChart3,
  Building2,
  FileCheck,
  HelpCircle,
  Bell,
  Settings,
  Layers,
  Store,
  LifeBuoy,
};

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { user } = useAuthStore();
  const { profile } = useSellerProfile();

  // Real counts for live badges
  const { orders = [] } = useOrders();
  const { enquiries = [] } = useEnquiries();
  const { inventory = [] } = useInventory();
  const { unreadCount = 0 } = useNotifications();

  const newOrdersCount = orders.filter((o) => o.orderStatus === 'New' || o.orderStatus === 'Pending').length;
  const newEnquiriesCount = enquiries.filter((e) => e.status === 'New').length;
  const lowStockCount = inventory.filter((i) => i.isLowStock || i.isOutOfStock).length;
  const pendingPaymentsCount = orders.filter((o) => o.paymentStatus === 'Pending' || o.paymentStatus === 'Unpaid').length;

  const badgeCounts = {
    newOrdersCount,
    newEnquiriesCount,
    lowStockCount,
    pendingPaymentsCount,
    unreadNotificationsCount: unreadCount,
  };

  // Expanded submenus state
  const [openMenus, setOpenMenus] = useState(() => {
    const allItems = NAV_GROUPS.flatMap((g) => g.items);
    const activeParent = allItems.find((item) =>
      item.children?.some((child) => location.pathname.startsWith(child.path))
    );
    return activeParent ? { [activeParent.title]: true } : {};
  });

  const toggleSubmenu = (title) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isExpanded = sidebarOpen || mobileMenuOpen;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col h-screen max-h-screen bg-[#0B132B] text-slate-300 border-r border-slate-800/80 shadow-xl transition-all duration-300 ease-spring md:static shrink-0 select-none',
          // Desktop collapsible width
          sidebarOpen ? 'w-64' : 'w-20',
          // Mobile slide-in
          mobileMenuOpen ? 'translate-x-0 !w-72' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* ================= MOBILE SIDEBAR DRAWER (Matches Screen 2: Sidebar Menu Mobile) ================= */}
        <div className="flex md:hidden flex-col h-full bg-[#0A1E3F] text-slate-200">
          {/* Top Brand Header */}
          <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-800/60 bg-[#091A36]">
            <MobileHeaderLogo to="/seller/dashboard" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-white hover:bg-white/10 rounded-lg cursor-pointer"
              aria-label="Close Menu"
            >
              <X className="w-6 h-6 stroke-[2]" />
            </button>
          </div>

          {/* User Profile Bar */}
          <div className="p-4 flex items-center gap-3 border-b border-slate-800/60">
            <div className="w-11 h-11 rounded-full bg-slate-700/80 text-white flex items-center justify-center shrink-0 border border-slate-600/50">
              <User className="w-5 h-5 text-slate-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {profile?.name || user?.name || 'Seller'}
              </h3>
              <p className="text-[11px] text-blue-200/60 truncate">
                {user?.email || profile?.email || ''}
              </p>
            </div>
          </div>

          {/* Navigation Links matching Screen 2 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 custom-scrollbar">
            {[
              { label: 'Dashboard', to: '/seller/dashboard', icon: Home },
              { label: 'Products', to: '/seller/products', icon: Package },
              { label: 'Orders', to: '/seller/orders', icon: FileText, badge: newOrdersCount > 0 ? newOrdersCount : undefined },
              { label: 'Customers', to: '/seller/customers', icon: Users },
              { label: 'Inventory', to: '/seller/inventory', icon: Warehouse },
              { label: 'Reports', to: '/seller/analytics', icon: BarChart3 },
              { label: 'Payments', to: '/seller/payments', icon: CreditCard },
              { label: 'Settings', to: '/seller/settings', icon: Settings },
              { label: 'Help & Support', to: '/seller/support', icon: HelpCircle },
            ].map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/seller/dashboard'
                  ? location.pathname === '/seller/dashboard' || location.pathname === '/seller'
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Logout */}
          <div className="p-4 border-t border-slate-800/60 bg-[#08152B]">
            <button
              type="button"
              onClick={async () => {
                setMobileMenuOpen(false);
                await useAuthStore.getState().logout();
                window.location.href = '/login';
              }}
              className="flex items-center gap-2.5 text-xs font-bold text-red-500 hover:text-red-400 transition-colors w-full py-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ================= DESKTOP SIDEBAR (100% Unchanged) ================= */}
        <div className="hidden md:flex flex-col h-full w-full">
          {/* Brand Header */}
          <div className={cn(
            'flex h-16 shrink-0 items-center border-b border-slate-800/80 bg-[#0B132B] transition-all',
            isExpanded ? 'justify-between pl-3 pr-2' : 'justify-center px-2'
          )}>
            {isExpanded ? (
              <>
                <div className="flex items-center overflow-hidden">
                  <BrandLogo size="sidebar" theme="dark" to="/seller/dashboard" showBadge={true} badgeText="SELLER WEB HUB" />
                </div>

                <div className="flex items-center gap-1">
                  {/* Desktop Collapse Toggle */}
                  <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden md:flex p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                  title="Collapse Sidebar"
                  aria-label="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>

                {/* Mobile Close Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-white md:hidden cursor-pointer"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed State: Neat and clean centered toggle button */
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:flex w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white items-center justify-center shadow-2xs transition-all cursor-pointer group"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <PanelLeft className="w-5 h-5 group-hover:scale-105 transition-transform" />
            </button>
          )}
        </div>

        {/* Grouped Navigation */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3.5 space-y-4 custom-scrollbar">
          {NAV_GROUPS.map((navGroup) => (
            <div key={navGroup.group} className="space-y-1">
              {/* Group Heading */}
              {isExpanded && (
                <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
                  {navGroup.group}
                </div>
              )}

              {navGroup.items.map((item) => {
                const Icon = ICON_MAP[item.icon] || Package;
                const hasChildren = item.children && item.children.length > 0;
                const isMenuOpen = openMenus[item.title];
                const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : null;

                if (hasChildren) {
                  const isChildActive = item.children.some((child) => location.pathname === child.path);

                  return (
                    <div key={item.title} className="space-y-1">
                      <div className="flex items-center w-full">
                        <NavLink
                          to={item.path}
                          onClick={() => {
                            setOpenMenus((prev) => ({ ...prev, [item.title]: true }));
                          }}
                          className={({ isActive }) =>
                            cn(
                              'flex flex-1 items-center text-xs font-medium rounded-lg transition-all text-left group cursor-pointer py-2',
                              isExpanded ? 'justify-between px-3' : 'justify-center px-0',
                              isActive
                                ? 'text-white bg-slate-800/90 border border-slate-700 font-semibold'
                                : isChildActive
                                ? 'text-white font-semibold'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            )
                          }
                          title={!isExpanded ? item.title : undefined}
                        >
                          <div className={cn('flex items-center min-w-0', isExpanded ? 'gap-2.5' : 'justify-center')}>
                            <Icon
                              className={cn(
                                'w-4 h-4 shrink-0 transition-colors',
                                location.pathname === item.path || isChildActive
                                  ? 'text-orange-400 font-bold'
                                  : 'text-slate-400 group-hover:text-slate-200'
                              )}
                            />
                            {isExpanded && <span className="truncate">{item.title}</span>}
                          </div>

                          {isExpanded && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {badgeCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                                  {badgeCount}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleSubmenu(item.title);
                                }}
                                className="p-0.5 hover:bg-slate-800 rounded cursor-pointer"
                                aria-label="Toggle submenu"
                              >
                                {isMenuOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </button>
                            </div>
                          )}
                        </NavLink>
                      </div>

                      {isMenuOpen && isExpanded && (
                        <div className="pl-3.5 py-1 space-y-1 border-l border-slate-800 ml-5 my-1">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon ? ICON_MAP[child.icon] : null;
                            return (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                end={child.path === item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                  cn(
                                    'flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-lg transition-all font-medium',
                                    isActive
                                      ? 'text-orange-400 bg-orange-500/10 font-semibold border border-orange-500/30'
                                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                  )
                                }
                              >
                                {ChildIcon && (
                                  <ChildIcon className="w-3.5 h-3.5 shrink-0 transition-colors" />
                                )}
                                <span className="truncate">{child.title}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center text-xs font-medium rounded-lg transition-all group py-2',
                        isExpanded ? 'justify-between px-3' : 'justify-center px-0',
                        isActive
                          ? 'border border-orange-500/90 bg-orange-500/15 text-white font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      )
                    }
                    title={!isExpanded ? item.title : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <div className={cn('flex items-center min-w-0', isExpanded ? 'gap-2.5' : 'justify-center')}>
                          <Icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-colors',
                              isActive ? 'text-orange-400' : 'text-slate-400 group-hover:text-slate-200'
                            )}
                          />
                          {isExpanded && <span className="truncate">{item.title}</span>}
                        </div>

                        {isExpanded && badgeCount > 0 && (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                              isActive ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
                            )}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Verification Status Card & Sign Out */}
        <div className="shrink-0 p-3 border-t border-slate-800/80 bg-[#091024] space-y-2">
          <NavLink
            to="/seller/company/verification"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'flex items-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/60 hover:border-orange-500/40 transition-all group shadow-sm',
              isExpanded ? 'gap-2.5' : 'justify-center'
            )}
            title="GST & MSME Compliant"
          >
            <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            {isExpanded && (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-200 group-hover:text-orange-400 transition-colors">
                  Verified B2B Seller
                </p>
                <p className="text-[10px] text-slate-400 font-medium">GST Compliant</p>
              </div>
            )}
          </NavLink>

          <button
            type="button"
            onClick={async () => {
              setMobileMenuOpen(false);
              await useAuthStore.getState().logout();
              window.location.href = '/login';
            }}
            className={cn(
              'flex w-full items-center py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border border-slate-800/80 hover:border-rose-900/50 transition-all cursor-pointer',
              isExpanded ? 'gap-2.5 px-3' : 'justify-center px-0'
            )}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-rose-400" />
            {isExpanded && <span>Sign Out</span>}
          </button>
        </div>
        </div>
      </aside>
    </>
  );
}
