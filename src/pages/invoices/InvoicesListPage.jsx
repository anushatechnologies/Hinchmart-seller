import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  IndianRupee,
  Receipt,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { exportToCsv, triggerPrint } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'All', label: 'All Payment Status' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Escrow Secured', label: 'Escrow Secured' },
  { value: 'Credit (30 Days)', label: 'Credit (30 Days)' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Settled', label: 'Settled' },
];

const getPaymentBadge = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'paid' || s === 'settled') {
    return {
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotClass: 'bg-emerald-500',
    };
  }
  if (s === 'escrow secured') {
    return {
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      dotClass: 'bg-teal-500',
    };
  }
  if (s === 'partially paid' || s.startsWith('credit')) {
    return {
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      dotClass: 'bg-blue-500',
    };
  }
  if (s === 'pending') {
    return {
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500',
    };
  }
  return {
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
  };
};

/**
 * AnimatedNumber — Smooth ease-out counter animation for KPI summary cards
 */
function AnimatedNumber({ value = 0, isCurrency = false, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const targetVal = Number(value) || 0;

    if (startVal === targetVal) {
      setDisplayValue(targetVal);
      return;
    }

    let startTime = null;
    let animFrame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetVal - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetVal);
        prevValueRef.current = targetVal;
      }
    };

    animFrame = requestAnimationFrame(step);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [value, duration]);

  if (isCurrency) {
    return <span>{formatCurrency(displayValue)}</span>;
  }

  return <span>{displayValue.toLocaleString('en-IN')}</span>;
}

export function InvoicesListPage() {
  const navigate = useNavigate();
  const { orders = [], isLoading, isError, refetch } = useOrders();
  const { profile } = useSellerProfile();

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const pageSize = 10;

  // Extract all orders that have invoices from authoritative dataset
  const invoicedOrders = useMemo(() => {
    return (orders || []).filter((o) => o && o.invoice && o.invoice.invoiceNumber);
  }, [orders]);

  // Handle Search & Filter updates with page reset
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handlePaymentFilterChange = (val) => {
    setPaymentFilter(val);
    setCurrentPage(1);
  };

  // Filtered invoices supporting multi-field search and robust payment status filter
  const filteredInvoices = useMemo(() => {
    return invoicedOrders.filter((o) => {
      const inv = o.invoice || {};
      const buyer = o.buyer || {};
      const q = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !q ||
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (buyer.company && buyer.company.toLowerCase().includes(q)) ||
        (buyer.name && buyer.name.toLowerCase().includes(q)) ||
        (buyer.gstin && buyer.gstin.toLowerCase().includes(q));

      let matchesPayment = true;
      if (paymentFilter !== 'All') {
        const current = (o.paymentStatus || '').toLowerCase().trim();
        const target = paymentFilter.toLowerCase().trim();
        if (target === 'paid') {
          matchesPayment = current === 'paid';
        } else if (target === 'unpaid') {
          matchesPayment = current === 'unpaid';
        } else if (target === 'partially paid') {
          matchesPayment = current === 'partially paid';
        } else if (target === 'escrow secured') {
          matchesPayment = current === 'escrow secured';
        } else if (target === 'pending') {
          matchesPayment = current === 'pending';
        } else if (target === 'settled') {
          matchesPayment = current === 'settled';
        } else if (target.startsWith('credit')) {
          matchesPayment = current.startsWith('credit');
        } else {
          matchesPayment = current === target;
        }
      }

      return matchesSearch && matchesPayment;
    });
  }, [invoicedOrders, searchTerm, paymentFilter]);

  // Paginated slice
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(startIndex, startIndex + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  // Calculate authoritative Invoice Metrics from the real invoiced dataset
  const totalInvoicesCount = invoicedOrders.length;
  const totalInvoiceValue = useMemo(() => {
    return invoicedOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [invoicedOrders]);
  const totalGstValue = useMemo(() => {
    return invoicedOrders.reduce((sum, o) => sum + (Number(o.gstAmount) || 0), 0);
  }, [invoicedOrders]);
  const paidInvoicesCount = useMemo(() => {
    return invoicedOrders.filter((o) => {
      const s = (o.paymentStatus || '').toLowerCase().trim();
      return s === 'paid' || s === 'settled' || s === 'escrow secured';
    }).length;
  }, [invoicedOrders]);

  const handleExportInvoices = () => {
    const targetDataset = filteredInvoices.length > 0 ? filteredInvoices : invoicedOrders;
    const rows = targetDataset.map((o) => ({
      InvoiceNumber: o.invoice?.invoiceNumber || 'N/A',
      InvoiceDate: o.invoice?.invoiceDate || o.createdAt,
      OrderNumber: o.orderNumber,
      BuyerCompany: o.buyer?.company || o.buyer?.name || 'Customer',
      BuyerGSTIN: o.buyer?.gstin || 'Unregistered',
      TaxableSubtotal: o.subtotal,
      GSTAmount: o.gstAmount,
      FreightCharges: o.freightCharges || 0,
      TotalAmount: o.totalAmount,
      PaymentStatus: o.paymentStatus || 'Pending',
      InvoiceStatus: o.invoice?.status || 'Generated',
    }));
    exportToCsv('HinchMart_Commercial_Tax_Invoices', rows);
  };

  const openInvoiceModal = (order) => {
    setSelectedInvoiceOrder(order);
    setInvoiceModalOpen(true);
  };

  const columns = [
    {
      header: 'Invoice Number',
      accessorKey: 'invoiceNumber',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-mono font-bold text-slate-900 block hover:text-amber-600 transition-colors">
            {row.invoice?.invoiceNumber}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {formatDate(row.invoice?.invoiceDate || row.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: 'Order Ref',
      accessorKey: 'orderNumber',
      cell: ({ row }) => (
        <div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/seller/orders/${row.id}`);
            }}
            className="text-xs font-mono font-bold text-amber-700 hover:underline cursor-pointer"
            title="Open Order Details"
          >
            {row.orderNumber}
          </span>
          <span className="text-[10px] text-slate-400 block">{row.items?.length || 1} Item(s)</span>
        </div>
      ),
    },
    {
      header: 'Buyer / Customer',
      accessorKey: 'buyer',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            {row.buyer?.company || row.buyer?.name || 'Customer'}
          </span>
          {row.buyer?.gstin ? (
            <span className="text-[10.5px] text-slate-500 font-mono">
              GSTIN: {row.buyer.gstin}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Unregistered</span>
          )}
        </div>
      ),
    },
    {
      header: 'Invoice Amount',
      accessorKey: 'totalAmount',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-black text-slate-900 block">{formatCurrency(row.totalAmount)}</span>
          <span className="text-[10px] text-slate-400">GST: {formatCurrency(row.gstAmount || 0)}</span>
        </div>
      ),
    },
    {
      header: 'Payment Status',
      accessorKey: 'paymentStatus',
      cell: ({ row }) => {
        const { badgeClass, dotClass } = getPaymentBadge(row.paymentStatus);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {row.paymentStatus || 'Pending'}
          </span>
        );
      },
    },
    {
      header: 'Invoice Status',
      cell: ({ row }) => {
        const invStatus = row.invoice?.status || 'Generated';
        const isCancelled = invStatus.toLowerCase() === 'cancelled' || invStatus.toLowerCase() === 'void';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
              isCancelled
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <CheckCircle2 className={`w-3 h-3 ${isCancelled ? 'text-rose-600' : 'text-emerald-600'}`} />
            {invStatus}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cellClassName: 'text-right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={() => openInvoiceModal(row)} leftIcon={Eye}>
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              openInvoiceModal(row);
              setTimeout(() => triggerPrint(), 300);
            }}
            leftIcon={Printer}
          >
            Print
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statutory commercial tax invoices generated with complete GST and HSN breakdown
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleExportInvoices} leftIcon={Download}>
            Export Invoices
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {isError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-rose-900">Unable to load invoices</p>
              <p className="text-xs text-rose-700">Please check your network connection and try again.</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* 2. Top Metrics with Animated Counters, Staggered Entrance & Micro-Interactions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Generated Invoices */}
        <div
          onClick={() => handlePaymentFilterChange('All')}
          title="Click to view all generated invoices"
          className={`bg-white p-4 rounded-xl border shadow-xs card-lift transition-all duration-300 ease-out cursor-pointer group relative overflow-hidden animate-fade-in-up stagger-1 before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-slate-300 group-hover:before:bg-amber-500 before:transition-colors ${
            paymentFilter === 'All' ? 'border-slate-300/90' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block group-hover:text-slate-700 transition-colors">
              Generated Invoices
            </span>
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:scale-110 transition-all duration-200">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-7 w-20 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-slate-900 mt-1 block tracking-tight group-hover:text-amber-700 transition-colors">
              <AnimatedNumber value={totalInvoicesCount} duration={900} />
            </span>
          )}
          <span className="text-[10px] text-slate-400 block mt-0.5">Total volume</span>
        </div>

        {/* Card 2: Total Invoiced Value */}
        <div
          onClick={() => handlePaymentFilterChange('All')}
          title="Click to view all invoices"
          className={`bg-white p-4 rounded-xl border shadow-xs card-lift transition-all duration-300 ease-out cursor-pointer group relative overflow-hidden animate-fade-in-up stagger-2 before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-emerald-500/40 group-hover:before:bg-emerald-500 before:transition-colors ${
            paymentFilter === 'All' ? 'border-slate-300/90' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block group-hover:text-emerald-700 transition-colors">
              Total Invoiced Value
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-200">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-7 w-32 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-slate-900 mt-1 block tracking-tight group-hover:text-emerald-700 transition-colors">
              <AnimatedNumber value={totalInvoiceValue} isCurrency duration={1100} />
            </span>
          )}
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Verified tax value</span>
        </div>

        {/* Card 3: GST Collected / Accrued */}
        <div
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs card-lift transition-all duration-300 ease-out cursor-default group relative overflow-hidden animate-fade-in-up stagger-3 before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-blue-500/40 group-hover:before:bg-blue-600 before:transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-blue-600 uppercase tracking-wider block group-hover:text-blue-700 transition-colors">
              GST Collected / Accrued
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-200">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-7 w-28 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-blue-600 mt-1 block tracking-tight group-hover:text-blue-700 transition-colors">
              <AnimatedNumber value={totalGstValue} isCurrency duration={1100} />
            </span>
          )}
          <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">CGST + SGST (18%/28%)</span>
        </div>

        {/* Card 4: Paid & Settled Invoices (Click to toggle Paid filter) */}
        <div
          onClick={() => handlePaymentFilterChange(paymentFilter === 'Paid' ? 'All' : 'Paid')}
          title="Click to filter by Paid & Settled invoices"
          className={`bg-white p-4 rounded-xl border shadow-xs card-lift transition-all duration-300 ease-out cursor-pointer group relative overflow-hidden animate-fade-in-up stagger-4 before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-emerald-600/40 group-hover:before:bg-emerald-600 before:transition-colors ${
            paymentFilter === 'Paid'
              ? 'border-emerald-400 ring-2 ring-emerald-200 bg-emerald-50/20'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider block group-hover:text-emerald-700 transition-colors">
              Paid & Settled Invoices
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-7 w-16 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-emerald-600 mt-1 block tracking-tight group-hover:text-emerald-700 transition-colors">
              <AnimatedNumber value={paidInvoicesCount} duration={900} />
            </span>
          )}
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Cleared via Escrow/RTGS
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by Invoice #, Order #, Company..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            LeftIcon={Search}
            rightElement={
              searchTerm ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null
            }
          />
        </div>

        <div className="w-48 shrink-0">
          <Select
            options={PAYMENT_STATUS_OPTIONS}
            value={paymentFilter}
            onChange={(e) => handlePaymentFilterChange(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Invoices Table */}
      <DataTable
        columns={columns}
        data={paginatedInvoices}
        isLoading={isLoading}
        keyField="id"
        onRowClick={(row) => openInvoiceModal(row)}
        pagination={{
          currentPage,
          totalItems: filteredInvoices.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
        emptyState={
          invoicedOrders.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Invoices generated for your orders will appear here."
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No invoices match your criteria"
              description="Try adjusting your search query or payment status filter."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchTerm('');
                setPaymentFilter('All');
                setCurrentPage(1);
              }}
            />
          )
        }
      />

      {/* 5. Statutory Tax Invoice Modal / Print Preview */}
      {selectedInvoiceOrder && (
        <Modal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          title="Commercial Tax Invoice"
          subtitle={`Invoice for ${selectedInvoiceOrder.orderNumber}`}
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
                  {profile?.companyName || profile?.businessName || profile?.registeredBusinessName || 'HinchMart Registered Seller'}
                </h2>
                <p className="text-slate-600">
                  {profile?.address?.completeAddress ||
                    (profile?.address?.city
                      ? `${profile?.address.city}, ${profile?.address.state || ''}`
                      : '') ||
                    'Registered Business Address'}
                </p>
                <p className="font-mono text-slate-700">
                  GSTIN: {profile?.legal?.gstin || profile?.tax?.gstin || profile?.gstin || 'GSTIN Not Specified'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold uppercase block text-amber-600 tracking-wider">
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

            {/* Buyer & Delivery Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold block text-[11px] text-slate-500 uppercase">BILLED TO:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedInvoiceOrder.buyer?.company || selectedInvoiceOrder.buyer?.name || 'Customer'}
                </p>
                <p className="text-slate-600 mt-0.5">
                  {selectedInvoiceOrder.deliveryAddress?.address || 'Site Delivery'}
                </p>
                <p className="font-mono text-slate-700 mt-1">
                  GSTIN: {selectedInvoiceOrder.buyer?.gstin || 'Unregistered'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold block text-[11px] text-slate-500 uppercase">SHIPPED TO SITE:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedInvoiceOrder.deliveryAddress?.siteName ||
                    selectedInvoiceOrder.buyer?.company ||
                    'Site Delivery'}
                </p>
                <p className="text-slate-600 mt-0.5">
                  {selectedInvoiceOrder.deliveryAddress?.address || 'Address on file'}
                </p>
                <p className="text-slate-700 mt-1">
                  {selectedInvoiceOrder.deliveryAddress?.city ? `${selectedInvoiceOrder.deliveryAddress.city}, ${selectedInvoiceOrder.deliveryAddress.state || ''}` : ''}
                </p>
              </div>
            </div>

            {/* Payment & Invoice Status Indicators */}
            <div className="flex items-center justify-between border-t border-b border-slate-200 py-2.5 px-3 bg-slate-50/50 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Payment Status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    getPaymentBadge(selectedInvoiceOrder.paymentStatus).badgeClass
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      getPaymentBadge(selectedInvoiceOrder.paymentStatus).dotClass
                    }`}
                  />
                  {selectedInvoiceOrder.paymentStatus || 'Pending'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Invoice Status:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedInvoiceOrder.invoice?.status || 'Generated'}
                </span>
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
                      <td className="p-2.5 font-mono text-slate-600">{i.hsnCode || i.sku || '—'}</td>
                      <td className="p-2.5 font-bold">
                        {i.quantity} {i.unit || 'Units'}
                      </td>
                      <td className="p-2.5">{formatCurrency(i.unitPrice)}</td>
                      <td className="p-2.5 font-bold text-emerald-700">{i.gstRate || 18}%</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(i.total || (i.quantity * i.unitPrice))}</td>
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
                  This is a computer-generated commercial tax invoice issued under GST Act 2017. All payments subject to
                  HinchMart B2B Trade Escrow terms.
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
                  <span>Freight & Logistics:</span>
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
