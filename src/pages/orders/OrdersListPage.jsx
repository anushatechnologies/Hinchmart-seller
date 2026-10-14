import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Download,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  UserCheck,
  Zap,
  Navigation,
  CheckSquare,
  Plus,
  Printer,
  MoreVertical,
  RotateCcw,
  SlidersHorizontal,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { ORDER_FILTER_TABS } from '../../constants/orderStatus';
import {
  normalizeStatusFilter,
  orderMatchesStatus,
  getStatusEmptyMessage,
} from '../../utils/orderFilterUtils';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { exportToCsv, triggerPrint } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export function OrdersListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useSellerProfile();

  // URL query-state driven status filter
  const currentStatusParam = searchParams.get('status');
  const activeStatus = normalizeStatusFilter(currentStatusParam);

  const handleStatusSelect = (statusKey) => {
    const normalized = normalizeStatusFilter(statusKey);
    const newParams = new URLSearchParams(searchParams);
    if (normalized === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', normalized);
    }
    setSearchParams(newParams);
  };

  // Other Filters State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [deliveryFilter, setDeliveryFilter] = useState('All');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [moreActionMenuId, setMoreActionMenuId] = useState(null);

  const moreMenuRef = useRef(null);

  // Close more actions popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreActionMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all orders with query status & error handling
  const { orders = [], isLoading, isError, error, refetch } = useOrders();

  // Compute live summary statistics for metric cards
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => ['new', 'pending'].includes((o.orderStatus || '').toLowerCase())).length;
    const confirmed = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'confirmed').length;
    const processing = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'processing').length;
    const ready = orders.filter((o) =>
      ['ready for dispatch', 'packed / ready', 'packed', 'ready'].includes((o.orderStatus || '').toLowerCase())
    ).length;
    const dispatched = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'dispatched').length;
    const inTransit = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'in transit').length;
    const delivered = orders.filter((o) =>
      ['delivered', 'completed'].includes((o.orderStatus || '').toLowerCase())
    ).length;
    const completed = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'completed').length;
    const cancelled = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'cancelled').length;

    return {
      total,
      pending,
      confirmed,
      processing,
      ready,
      dispatched,
      inTransit,
      delivered,
      completed,
      cancelled,
    };
  }, [orders]);

  // Extract unique customers for dropdown
  const uniqueCustomers = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      if (o.buyer?.company) set.add(o.buyer.company);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Apply filters on frontend data
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter via query state & canonical matcher
      if (!orderMatchesStatus(order.orderStatus, activeStatus)) {
        return false;
      }

      // 2. Search query filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchNumber = order.orderNumber?.toLowerCase().includes(q);
        const matchCompany = order.buyer?.company?.toLowerCase().includes(q);
        const matchBuyer = order.buyer?.name?.toLowerCase().includes(q);
        const matchInvoice = order.invoice?.invoiceNumber?.toLowerCase().includes(q);
        const matchCity = order.deliveryAddress?.city?.toLowerCase().includes(q);
        const matchSite = order.deliveryAddress?.siteName?.toLowerCase().includes(q);
        const matchItems = (order.items || []).some(
          (i) => i.name?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q)
        );

        if (!matchNumber && !matchCompany && !matchBuyer && !matchInvoice && !matchCity && !matchSite && !matchItems) {
          return false;
        }
      }

      // 3. Customer dropdown
      if (customerFilter !== 'All') {
        if (order.buyer?.company !== customerFilter) return false;
      }

      // 4. Payment status dropdown
      if (paymentFilter !== 'All') {
        if (!order.paymentStatus?.toLowerCase().includes(paymentFilter.toLowerCase())) return false;
      }

      // 5. Delivery status dropdown
      if (deliveryFilter !== 'All') {
        if (order.orderStatus?.toLowerCase() !== deliveryFilter.toLowerCase()) return false;
      }

      // 6. Advanced filters
      if (minPrice && order.totalAmount < Number(minPrice)) return false;
      if (maxPrice && order.totalAmount > Number(maxPrice)) return false;
      if (startDate && new Date(order.createdAt) < new Date(startDate)) return false;
      if (endDate && new Date(order.createdAt) > new Date(endDate)) return false;

      return true;
    });
  }, [orders, activeStatus, searchTerm, customerFilter, paymentFilter, deliveryFilter, minPrice, maxPrice, startDate, endDate]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchTerm, customerFilter, paymentFilter, deliveryFilter, minPrice, maxPrice, startDate, endDate, pageSize]);

  // Pagination slicing
  const totalFilteredCount = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  // Reset all filters
  const handleResetFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('status');
    setSearchParams(newParams);
    setSearchTerm('');
    setCustomerFilter('All');
    setPaymentFilter('All');
    setDeliveryFilter('All');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
  };

  // Export to CSV
  const handleExport = () => {
    const rows = filteredOrders.map((o) => ({
      OrderNumber: o.orderNumber,
      OrderDate: o.createdAt,
      BuyerCompany: o.buyer?.company,
      BuyerContact: o.buyer?.name,
      BuyerCity: o.deliveryAddress?.city,
      SiteName: o.deliveryAddress?.siteName,
      ItemsSummary: (o.items || []).map((i) => `${i.name} (${i.quantity} ${i.unit})`).join('; '),
      TotalAmount: o.totalAmount,
      PaymentStatus: o.paymentStatus,
      OrderStatus: o.orderStatus,
      InvoiceNumber: o.invoice?.invoiceNumber || 'No Invoice',
    }));
    exportToCsv('HinchMart_Seller_Orders', rows);
  };

  // Open Invoice Preview Modal
  const openInvoiceModal = (order) => {
    setSelectedInvoiceOrder(order);
    setInvoiceModalOpen(true);
  };

  // Helper for status badge icon and styles
  const renderDeliveryBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'dispatched') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <Truck className="w-3.5 h-3.5 text-blue-600" /> Dispatched
        </span>
      );
    }
    if (s === 'in transit') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-2xs">
          <Navigation className="w-3.5 h-3.5 text-cyan-600" /> In Transit
        </span>
      );
    }
    if (s === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Completed
        </span>
      );
    }
    if (s === 'packed / ready' || s === 'ready for dispatch' || s === 'packed' || s === 'ready') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
          <Package className="w-3.5 h-3.5 text-indigo-600" /> Packed / Ready
        </span>
      );
    }
    if (s === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-purple-600" /> Processing
        </span>
      );
    }
    if (s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Confirmed
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
        <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
      </span>
    );
  };

  // Helper for payment badge
  const renderPaymentBadge = (paymentStatus) => {
    const ps = String(paymentStatus || '').toLowerCase();
    if (ps === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-pulse" /> Paid
        </span>
      );
    }
    if (ps === 'escrow secured') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-pulse" /> Paid
        </span>
      );
    }
    if (ps === 'partially paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Partially Paid
        </span>
      );
    }
    if (ps.includes('credit')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unpaid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unpaid
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 1. Header with Title, Subtitle, and Top Action Buttons (No outer box container) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage your construction orders, track delivery, and view order performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer card-lift press-scale"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/seller/orders/create', { state: { from: location } })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-all cursor-pointer card-lift press-scale"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards (7 Cards Row with Image 1 Animation & Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Card 1: All Orders */}
        <button
          type="button"
          onClick={() => handleStatusSelect('all')}
          aria-pressed={activeStatus === 'all'}
          aria-label={`Filter by All Orders, ${stats.total} total orders`}
          className={cn(
            'w-full text-left h-full min-h-[124px] bg-white rounded-xl p-4 border shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
            activeStatus === 'all'
              ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20'
              : 'border-slate-200/90 hover:border-emerald-300'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider transition-colors truncate',
                activeStatus === 'all' ? 'text-emerald-700' : 'text-slate-500 group-hover:text-emerald-700'
              )}
            >
              All Orders
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 group-hover:bg-emerald-100 group-hover:scale-105 transition-all duration-200 flex-shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <div className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                {stats.total}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-[11px] gap-1 overflow-hidden">
              <span className="text-emerald-600 font-bold flex items-center gap-0.5 flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5" /> Real-time
              </span>
              <span className="text-slate-400 font-medium truncate">Total Orders</span>
            </div>
          </div>
        </button>

        {/* Card 2: Pending */}
        <button
          type="button"
          onClick={() => handleStatusSelect('pending')}
          aria-pressed={activeStatus === 'pending'}
          aria-label={`Filter by Pending, ${stats.pending} orders awaiting action`}
          className={cn(
            'w-full text-left h-full min-h-[124px] bg-white rounded-xl p-4 border shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
            activeStatus === 'pending'
              ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20'
              : 'border-slate-200/90 hover:border-amber-300'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider transition-colors truncate',
                activeStatus === 'pending' ? 'text-amber-700' : 'text-slate-500 group-hover:text-amber-700'
              )}
            >
              Pending
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 group-hover:bg-amber-100 group-hover:scale-105 transition-all duration-200 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <div className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors">
                {stats.pending}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-[11px] gap-1 overflow-hidden">
              <span className="text-amber-600 font-bold flex-shrink-0">Action Needed</span>
              <span className="text-amber-600 font-semibold group-hover:underline truncate">Awaiting Action →</span>
            </div>
          </div>
        </button>

        {/* Card 3: Confirmed */}
        <button
          type="button"
          onClick={() => handleStatusSelect('confirmed')}
          aria-pressed={activeStatus === 'confirmed'}
          aria-label={`Filter by Confirmed, ${stats.confirmed} orders confirmed`}
          className={cn(
            'w-full text-left h-full min-h-[124px] bg-white rounded-xl p-4 border shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            activeStatus === 'confirmed'
              ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/20'
              : 'border-slate-200/90 hover:border-blue-300'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider transition-colors truncate',
                activeStatus === 'confirmed' ? 'text-blue-700' : 'text-slate-500 group-hover:text-blue-700'
              )}
            >
              Confirmed
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-200 flex-shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <div className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                {stats.confirmed}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-[11px] gap-1 overflow-hidden">
              <span className="text-blue-600 font-bold flex items-center gap-0.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
              </span>
              <span className="text-slate-400 font-medium truncate">Orders →</span>
            </div>
          </div>
        </button>

        {/* Card 4: Processing */}
        <button
          type="button"
          onClick={() => handleStatusSelect('processing')}
          aria-pressed={activeStatus === 'processing'}
          aria-label={`Filter by Processing, ${stats.processing} orders in processing`}
          className={cn(
            'w-full text-left h-full min-h-[124px] bg-white rounded-xl p-4 border shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
            activeStatus === 'processing'
              ? 'border-purple-400 ring-2 ring-purple-100 bg-purple-50/20'
              : 'border-slate-200/90 hover:border-purple-300'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider transition-colors truncate',
                activeStatus === 'processing' ? 'text-purple-700' : 'text-slate-500 group-hover:text-purple-700'
              )}
            >
              Processing
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/80 group-hover:bg-purple-100 group-hover:scale-105 transition-all duration-200 flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <div className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-purple-700 transition-colors">
                {stats.processing}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-[11px] gap-1 overflow-hidden">
              <span className="text-purple-600 font-bold flex-shrink-0">In Bay</span>
              <span className="text-slate-400 font-medium truncate">In Progress →</span>
            </div>
          </div>
        </button>

        {/* Card 5: Dispatched */}
        <button
          type="button"
          onClick={() => handleStatusSelect('dispatched')}
          aria-pressed={activeStatus === 'dispatched'}
          aria-label={`Filter by Dispatched, ${stats.dispatched} orders dispatched`}
          className={cn(
            'w-full text-left h-full min-h-[124px] bg-white rounded-xl p-4 border shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2',
            activeStatus === 'dispatched'
              ? 'border-cyan-400 ring-2 ring-cyan-100 bg-cyan-50/20'
              : 'border-slate-200/90 hover:border-cyan-300'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider transition-colors truncate',
                activeStatus === 'dispatched' ? 'text-cyan-700' : 'text-slate-500 group-hover:text-cyan-700'
              )}
            >
              Dispatched
            </span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-200/80 group-hover:bg-cyan-100 group-hover:scale-105 transition-all duration-200 flex-shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <div className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-cyan-700 transition-colors">
                {stats.dispatched}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-[11px] gap-1 overflow-hidden">
              <span className="text-cyan-600 font-bold flex items-center gap-0.5 flex-shrink-0">
                <Truck className="w-3.5 h-3.5" /> Fleet
              </span>
              <span className="text-slate-400 font-medium truncate">Out for Delivery</span>
            </div>
          </div>
        </button>

        {/* Card 6: Delivered */}
        <button
          type="button"
          onClick={() => handleStatusSelect('delivered')}
          aria-pressed={activeStatus === 'delivered'}
          aria-label={`Filter by Delivered, ${stats.delivered} orders delivered`}
          className={cn(
            'w-full text-left h-full min-h-[124px] bg-white rounded-xl p-4 border shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
            activeStatus === 'delivered'
              ? 'border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50/20'
              : 'border-slate-200/90 hover:border-emerald-300'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider transition-colors truncate',
                activeStatus === 'delivered' ? 'text-emerald-700' : 'text-slate-500 group-hover:text-emerald-700'
              )}
            >
              Delivered
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 group-hover:bg-emerald-100 group-hover:scale-105 transition-all duration-200 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <div className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                {stats.delivered}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-[11px] gap-1 overflow-hidden">
              <span className="text-emerald-600 font-bold flex items-center gap-0.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
              </span>
              <span className="text-slate-400 font-medium truncate">Delivered →</span>
            </div>
          </div>
        </button>

        {/* Card 7: Cancelled */}
        <button
          type="button"
          onClick={() => handleStatusSelect('cancelled')}
          aria-pressed={activeStatus === 'cancelled'}
          aria-label={`Filter by Cancelled, ${stats.cancelled} orders cancelled`}
          className={cn(
            'w-full text-left h-full min-h-[124px] bg-white rounded-xl p-4 border shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2',
            activeStatus === 'cancelled'
              ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20'
              : 'border-slate-200/90 hover:border-rose-300'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider transition-colors truncate',
                activeStatus === 'cancelled' ? 'text-rose-700' : 'text-slate-500 group-hover:text-rose-700'
              )}
            >
              Cancelled
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/80 group-hover:bg-rose-100 group-hover:scale-105 transition-all duration-200 flex-shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <div className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight group-hover:text-rose-700 transition-colors">
                {stats.cancelled}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-[11px] gap-1 overflow-hidden">
              <span className="text-rose-600 font-bold flex-shrink-0">Voided</span>
              <span className="text-slate-400 font-medium truncate">Cancelled Orders</span>
            </div>
          </div>
        </button>
      </div>

      {/* 3. Status Tabs Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto select-none custom-scrollbar">
        <nav className="flex space-x-6 min-w-max pb-0" aria-label="Order Status Tabs">
          {ORDER_FILTER_TABS.map((tab) => {
            const normalizedTab = normalizeStatusFilter(tab.id);
            const isActive = activeStatus === normalizedTab;
            let count = null;
            if (normalizedTab === 'pending') count = stats.pending;
            else if (normalizedTab === 'confirmed') count = stats.confirmed;
            else if (normalizedTab === 'processing') count = stats.processing;
            else if (normalizedTab === 'packed / ready') count = stats.ready;
            else if (normalizedTab === 'dispatched') count = stats.dispatched;
            else if (normalizedTab === 'in transit') count = stats.inTransit;
            else if (normalizedTab === 'delivered') count = stats.delivered;
            else if (normalizedTab === 'completed') count = stats.completed;
            else if (normalizedTab === 'cancelled') count = stats.cancelled;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusSelect(tab.id)}
                className={cn(
                  'whitespace-nowrap py-3 px-1 border-b-2 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer',
                  isActive
                    ? 'border-slate-950 text-slate-950 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                )}
              >
                <span>{tab.label}</span>
                {count !== null && count > 0 && (
                  <span
                    className={cn(
                      'text-[11px] font-bold px-2 py-0.2 rounded-full transition-colors',
                      isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Search and Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, Company, Product, Invoice..."
              className="w-full h-10 pl-9 pr-4 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:border-emerald-600 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Customer Dropdown */}
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:border-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="All">All Customers</option>
              {uniqueCustomers.map((cust) => (
                <option key={cust} value={cust}>
                  {cust}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Dropdown */}
          <div className="w-full sm:w-44 shrink-0">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:border-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="All">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Escrow Secured">Escrow Secured</option>
              <option value="Credit">Credit (30 Days)</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Delivery Status Dropdown */}
          <div className="w-full sm:w-44 shrink-0">
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:border-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="All">All Delivery Status</option>
              <option value="New">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Ready for Dispatch">Packed / Ready</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Advanced Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-3.5 h-10 text-xs font-bold rounded-lg border transition-all cursor-pointer shrink-0 press-scale',
              advancedOpen || minPrice || maxPrice || startDate || endDate
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            )}
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Filters</span>
          </button>
        </div>

        {/* Expandable Advanced Filters Tray */}
        {advancedOpen && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Min Order Value (₹)</label>
              <input
                type="number"
                placeholder="e.g. 500000"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Max Order Value (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full h-8 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Orders Table with row-hover-accent animation effect */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                <th className="py-3 px-4">ORDER ID</th>
                <th className="py-3 px-4">ORDER DATE</th>
                <th className="py-3 px-4">CUSTOMER / BUYER</th>
                <th className="py-3 px-4">MATERIALS</th>
                <th className="py-3 px-4">ORDER VALUE</th>
                <th className="py-3 px-4">PAYMENT STATUS</th>
                <th className="py-3 px-4">DELIVERY STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading orders manifest...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800">Failed to Load Orders</h3>
                      <p className="text-xs text-slate-400">{error?.message || 'Unable to fetch orders from server.'}</p>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-md cursor-pointer hover:bg-rose-100"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Loading</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800">{getStatusEmptyMessage(activeStatus)}</h3>
                      <p className="text-xs text-slate-400">
                        {activeStatus === 'all'
                          ? 'Try changing your search keywords or resetting filters to see results.'
                          : `There are currently no orders with ${activeStatus} status.`}
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md cursor-pointer hover:bg-emerald-100"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset All Filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const invoice = order.invoice;
                  const hasInvoice = Boolean(invoice && invoice.invoiceNumber);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/seller/orders/${order.id}`, { state: { from: location } })}
                      className="row-hover-accent hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* 1. ORDER ID & INVOICE TAG */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="font-mono font-bold text-slate-900 block hover:text-emerald-600 transition-colors">
                          {order.orderNumber}
                        </span>
                        <div className="mt-1">
                          {hasInvoice ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInvoiceModal(order);
                              }}
                              className="inline-block px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-all"
                              title="View Tax Invoice"
                            >
                              {invoice.invoiceNumber}
                            </button>
                          ) : (
                            <span className="inline-block text-[10px] text-slate-400 font-medium">
                              Invoice not generated
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. ORDER DATE & TIME */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="font-semibold text-slate-800 block">{formatDate(order.createdAt)}</span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* 3. CUSTOMER / BUYER */}
                      <td className="py-3.5 px-4 align-middle max-w-[220px]">
                        <span className="font-bold text-slate-900 block truncate">{order.buyer?.company}</span>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {order.buyer?.name} • {order.deliveryAddress?.city || 'Site'}
                        </span>
                      </td>

                      {/* 4. MATERIALS */}
                      <td className="py-3.5 px-4 align-middle max-w-[280px]">
                        <span className="font-medium text-slate-800 line-clamp-1 block">
                          {(order.items || []).map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          {order.items?.length || 1} item{order.items?.length > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* 5. ORDER VALUE */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="font-black text-slate-900 block text-xs">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {order.paymentStatus === 'Escrow Secured'
                            ? 'Escrow Secured'
                            : order.paymentStatus.includes('Credit')
                            ? order.paymentStatus
                            : order.paymentStatus === 'Paid'
                            ? 'Paid'
                            : 'Advance Payment'}
                        </span>
                      </td>

                      {/* 6. PAYMENT STATUS */}
                      <td className="py-3.5 px-4 align-middle">
                        {renderPaymentBadge(order.paymentStatus)}
                      </td>

                      {/* 7. DELIVERY STATUS */}
                      <td className="py-3.5 px-4 align-middle">
                        {renderDeliveryBadge(order.orderStatus)}
                      </td>

                      {/* 8. ACTION */}
                      <td className="py-3.5 px-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 relative">
                          <button
                            type="button"
                            onClick={() => navigate(`/seller/orders/${order.id}`, { state: { from: location } })}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer press-scale"
                          >
                            View Details
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setMoreActionMenuId(moreActionMenuId === order.id ? null : order.id)
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {moreActionMenuId === order.id && (
                              <div
                                ref={moreMenuRef}
                                className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-left"
                              >
                                {hasInvoice && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMoreActionMenuId(null);
                                      openInvoiceModal(order);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>View Invoice</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setMoreActionMenuId(null);
                                    navigate(`/seller/tracking`);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  <Navigation className="w-3.5 h-3.5 text-slate-400" />
                                  <span>View Tracking</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setMoreActionMenuId(null);
                                    navigate(`/seller/orders/${order.id}`);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Full Lifecycle</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Pagination Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold text-slate-900">{totalFilteredCount === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="font-bold text-slate-900">{Math.min(startIndex + pageSize, totalFilteredCount)}</span> of{' '}
            <span className="font-bold text-slate-900">{totalFilteredCount}</span> orders
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-md focus:outline-none cursor-pointer"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>

              {/* Page Number Pills */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-7 h-7 rounded-md text-xs font-bold transition-all cursor-pointer',
                      isCurrent ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span className="px-1 text-slate-400 font-bold">...</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={cn(
                      'w-7 h-7 rounded-md text-xs font-bold transition-all cursor-pointer',
                      currentPage === totalPages ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                    )}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Commercial Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <Modal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          title="Commercial Tax Invoice"
          subtitle={`Invoice ${selectedInvoiceOrder.invoice?.invoiceNumber} for ${selectedInvoiceOrder.orderNumber}`}
          maxWidth="max-w-3xl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setInvoiceModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={triggerPrint} leftIcon={Printer}>
                Print / Download Invoice
              </Button>
            </>
          }
        >
          <div className="printable-area p-6 space-y-6 text-xs text-slate-800 bg-white">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {profile?.companyName || 'Seller Enterprise'}
                </h2>
                {profile?.address?.completeAddress && (
                  <p className="text-slate-600">
                    {profile.address.completeAddress}
                  </p>
                )}
                {profile?.legal?.gstin && (
                  <p className="font-mono text-slate-700">GSTIN: {profile.legal.gstin}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold uppercase block text-emerald-600 tracking-wider">
                  TAX INVOICE
                </span>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  {selectedInvoiceOrder.invoice?.invoiceNumber}
                </p>
                <p className="text-slate-600">
                  Invoice Date: {formatDate(selectedInvoiceOrder.invoice?.invoiceDate || selectedInvoiceOrder.createdAt)}
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Order Ref: {selectedInvoiceOrder.orderNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold block text-[11px] text-slate-500 uppercase">BILLED TO:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoiceOrder.buyer?.company || selectedInvoiceOrder.buyer?.name}</p>
                <p className="text-slate-600 mt-0.5">{selectedInvoiceOrder.deliveryAddress?.address}</p>
                {selectedInvoiceOrder.buyer?.gstin && (
                  <p className="font-mono text-slate-700 mt-1">
                    GSTIN: {selectedInvoiceOrder.buyer.gstin}
                  </p>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold block text-[11px] text-slate-500 uppercase">SHIPPED TO SITE:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedInvoiceOrder.deliveryAddress?.siteName}
                </p>
                <p className="text-slate-600 mt-0.5">{selectedInvoiceOrder.deliveryAddress?.address}</p>
                <p className="text-slate-700 mt-1">
                  {selectedInvoiceOrder.deliveryAddress?.city}, {selectedInvoiceOrder.deliveryAddress?.state}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-300 text-[11px] uppercase">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">HSN Code</th>
                    <th className="p-2.5">Qty</th>
                    <th className="p-2.5">Unit Rate</th>
                    <th className="p-2.5">GST Rate</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(selectedInvoiceOrder.items || []).map((i, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-semibold text-slate-900">{i.name}</td>
                      <td className="p-2.5 font-mono text-slate-600">{i.hsnCode || i.hsn || i.sku || '-'}</td>
                      <td className="p-2.5 font-bold">
                        {i.quantity} {i.unit}
                      </td>
                      <td className="p-2.5">{formatCurrency(i.unitPrice)}</td>
                      <td className="p-2.5 font-bold text-emerald-700">{i.gstRate}%</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-between items-end pt-2">
              <div className="text-[11px] text-slate-500 max-w-xs space-y-1">
                <p className="font-semibold text-slate-700">Terms & Conditions:</p>
                <p>
                  This is a statutory computer-generated commercial tax invoice issued under GST Act 2017. All payments
                  cleared through HinchMart B2B Trade Escrow.
                </p>
              </div>
              <div className="text-right space-y-1 w-64 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoiceOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (CGST + SGST):</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoiceOrder.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Freight Charges:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedInvoiceOrder.freightCharges || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-300">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(selectedInvoiceOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
