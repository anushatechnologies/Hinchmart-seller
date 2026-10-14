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
    <div className="space-y-6">
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
              {formatCurrency(kpis.totalRevenue || 0)}
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
              {kpis.totalOrders ?? orders.length}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-blue-600 font-bold flex items-center gap-0.5 truncate">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Real-time
              </span>
              <span className="text-amber-600 font-semibold truncate ml-1">{kpis.pendingOrders || orders.filter(o => o.orderStatus === 'Pending' || o.status === 'Pending').length} Pending</span>
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
              {kpis.totalProducts ?? products.length}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-emerald-600 font-bold truncate">{products.length} registered</span>
              <span className="text-slate-500 font-medium truncate ml-1">{kpis.activeProducts ?? products.filter(p => p.status === 'Active' || p.active).length} Live</span>
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
              {customers.length}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-purple-600 font-bold truncate">{customers.length} enrolled</span>
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
              {enquiries.length}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-indigo-600 font-bold truncate">{kpis.newEnquiries || enquiries.filter(e => e.status === 'New').length} Unquoted</span>
              <span className="text-amber-600 font-semibold group-hover:underline truncate ml-1">
                Reply →
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. PRODUCT SECTION (INTELLIGENT EMPTY / PRODUCT LIST STATE) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        {products.length === 0 ? (
          /* A) WHEN THE SELLER HAS NO PRODUCTS */
          <div className="py-8 px-4 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                No products yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add your first construction product to start selling on HinchMart.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/seller/products/add">
                <Button variant="primary" size="md" leftIcon={Plus}>
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* B) WHEN THE SELLER HAS PRODUCTS */
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Active Catalog Products
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                      {products.length} {products.length === 1 ? 'Product' : 'Products'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live products available in your B2B seller inventory
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <Link to="/seller/products/add">
                  <Button variant="primary" size="sm" leftIcon={Plus}>
                    Add Product
                  </Button>
                </Link>
                <Link to="/seller/products">
                  <Button variant="secondary" size="sm">
                    View All Products
                  </Button>
                </Link>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {products.slice(0, 4).map((product) => {
                const isOutOfStock = (product.stock || 0) === 0;
                const isLowStock =
                  product.stock > 0 && product.stock <= (product.lowStockThreshold || 20);

                return (
                  <Link
                    key={product.id}
                    to={`/seller/products/${product.id}`}
                    className="rounded-xl border border-slate-200/80 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200 group flex flex-col justify-between overflow-hidden shadow-2xs"
                  >
                    {/* Product Image Thumbnail */}
                    <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name || product.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getProductImageUrl({ ...product, images: [] });
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Top Category Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs shadow-xs truncate max-w-[120px]">
                          {product.category || 'Civil & Structural'}
                        </span>
                      </div>
                      {/* Top Right Stock Badge */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs border ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-3.5 flex flex-col justify-between flex-1">
                      <div>
                        {/* Title & Brand */}
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                          {product.name || product.title}
                        </h4>
                        {product.brand && (
                          <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                            Brand: <strong className="text-slate-700">{product.brand}</strong>
                          </p>
                        )}
                      </div>

                      {/* Bottom: Price & Stock */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                          <span className="font-extrabold text-slate-900">
                            {formatCurrency(product.sellingPrice || product.price || 0)}
                            <span className="text-[10px] text-slate-500 font-normal"> / {product.unit || 'PCS'}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Available</span>
                          <span className="font-mono font-bold text-slate-700">
                            {product.stockQty ?? product.stock ?? 0} {product.unit || 'PCS'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
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
                  {formatCurrency(kpis.averageOrderValue || 0)}
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
                  {formatCurrency((kpis.totalRevenue || 0) / 30)}
                </span>
              </div>
            </div>

            {/* Recharts Chart Area */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                            ID: {item.sku || item.id} • {item.warehouseName || 'Hub Yard'}
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

      {/* 6. RECENT ACTIVITY & PENDING RFQ SHORTCUTS (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Recent Activity Feed */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Recent Operational Activity</h3>
            </div>
            <span className="text-xs text-slate-400">Live platform audit log</span>
          </div>

          {activityFeed.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No recent activity</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Dispatches, customer updates, and catalog actions will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activityFeed.map((act) => {
                const Icon = act.icon;
                return (
                  <Link
                    key={act.id}
                    to={act.link}
                    className="py-3 flex items-start justify-between gap-3 group hover:bg-slate-50/80 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${act.dotColor}`} />
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {act.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {act.desc}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium text-slate-400 shrink-0 mt-0.5">
                      {act.time}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 Cols: Pending Buyer RFQs / Quotations Action */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Buyer RFQs Needing Quotes</h3>
              </div>
              <Link to="/seller/enquiries" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                All RFQs →
              </Link>
            </div>

            {enquiries.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No pending buyer inquiries</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Incoming buyer quotation requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enquiries.slice(0, 3).map((enq) => (
                  <div
                    key={enq.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 block">{enq.buyerName}</span>
                        <span className="text-[10.5px] text-slate-500 font-medium">{enq.company}</span>
                      </div>
                      <StatusBadge status={enq.status} />
                    </div>

                    <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200/60 text-[11px] text-slate-700">
                      <strong className="text-slate-900">Requested:</strong> {enq.productName} ({enq.quantityRequired})
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-400">{formatDate(enq.createdAt)}</span>
                      <Link to="/seller/quotations/create" state={{ enquiry: enq }}>
                        <span className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                          Send Quotation <ArrowRight className="w-3 h-3" />
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-center">
            <Link
              to="/seller/quotations"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1"
            >
              View Sent Quotations & Pricing Tiers <ChevronRight className="w-3.5 h-3.5" />
            </Link>
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
    </div>
  );
}
