import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Package,
  ShoppingCart,
  HelpCircle,
  IndianRupee,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Upload,
  FileText,
  BookOpen,
  QrCode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Warehouse,
  Users,
  User,
  Building2,
  Layers,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Activity,
  Calendar,
  Sparkles,
  Zap,
  Boxes,
  Truck,
  FileCheck2,
  Tag,
  LogOut,
  Store,
  ExternalLink,
  ChevronDown,
  BarChart2,
} from 'lucide-react';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { useAuthStore } from '../../store/authStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useProducts } from '../../hooks/useProducts';
import { useOrders } from '../../hooks/useOrders';
import { useEnquiries } from '../../hooks/useEnquiries';
import { useInventory } from '../../hooks/useInventory';
import { useCustomers } from '../../hooks/useCustomers';
import { useLabelHistory } from '../../hooks/useLabels';
import { useNotifications } from '../../hooks/useNotifications';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { getProductImageUrl } from '../../utils/productImages.js';

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  // Custom date range state
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [customDateError, setCustomDateError] = useState('');
  const [customAppliedRange, setCustomAppliedRange] = useState({
    startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { profile } = useSellerProfile();
  const activeAnalyticsParams = useMemo(() => {
    return customAppliedRange
      ? { timeRange: 'custom', startDate: customAppliedRange.startDate, endDate: customAppliedRange.endDate }
      : { timeRange: 'custom', startDate: customStartDate, endDate: customEndDate };
  }, [customAppliedRange, customStartDate, customEndDate]);

  const { analytics, isLoading: isAnalyticsLoading } = useAnalytics(activeAnalyticsParams);
  const { products = [] } = useProducts();
  const { orders = [] } = useOrders();
  const { enquiries = [] } = useEnquiries();
  const { inventory = [] } = useInventory();
  const { customers = [] } = useCustomers();
  const { history: labelHistory = [] } = useLabelHistory();
  const { notifications = [] } = useNotifications();

  const handleApplyCustomDateRange = (e) => {
    if (e) e.preventDefault();
    if (!customStartDate || !customEndDate) {
      setCustomDateError('Please select both start and end dates.');
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      setCustomDateError('Start date cannot be after end date.');
      return;
    }
    setCustomDateError('');
    setCustomAppliedRange({ startDate: customStartDate, endDate: customEndDate });
    setCustomDateModalOpen(false);
  };

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const kpis = analytics?.kpis || {};
  const rawRevenueOverview = analytics?.revenueOverview || [];
  const rawCategoryBreakdown = analytics?.categoryBreakdown || [];

  // 100% Real dynamic calculations from active hooks and data stores
  const totalRevenue = Number(kpis.totalRevenue || 0) || orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) =>
    ['new', 'pending', 'processing'].includes(String(o.orderStatus || o.status || '').toLowerCase())
  ).length;
  const totalProductsCount = products.length;
  const lowStockItems = inventory.filter((i) => i.isLowStock || i.isOutOfStock || (i.stock != null && i.lowStockThreshold != null && i.stock <= i.lowStockThreshold));
  const displayLowStock = lowStockItems.slice(0, 4);
  const recentOrders = orders.slice(0, 5);
  const totalCustomersCount = customers.length;
  const totalEnquiriesCount = enquiries.length;

  // Real chart trajectory derived directly from analytics or real order transactions
  const revenueChartData = useMemo(() => {
    if (rawRevenueOverview && rawRevenueOverview.length > 0) {
      return rawRevenueOverview.map((d) => ({
        label: d.label || d.month || d.date || '',
        revenue: Number(d.revenue || 0),
        orders: Number(d.orders || 0),
      }));
    }
    if (orders.length > 0) {
      const map = {};
      orders.forEach((o) => {
        const d = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent';
        map[d] = (map[d] || 0) + Number(o.totalAmount || o.total || 0);
      });
      return Object.entries(map).map(([label, revenue]) => ({ label, revenue, orders: 1 }));
    }
    return [];
  }, [rawRevenueOverview, orders]);

  // Real category breakdown derived dynamically from live products catalog
  const categoryData = useMemo(() => {
    if (rawCategoryBreakdown && rawCategoryBreakdown.length > 0) {
      return rawCategoryBreakdown;
    }
    if (!products || products.length === 0) return [];
    const catMap = {};
    const palette = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
    products.forEach((p) => {
      const cat = p.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const total = products.length;
    return Object.entries(catMap).map(([name, count], idx) => ({
      name,
      count,
      value: Math.round((count / total) * 100),
      color: palette[idx % palette.length],
      revenue: 0,
    }));
  }, [rawCategoryBreakdown, products]);

  // Quick Action Items
  const quickActions = [
    {
      title: 'Add Product',
      desc: 'List new steel, cement, or materials',
      icon: Plus,
      link: '/seller/products/add',
      color: 'bg-amber-500/10 text-amber-600 border-amber-200 hover:border-amber-300 hover:bg-amber-500/20',
      badge: 'Listing',
    },
    {
      title: 'Add Customer',
      desc: 'Enroll contractor or enterprise client',
      icon: Users,
      link: '/seller/customers',
      color: 'bg-blue-500/10 text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-500/20',
      badge: 'Client',
    },
    {
      title: 'Create Label',
      desc: 'Generate QR & Code128 dispatch tags',
      icon: QrCode,
      link: '/seller/products/labels',
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-500/20',
      badge: 'Barcode',
    },
    {
      title: 'New Quotation',
      desc: 'Prepare & send buyer RFQ estimate',
      icon: FileText,
      link: '/seller/quotations/create',
      color: 'bg-purple-500/10 text-purple-600 border-purple-200 hover:border-purple-300 hover:bg-purple-500/20',
      badge: 'Quote',
    },
    {
      title: 'View Orders',
      desc: 'Manage fulfillment & dispatches',
      icon: ShoppingCart,
      link: '/seller/orders',
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-500/20',
      badge: 'Dispatch',
    },
    {
      title: 'Bulk Upload',
      desc: 'Batch import products via CSV/Excel',
      icon: Upload,
      link: '/seller/products/bulk-upload',
      color: 'bg-rose-500/10 text-rose-600 border-rose-200 hover:border-rose-300 hover:bg-rose-500/20',
      badge: 'Catalog',
    },
  ];

  // Live Activity Stream
  const activityFeed = notifications.slice(0, 5).map((n) => ({
    id: n.id,
    title: n.title,
    desc: n.message,
    time: formatDate(n.createdAt),
    type: n.type || 'system',
    icon: Activity,
    dotColor: 'bg-emerald-500',
    link: n.link || '/seller/notifications',
  }));

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE PHONE VIEW (Exact 100% Match to Screen 1 Specification)          */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3 pb-3">
        {/* Good Morning, Seller Card (Matching Screen 1) */}
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#EBF3FE] text-[#1D64ED] flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-none">{getGreeting()},</p>
              <h2 className="text-base font-extrabold text-slate-900 leading-snug mt-0.5 truncate">
                {profile?.name || user?.name || 'Seller'}
              </h2>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5 truncate">
                Manage your store and grow with Hinchmart
              </p>
            </div>
          </div>
          <Link
            to="/seller/company/profile"
            className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-[#1D64ED] text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
          >
            <span>View Store</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* 2x2 Metric Cards Grid (Matching Screen 1) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Total Products */}
          <Link
            to="/seller/products"
            className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs block hover:border-blue-200 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#EBF3FE] text-[#1D64ED] flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-2">Total Products</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {totalProductsCount}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
              In Catalog
            </p>
          </Link>

          {/* Pending Orders */}
          <Link
            to="/seller/orders?status=pending"
            className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs block hover:border-rose-200 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#FEECEC] text-[#F43F5E] flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-2">Pending Orders</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {pendingOrdersCount}
            </p>
            <p className="text-[10px] font-semibold text-amber-600 mt-0.5">
              {pendingOrdersCount > 0 ? 'Requires action' : 'All cleared'}
            </p>
          </Link>

          {/* Low Stock */}
          <Link
            to="/seller/inventory/low-stock"
            className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs block hover:border-amber-200 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#FEECEC] text-[#F43F5E] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-2">Low Stock</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {lowStockItems.length}
            </p>
            <p className="text-[10px] font-semibold text-rose-500 mt-0.5">
              {lowStockItems.length > 0 ? 'Restock alert' : 'Healthy inventory'}
            </p>
          </Link>

          {/* Total Revenue */}
          <Link
            to="/seller/payments"
            className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs block hover:border-emerald-200 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-2">Total Revenue</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5 truncate">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
              Gross turnover
            </p>
          </Link>
        </div>

        {/* Sales Overview Card (Solid Royal Blue Card matching Screen 1) */}
        <div className="bg-gradient-to-br from-[#1E6BEE] via-[#1A62E2] to-[#1253CE] rounded-2xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Sales Overview</h3>
            <div className="px-2 py-1 rounded-lg border border-white/25 bg-white/10 text-[11px] font-semibold text-white flex items-center gap-1 cursor-pointer">
              <span>This Month</span>
              <ChevronDown className="w-3 h-3 text-white/80" />
            </div>
          </div>

          <div className="mt-2.5">
            <p className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-[11px] font-medium text-emerald-300 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              {kpis?.revenueGrowth != null ? `${kpis.revenueGrowth >= 0 ? '+' : ''}${kpis.revenueGrowth}% from last period` : 'Live recorded sales'}
            </p>
          </div>

          {/* Recharts Area Chart with smooth line, area gradient, and white point dots */}
          <div className="h-36 w-full mt-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  revenueChartData.length > 0
                    ? revenueChartData.map((d) => ({
                        date: d.label || '',
                        value: Number(d.revenue || 0),
                      }))
                    : [{ date: 'Current', value: totalRevenue }]
                }
                margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="screen1BlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9.5, fill: 'rgba(255,255,255,0.7)', fontWeight: 500 }}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                  itemStyle={{ color: '#1D64ED' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#screen1BlueGrad)"
                  dot={{ r: 3.5, fill: '#ffffff', stroke: '#1D64ED', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#ffffff', stroke: '#1D64ED', strokeWidth: 2.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions (4 Colorful Rounded Cards matching Screen 1) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
            <Link to="/seller/products" className="text-xs font-bold text-[#1D64ED] hover:underline">
              See All
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Add Product */}
            <Link
              to="/seller/products/add"
              className="bg-[#EEF4FF] rounded-2xl p-2.5 flex flex-col items-center text-center hover:bg-blue-100/60 transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#1D64ED] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">
                Add Product
              </span>
            </Link>

            {/* Manage Orders */}
            <Link
              to="/seller/orders"
              className="bg-[#FFF4EC] rounded-2xl p-2.5 flex flex-col items-center text-center hover:bg-orange-100/60 transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#FF7A00] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">
                Manage Orders
              </span>
            </Link>

            {/* Inventory */}
            <Link
              to="/seller/inventory"
              className="bg-[#F6EEFD] rounded-2xl p-2.5 flex flex-col items-center text-center hover:bg-purple-100/60 transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#9333EA] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">
                Inventory
              </span>
            </Link>

            {/* View Reports */}
            <Link
              to="/seller/analytics"
              className="bg-[#EDF9F1] rounded-2xl p-2.5 flex flex-col items-center text-center hover:bg-emerald-100/60 transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                <BarChart2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">
                View Reports
              </span>
            </Link>
          </div>
        </div>

        {/* Recent Orders Section (Matching Screen 1) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
            <Link to="/seller/orders" className="text-xs font-bold text-[#1D64ED] hover:underline">
              See All
            </Link>
          </div>

          <div className="space-y-2">
            {recentOrders.length > 0 ? (
              recentOrders.slice(0, 2).map((ord) => (
                <Link
                  key={ord.id}
                  to={`/seller/orders/${ord.id}`}
                  className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs text-[#1D64ED]">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        #{ord.orderNumber || ord.id}
                      </p>
                      <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                        {ord.buyer?.company || ord.buyer?.contactName || ord.customerName || 'Customer'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(ord.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] inline-block mb-0.5">
                        {ord.orderStatus || ord.status || 'Pending'}
                      </span>
                      <p className="text-xs font-black text-slate-900">
                        {formatCurrency(ord.totalAmount)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center shadow-2xs">
                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">No recent orders</p>
                <p className="text-[11px] text-slate-400 mt-0.5">New purchase orders will appear here automatically</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= LAPTOP / DESKTOP DASHBOARD (100% Unchanged) ================= */}
      <div className="hidden md:block space-y-6">
        {/* 1. TOP HEADER: Business Control Center Banner with Glassmorphism Effect */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-slate-50/90 to-emerald-50/50 rounded-xl sm:rounded-2xl p-4 sm:p-7 shadow-sm shadow-emerald-950/5 border border-slate-200/90 backdrop-blur-xl">
        {/* Ambient Aurora Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white uppercase tracking-wider shadow-xs">
                Control Center
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 inline-flex items-center gap-1 backdrop-blur-xs">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" /> GST & Enterprise Verified
              </span>
              <span className="text-slate-500 text-xs items-center gap-1.5 font-medium hidden sm:inline-flex bg-white/80 border border-slate-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-slate-800 font-extrabold">
                {getGreeting()},
              </span>
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-orange-500 bg-clip-text text-transparent animate-text-gradient font-black">
                {profile?.name || profile?.fullName || user?.name || user?.fullName || 'Authorized Seller'}
              </span>
              <span className="animate-wave inline-block text-xl sm:text-3xl select-none" role="img" aria-label="waving hand">
                👋
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2 max-w-2xl font-normal leading-relaxed flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shadow-2xs">
                {profile?.companyName || user?.companyName || 'Registered Enterprise'}
              </span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="hidden sm:inline">Real-time overview of sales volume, material orders, customer RFQs, and warehouse stock levels.</span>
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0 pt-1 lg:pt-0">
            <Link to="/seller/quotations/create" className="flex-1 sm:flex-initial">
              <Button
                variant="primary"
                size="sm"
                leftIcon={FileText}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-600/20 hover:shadow-md transition-all rounded-lg sm:rounded-xl text-xs sm:text-sm"
              >
                New Quotation
              </Button>
            </Link>

            <Link to="/seller/products/labels" className="flex-1 sm:flex-initial">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={QrCode}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-slate-300 font-semibold shadow-2xs hover:shadow-xs transition-all rounded-lg sm:rounded-xl text-xs sm:text-sm"
              >
                Create Label
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TOP KPI METRIC CARDS (6 Business Performance Cards - 2 Columns on Mobile, 6 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Total Sales -> Analytics */}
        <Link
          to="/seller/analytics"
          className="h-full min-h-[110px] sm:min-h-[124px] bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group"
          title="View Revenue Reports & Analytics"
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors truncate">
              Total Sales
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 group-hover:bg-emerald-100 group-hover:scale-105 transition-all duration-200 shrink-0">
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-lg sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors truncate">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Live
              </span>
              <span className="text-slate-400 font-medium hidden sm:inline">Reports →</span>
            </div>
          </div>
        </Link>

        {/* Total Orders -> Orders */}
        <Link
          to="/seller/orders"
          className="h-full min-h-[110px] sm:min-h-[124px] bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group"
          title="View Order Fulfillment Board"
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-700 transition-colors truncate">
              Total Orders
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-200 shrink-0">
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-lg sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
              {totalOrdersCount}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-blue-600 font-bold flex items-center gap-0.5 truncate">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Real-time
              </span>
              <span className="text-amber-600 font-semibold truncate ml-1">{pendingOrdersCount} Pending</span>
            </div>
          </div>
        </Link>

        {/* Total Products -> Products */}
        <Link
          to="/seller/products"
          className="h-full min-h-[110px] sm:min-h-[124px] bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group"
          title="Manage Product Catalog"
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors truncate">
              Catalog Items
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 group-hover:bg-amber-100 group-hover:scale-105 transition-all duration-200 shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-lg sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors">
              {totalProductsCount}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-emerald-600 font-bold truncate">{totalProductsCount} registered</span>
              <span className="text-slate-500 font-medium truncate ml-1">{products.filter((p) => p.status === 'Active' || p.active).length} Live</span>
            </div>
          </div>
        </Link>

        {/* Active Customers -> Customers */}
        <Link
          to="/seller/customers"
          className="h-full min-h-[110px] sm:min-h-[124px] bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group"
          title="Manage Customer Directory"
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-700 transition-colors truncate">
              Customers
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/80 group-hover:bg-purple-100 group-hover:scale-105 transition-all duration-200 shrink-0">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-lg sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-purple-700 transition-colors">
              {totalCustomersCount}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-purple-600 font-bold truncate">{totalCustomersCount} enrolled</span>
              <span className="text-slate-400 font-medium hidden sm:inline">Directory →</span>
            </div>
          </div>
        </Link>

        {/* Low Stock Alerts -> Inventory */}
        <Link
          to="/seller/inventory/low-stock"
          className="h-full min-h-[110px] sm:min-h-[124px] bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group"
          title="View Low Stock Items"
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-rose-700 transition-colors truncate">
              Low Stock
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/80 group-hover:bg-rose-100 group-hover:scale-105 transition-all duration-200 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-lg sm:text-[22px] font-black text-rose-600 tracking-tight flex items-center gap-1">
              {lowStockItems.length} <span className="text-[10px] sm:text-xs font-normal text-slate-500">Items</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-rose-600 font-bold truncate">{lowStockItems.length > 0 ? 'Action Needed' : 'Healthy'}</span>
              <span className="text-amber-600 font-semibold group-hover:underline truncate ml-1">
                Restock →
              </span>
            </div>
          </div>
        </Link>

        {/* Pending RFQs -> Enquiries */}
        <Link
          to="/seller/enquiries"
          className="h-full min-h-[110px] sm:min-h-[124px] bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group"
          title="Review Pending Buyer RFQs"
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-700 transition-colors truncate">
              Pending RFQs
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/80 group-hover:bg-indigo-100 group-hover:scale-105 transition-all duration-200 shrink-0">
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-lg sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-indigo-700 transition-colors">
              {totalEnquiriesCount}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-indigo-600 font-bold truncate">{totalEnquiriesCount} Unquoted</span>
              <span className="text-amber-600 font-semibold group-hover:underline truncate ml-1">
                Reply →
              </span>
            </div>
          </div>
        </Link>
      </div>


      {/* 4. SALES ANALYTICS & PRODUCT CATEGORIES (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Sales Analytics Line/Area Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Sales & Revenue Trajectory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  B2B gross sales volume (₹) & contractor purchase orders
                </p>
              </div>

              {/* Time Range Selector: ONLY Custom Date Range */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCustomDateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                  title="Filter Sales Chart by Custom Date Range"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Custom: {formatDate(customAppliedRange?.startDate || customStartDate)} – {formatDate(customAppliedRange?.endDate || customEndDate)}</span>
                </button>
              </div>
            </div>

            {/* Performance Summary Pill Stats */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 my-3 sm:my-4 p-2 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block truncate">Avg Order</span>
                <span className="text-[11px] sm:text-sm font-extrabold text-slate-900 truncate block">
                  {formatCurrency(kpis.averageOrderValue || (totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0))}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block truncate">Conversion</span>
                <span className="text-[11px] sm:text-sm font-extrabold text-emerald-600 truncate block">
                  {kpis.conversionRate || 0}%
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block truncate">Daily Run</span>
                <span className="text-[11px] sm:text-sm font-extrabold text-amber-600 truncate block">
                  {formatCurrency(Math.round(totalRevenue / 30))}
                </span>
              </div>
            </div>

            {/* Recharts Chart Area */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    revenueChartData.length > 0
                      ? revenueChartData
                      : [{ label: 'Current', revenue: totalRevenue, orders: totalOrdersCount }]
                  }
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) =>
                      val >= 100000
                        ? `₹${(val / 100000).toFixed(1)}L`
                        : `₹${(val / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      name === 'revenue' ? formatCurrency(val) : val,
                      name === 'revenue' ? 'Gross Revenue' : 'Purchase Orders',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Gross B2B Turnover
            </span>
            <Link to="/seller/analytics" className="font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              Full Analytics Report <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right 4 Cols: Product Category Overview (Donut Chart + List) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-amber-500" />
                  Product Category Overview
                </h3>
                <p className="text-xs text-slate-500">Construction material distribution</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {effectiveCategoryData.length} {effectiveCategoryData.length === 1 ? 'Category' : 'Categories'}
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-44 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={effectiveCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {effectiveCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val}% (${formatCurrency(item.payload.revenue)})`,
                      item.payload.name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Volume</span>
                <span className="text-xs font-black text-slate-900">
                  {formatCurrency(effectiveCategoryData.reduce((sum, c) => sum + (c.revenue || 0), 0))}
                </span>
              </div>
            </div>

            {/* Category Breakdown Progress Bars */}
            <div className="space-y-2 mt-2">
              {effectiveCategoryData.slice(0, 5).map((cat, idx) => (
                <Link
                  key={idx}
                  to={`/seller/products?category=${encodeURIComponent(cat.name)}`}
                  state={{ from: location }}
                  className="block text-xs group hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer"
                  title={`View ${cat.name} Products`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                    <span className="flex items-center gap-1.5 truncate group-hover:text-amber-600 transition-colors">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 shrink-0 ml-2">
                      {cat.count || 0} SKUs ({cat.value}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.value}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-center">
            <Link
              to="/seller/products"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center justify-center gap-1"
            >
              Browse All Catalog Categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. RECENT ORDERS & LOW STOCK ALERTS (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Recent Orders Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-amber-500" />
                  Recent Orders
                </h3>
                <p className="text-xs text-slate-500">Live order fulfillment and transport dispatch</p>
              </div>
              <Link to="/seller/orders">
                <Button variant="secondary" size="sm">
                  View All Orders
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-2.5 px-3">Order</th>
                    <th className="py-2.5 px-3">Customer / Consignee</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No orders received yet. New purchase orders will appear here.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-900 block hover:text-amber-600">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 truncate max-w-[150px]">
                            {order.buyer?.company || order.buyer?.contactName || order.customerName || 'Customer'}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            {order.items?.[0]?.name}
                          </p>
                        </td>
                        <td className="py-3 px-3 font-extrabold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={order.orderStatus} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/seller/orders/${order.id}`, { state: { from: location } })}
                            className="text-amber-600 hover:text-amber-700 font-bold text-xs"
                          >
                            View →
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Showing latest {recentOrders.length} dispatches</span>
            <Link to="/seller/orders" className="font-semibold text-amber-600 hover:underline">
              Fulfillment Board →
            </Link>
          </div>
        </div>

        {/* Right 5 Cols: Low Stock Alert (Construction Material Focus) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Low Stock Alerts</h3>
                  <p className="text-xs text-slate-500">Construction materials below reorder level</p>
                </div>
              </div>
              <Link to="/seller/inventory/low-stock">
                <Button variant="secondary" size="sm">
                  View Inventory
                </Button>
              </Link>
            </div>

            {displayLowStock.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">All inventory levels are healthy</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No products below reorder thresholds</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayLowStock.map((item) => {
                  const stock = item.availableStock ?? item.stock ?? 0;
                  const threshold = item.lowStockThreshold || 50;
                  const percent = Math.min(100, Math.round((stock / threshold) * 100));

                  return (
                    <Link
                      key={item.id}
                      to={`/seller/products`}
                      state={{ from: location, search: item.name }}
                      className="block p-3 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50/70 transition-all text-xs cursor-pointer group"
                      title={`View ${item.name} stock & inventory`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 group-hover:text-rose-700 transition-colors truncate">
                            {item.name}
                          </p>
                          <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                            ID: {item.sku || item.id}{item.warehouseName ? ` • ${item.warehouseName}` : ''}
                          </p>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                          {stock} {item.unit} left
                        </span>
                      </div>

                      {/* Stock Level Bar */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>Current: <strong className="text-slate-900">{stock} {item.unit}</strong></span>
                          <span>Threshold: <strong className="text-slate-700">{threshold} {item.unit}</strong></span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="text-rose-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> High priority replenishment
            </span>
            <Link to="/seller/inventory" className="font-bold text-amber-600 hover:text-amber-700">
              Manage Warehouse Stock →
            </Link>
          </div>
        </div>
      </div>
    </div>

      {/* Custom Date Range Modal */}
      <Modal
        isOpen={customDateModalOpen}
        onClose={() => setCustomDateModalOpen(false)}
        title="Custom Analytics Date Range"
        subtitle="Select a custom date window for sales trajectory analysis"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCustomDateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApplyCustomDateRange}>
              Apply Date Range
            </Button>
          </>
        }
      >
        <form onSubmit={handleApplyCustomDateRange} className="space-y-4 py-2">
          {customDateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{customDateError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                From Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCustomDateError('');
                }}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                To Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCustomDateError('');
                }}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Analytics metrics, conversion velocity and sales graph will recalculate for the selected window.
          </p>
        </form>
      </Modal>
    </>
  );
}
