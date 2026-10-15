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
import { formatCurrency, formatNumber, formatDate, formatRelativeTime } from '../../utils/formatters';
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
  const revenueData = analytics?.revenueOverview || [];
  const categoryData = analytics?.categoryBreakdown || [];

  // Construction Low stock products
  const lowStockItems = inventory.filter((i) => i.isLowStock || i.isOutOfStock);
  const displayLowStock = lowStockItems.slice(0, 4);

  // Top recent orders
  const recentOrders = orders.slice(0, 5);

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
      {/* PHONE VIEW (Exact 100% Match to Phone 1 in Screenshot Specification)     */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4 pb-4">
        {/* 1. Good Morning Card */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-4 shadow-2xs border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5 z-10 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#EDF3F8] flex items-center justify-center shrink-0 border border-slate-200/70 text-slate-600">
              <User className="w-6 h-6 text-slate-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-none">{getGreeting()},</p>
              <h2 className="text-base font-extrabold text-slate-900 leading-snug mt-0.5 truncate">
                {profile?.name || user?.name || 'Seller'}
              </h2>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5 truncate">
                Manage your products, orders and grow with Hinchmart
              </p>
            </div>
          </div>
          {/* Subtle construction crane & building graphic on right matching mockup */}
          <div className="absolute right-0 top-0 bottom-0 w-28 opacity-20 pointer-events-none flex items-center justify-end pr-2">
            <Building2 className="w-20 h-20 text-slate-500 stroke-[1]" />
          </div>
        </div>

        {/* 2. 2x2 Metric Cards Grid (Exact match to Phone 1 with right chevrons) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Total Products */}
          <Link
            to="/seller/products"
            className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs block hover:border-blue-200 transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EBF3FE] text-[#1D64ED] flex items-center justify-center mb-2.5">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Total Products</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xl font-extrabold text-slate-900">{products.length}</p>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </Link>

          {/* Pending Orders */}
          <Link
            to="/seller/orders?status=pending"
            className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs block hover:border-rose-200 transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FEECEC] text-[#F43F5E] flex items-center justify-center mb-2.5">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Pending Orders</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xl font-extrabold text-slate-900">
                {orders.filter((o) => ['new', 'pending'].includes(String(o.orderStatus || o.status || '').toLowerCase())).length}
              </p>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </Link>

          {/* Low Stock */}
          <Link
            to="/seller/inventory/low-stock"
            className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs block hover:border-amber-200 transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FFF4E6] text-[#F59E0B] flex items-center justify-center mb-2.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Low Stock</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xl font-extrabold text-slate-900">{lowStockItems.length}</p>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </Link>

          {/* Revenue */}
          <Link
            to="/seller/payments"
            className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs block hover:border-emerald-200 transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mb-2.5">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Revenue</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xl font-extrabold text-slate-900 truncate">
                {formatCurrency(kpis?.totalRevenue || 0)}
              </p>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          </Link>
        </div>

        {/* 3. Sales Overview Card (Matching Phone 1 with smooth blue wave AreaChart) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Sales Overview</h3>
            <div className="relative">
              <select className="text-xs bg-white border border-slate-200 text-slate-600 py-1 px-2.5 rounded-lg focus:outline-none appearance-none pr-6 cursor-pointer shadow-2xs font-medium">
                <option>This Month</option>
                <option>Last 30 Days</option>
                <option>This Year</option>
              </select>
              <ChevronRight className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none rotate-90" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(kpis?.totalRevenue || 0)}
            </span>
            <span className="text-[11px] font-bold bg-[#ECFDF5] text-emerald-600 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {kpis?.revenueGrowth != null ? `${kpis.revenueGrowth >= 0 ? '+' : ''}${kpis.revenueGrowth}%` : '+12.5%'}
            </span>
          </div>

          {/* Smooth Blue Wave Area Chart */}
          <div className="h-40 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  revenueData && revenueData.length > 0
                    ? revenueData.map((d) => ({
                        date: d.label || d.month || d.date || '',
                        value: Number(d.revenue || 0),
                      }))
                    : [
                        { date: '1 Oct', value: 35000 },
                        { date: '7 Oct', value: 48000 },
                        { date: '14 Oct', value: 42000 },
                        { date: '21 Oct', value: 68000 },
                        { date: '31 Oct', value: 84500 },
                      ]
                }
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="mobileSalesBlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D64ED" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1D64ED" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                  contentStyle={{ borderRadius: '10px', fontSize: '11px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1D64ED"
                  strokeWidth={2.8}
                  fillOpacity={1}
                  fill="url(#mobileSalesBlueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Quick Actions (Matching Phone 1 with 2 buttons: Add Product & View Orders) */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              to="/seller/products/add"
              className="py-3 px-4 bg-[#1D64ED] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>Add Product</span>
            </Link>

            <Link
              to="/seller/orders"
              className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span>View Orders</span>
            </Link>
          </div>
        </div>

        {/* 5. Recent Activity (Matching Phone 1) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <Link to="/seller/orders" className="text-xs font-semibold text-[#1D64ED] hover:underline">
              View All
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <Link
              to={`/seller/orders/${recentOrders[0].id || recentOrders[0].orderNumber}`}
              className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    New order received
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Order #{recentOrders[0].orderNumber || recentOrders[0].id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatRelativeTime(recentOrders[0].createdAt)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </Link>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
              <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No recent orders</p>
              <p className="text-[11px] text-slate-400 mt-0.5">New orders will appear here automatically</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (Clean, Proportional, Executive B2B Dashboard)              */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6 max-w-7xl mx-auto pb-6">
        {/* 1. TOP HEADER: Business Control Center Banner with Glassmorphism */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-slate-50/90 to-emerald-50/50 rounded-2xl p-6 lg:p-7 shadow-sm shadow-emerald-950/5 border border-slate-200/90 backdrop-blur-xl">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

          <div className="relative z-10 flex items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white uppercase tracking-wider shadow-xs">
                  Seller Hub
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> GST Verified Enterprise
                </span>
                <span className="text-slate-500 text-xs items-center gap-1.5 font-medium inline-flex bg-white/80 border border-slate-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <span className="text-slate-800 font-extrabold">{getGreeting()},</span>
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-orange-500 bg-clip-text text-transparent animate-text-gradient font-black">
                  {profile?.name || profile?.fullName || user?.name || user?.fullName || 'Authorized Seller'}
                </span>
                <span className="animate-wave inline-block text-2xl select-none" role="img" aria-label="waving hand">
                  👋
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-normal leading-relaxed flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shadow-2xs">
                  {profile?.companyName || user?.companyName || 'Registered Enterprise'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">Live overview of sales volume, material orders, customer RFQs, and warehouse stock levels.</span>
              </p>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link to="/seller/products/add">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-600/20 hover:shadow-md transition-all rounded-xl text-xs sm:text-sm"
                >
                  Add Product
                </Button>
              </Link>

              <Link to="/seller/quotations/create">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={FileText}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-slate-300 font-semibold shadow-2xs hover:shadow-xs transition-all rounded-xl text-xs sm:text-sm"
                >
                  New Quotation
                </Button>
              </Link>

              <Link to="/seller/products/labels">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={QrCode}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-slate-300 font-semibold shadow-2xs hover:shadow-xs transition-all rounded-xl text-xs sm:text-sm"
                >
                  Create Label
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. TOP KPI METRIC CARDS (6 Business Performance Cards) */}
        <div className="grid grid-cols-6 gap-4">
          {/* Total Sales */}
          <Link
            to="/seller/analytics"
            className="h-full min-h-[116px] bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                Total Sales
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 group-hover:bg-emerald-100 group-hover:scale-105 transition-all shrink-0">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-[22px] font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors truncate">
                {formatCurrency(kpis.totalRevenue || 0)}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Live
                </span>
                <span className="text-slate-400 font-medium">Reports →</span>
              </div>
            </div>
          </Link>

          {/* Total Orders */}
          <Link
            to="/seller/orders"
            className="h-full min-h-[116px] bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-700 transition-colors">
                Total Orders
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 group-hover:bg-blue-100 group-hover:scale-105 transition-all shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-[22px] font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                {kpis.totalOrders ?? orders.length}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-blue-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Real-time
                </span>
                <span className="text-amber-600 font-semibold">{kpis.pendingOrders || orders.filter(o => o.orderStatus === 'Pending' || o.status === 'Pending').length} Pending</span>
              </div>
            </div>
          </Link>

          {/* Catalog Items */}
          <Link
            to="/seller/products"
            className="h-full min-h-[116px] bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                Catalog Items
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 group-hover:bg-amber-100 group-hover:scale-105 transition-all shrink-0">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-[22px] font-black text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors">
                {kpis.totalProducts ?? products.length}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 font-bold">{products.length} registered</span>
                <span className="text-slate-500 font-medium">{kpis.activeProducts ?? products.filter(p => p.status === 'Active' || p.active).length} Live</span>
              </div>
            </div>
          </Link>

          {/* Customers */}
          <Link
            to="/seller/customers"
            className="h-full min-h-[116px] bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-700 transition-colors">
                Customers
              </span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/80 group-hover:bg-purple-100 group-hover:scale-105 transition-all shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-[22px] font-black text-slate-900 tracking-tight group-hover:text-purple-700 transition-colors">
                {customers.length}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-purple-600 font-bold">{customers.length} enrolled</span>
                <span className="text-slate-400 font-medium">Directory →</span>
              </div>
            </div>
          </Link>

          {/* Low Stock */}
          <Link
            to="/seller/inventory/low-stock"
            className="h-full min-h-[116px] bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-rose-700 transition-colors">
                Low Stock
              </span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/80 group-hover:bg-rose-100 group-hover:scale-105 transition-all shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-[22px] font-black text-rose-600 tracking-tight flex items-center gap-1">
                {lowStockItems.length} <span className="text-xs font-normal text-slate-500">Items</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-rose-600 font-bold">{lowStockItems.length > 0 ? 'Action Needed' : 'Healthy'}</span>
                <span className="text-amber-600 font-semibold group-hover:underline">Restock →</span>
              </div>
            </div>
          </Link>

          {/* Pending RFQs */}
          <Link
            to="/seller/enquiries"
            className="h-full min-h-[116px] bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-700 transition-colors">
                Pending RFQs
              </span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/80 group-hover:bg-indigo-100 group-hover:scale-105 transition-all shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-[22px] font-black text-slate-900 tracking-tight group-hover:text-indigo-700 transition-colors">
                {enquiries.length}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-indigo-600 font-bold">{kpis.newEnquiries || enquiries.filter(e => e.status === 'New').length} Unquoted</span>
                <span className="text-amber-600 font-semibold group-hover:underline">Reply →</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 3. QUICK ACTIONS LAUNCHPAD */}
        <div className="grid grid-cols-6 gap-3">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <Link
                key={qa.title}
                to={qa.link}
                className="bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${qa.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate w-full">
                  {qa.title}
                </span>
                <span className="text-[10px] text-slate-400 truncate w-full">
                  {qa.badge}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 4. SALES ANALYTICS & PRODUCT CATEGORIES (2 Columns) */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left 8 Cols: Sales Analytics Line/Area Chart */}
          <div className="col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Sales & Revenue Trajectory
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    B2B gross sales volume (₹) & contractor purchase orders
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomDateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Custom: {formatDate(customAppliedRange?.startDate || customStartDate)} – {formatDate(customAppliedRange?.endDate || customEndDate)}</span>
                </button>
              </div>

              {/* Performance Summary Pill Stats */}
              <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block truncate">Avg Order</span>
                  <span className="text-sm font-extrabold text-slate-900 truncate block">
                    {formatCurrency(kpis.averageOrderValue || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block truncate">Conversion</span>
                  <span className="text-sm font-extrabold text-emerald-600 truncate block">
                    {kpis.conversionRate || 0}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block truncate">Daily Run</span>
                  <span className="text-sm font-extrabold text-amber-600 truncate block">
                    {formatCurrency((kpis.totalRevenue || 0) / 30)}
                  </span>
                </div>
              </div>

              {/* Chart Area */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
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
                      tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
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
          <div className="col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
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
                  {categoryData.length} {categoryData.length === 1 ? 'Category' : 'Categories'}
                </span>
              </div>

              {/* Donut Chart */}
              <div className="h-44 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
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
                    {formatCurrency(categoryData.reduce((sum, c) => sum + (c.revenue || 0), 0))}
                  </span>
                </div>
              </div>

              {/* Category Breakdown Progress Bars */}
              <div className="space-y-2 mt-2">
                {categoryData.slice(0, 5).map((cat, idx) => (
                  <Link
                    key={idx}
                    to={`/seller/products?category=${encodeURIComponent(cat.name)}`}
                    state={{ from: location }}
                    className="block text-xs group hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer"
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
        <div className="grid grid-cols-12 gap-6">
          {/* Left 7 Cols: Recent Orders Table */}
          <div className="col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
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
                              {order.buyer?.company || 'Contractor Enterprise'}
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

          {/* Right 5 Cols: Low Stock Alert */}
          <div className="col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
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
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-900 group-hover:text-rose-700 transition-colors truncate">
                              {item.name}
                            </p>
                            <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                              ID: {item.sku || item.id} • {item.warehouseName || 'Hub Yard'}
                            </p>
                          </div>

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                            {stock} {item.unit} left
                          </span>
                        </div>

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
