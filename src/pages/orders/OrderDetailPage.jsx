import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Building,
  MapPin,
  FileText,
  ShieldCheck,
  Package,
  AlertCircle,
  Download,
  Receipt,
  FileCheck,
  Navigation,
  CheckSquare,
  Upload,
  UserCheck,
  Zap,
  Phone,
  Mail,
  XCircle,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useOrder } from '../../hooks/useOrders';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';
import { triggerPrint } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ORDER_LIFECYCLE_STEPS } from '../../constants/orderStatus';
import { cn } from '../../utils/cn';

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { order, isLoading, updateStatus, isUpdating, generateInvoice, isGeneratingInvoice } = useOrder(id);
  const { profile } = useSellerProfile();

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/seller/orders');
    }
  };

  // Modals state
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [podModalOpen, setPodModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Stock allocation unavailable at regional bay');

  // Forms state
  const [dispatchForm, setDispatchForm] = useState({
    transporter: 'VRL Heavy Logistics Fleet',
    vehicleNo: 'MH-04-GP-8812',
    driverContact: '+91 94221 00987',
    notes: 'Loaded and weighed at Bhiwandi Central Bay 3.',
    trackingNumber: 'TRK2026881290',
  });

  const [podForm, setPodForm] = useState({
    receivedBy: 'Arun Deshmukh (Site Engineer)',
    receiverPhone: '+91 98199 44332',
    deliveryTimestamp: new Date().toISOString(),
    grnNumber: 'GRN-MH-400615-992',
    notes: 'Material unloaded and physically inspected. Tare and gross weight matches delivery challan.',
    podDocumentName: 'Signed_Delivery_Challan_GRN.pdf',
  });

  if (isLoading || !order) {
    return (
      <div className="space-y-6 w-full py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const hasInvoice = Boolean(order.invoice && order.invoice.invoiceNumber);
  const invoiceNumber = order.invoice?.invoiceNumber || `INV-${order.orderNumber.replace('ORD-', '')}`;
  const invoiceDate = order.invoice?.invoiceDate || order.createdAt;

  // Actions handlers
  const handleGenerateInvoice = async () => {
    try {
      await generateInvoice();
    } catch (err) {
      console.error('Invoice generation error:', err);
    }
  };

  const handleAdvanceStatus = async (nextStatus, customNotes) => {
    await updateStatus({
      status: nextStatus,
      notes: customNotes || `Order moved to ${nextStatus}`,
    });
  };

  const handleConfirmDispatch = async (e) => {
    e.preventDefault();

    // Auto-generate invoice if not present
    if (!hasInvoice) {
      try {
        await generateInvoice();
      } catch (err) {
        console.warn('Auto invoice notice:', err);
      }
    }

    await updateStatus({
      status: 'Dispatched',
      notes: `Dispatched via ${dispatchForm.transporter} (Vehicle ${dispatchForm.vehicleNo}). Commercial Tax Invoice attached.`,
      dispatchDetails: dispatchForm,
    });
    setDispatchModalOpen(false);
  };

  const handleConfirmPod = async (e) => {
    e.preventDefault();
    await updateStatus({
      status: 'Completed',
      notes: `Proof of Delivery (POD) confirmed by ${podForm.receivedBy}. Site GRN: ${podForm.grnNumber}. Transaction settled.`,
      podDetails: podForm,
    });
    setPodModalOpen(false);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    await updateStatus({
      status: 'Cancelled',
      notes: `Order cancelled. Reason: ${cancelReason}`,
    });
    setCancelModalOpen(false);
  };

  // Helper for delivery status badge in header
  const getHeaderStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'dispatched') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
          <Truck className="w-3.5 h-3.5 text-blue-600" /> Dispatched
        </span>
      );
    }
    if (s === 'in transit') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
          <Navigation className="w-3.5 h-3.5 text-cyan-600" /> In Transit
        </span>
      );
    }
    if (s === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Completed
        </span>
      );
    }
    if (s === 'ready for dispatch' || s === 'packed / ready' || s === 'packed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
          <Package className="w-3.5 h-3.5 text-indigo-600" /> Packed / Ready
        </span>
      );
    }
    if (s === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
          <Zap className="w-3.5 h-3.5 text-purple-600" /> Processing
        </span>
      );
    }
    if (s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Confirmed
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header & Context-Sensitive Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                {order.orderNumber}
              </h1>
              {getHeaderStatusBadge(order.orderStatus)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {formatDate(order.createdAt, true)} • Buyer:{' '}
              <strong className="text-slate-800">{order.buyer?.company}</strong>
            </p>
          </div>
        </div>

        {/* State-Aware Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Invoice action */}
          {hasInvoice ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInvoiceModalOpen(true)}
              leftIcon={FileText}
            >
              View Invoice
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateInvoice}
              isLoading={isGeneratingInvoice}
              leftIcon={Receipt}
            >
              Generate Invoice
            </Button>
          )}

          {/* Pending State */}
          {['New', 'Pending'].includes(order.orderStatus) && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                leftIcon={XCircle}
              >
                Reject Order
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAdvanceStatus('Confirmed', 'Seller accepted and confirmed order.')}
                isLoading={isUpdating}
                leftIcon={UserCheck}
              >
                Accept & Confirm Order
              </Button>
            </>
          )}

          {/* Confirmed State */}
          {order.orderStatus === 'Confirmed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAdvanceStatus('Processing', 'Started material picking and batch testing.')}
              isLoading={isUpdating}
              leftIcon={Zap}
            >
              Start Processing & Picking
            </Button>
          )}

          {/* Processing State */}
          {order.orderStatus === 'Processing' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAdvanceStatus('Ready for Dispatch', 'Materials packaged & staged at loading bay.')}
              isLoading={isUpdating}
              leftIcon={Package}
            >
              Mark Packed & Ready
            </Button>
          )}

          {/* Packed / Ready State */}
          {['Ready for Dispatch', 'Packed / Ready', 'Packed'].includes(order.orderStatus) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDispatchModalOpen(true)}
              leftIcon={Truck}
            >
              Dispatch Order
            </Button>
          )}

          {/* Dispatched State */}
          {order.orderStatus === 'Dispatched' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/seller/tracking')}
                leftIcon={Navigation}
              >
                Live Tracking
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAdvanceStatus('In Transit', 'Carrier confirmed en route to destination site.')}
                isLoading={isUpdating}
                leftIcon={Navigation}
              >
                Mark In Transit
              </Button>
            </>
          )}

          {/* In Transit State */}
          {order.orderStatus === 'In Transit' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/seller/tracking')}
                leftIcon={Navigation}
              >
                Live Tracking
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAdvanceStatus('Delivered', 'Material arrived and unloaded at project site.')}
                isLoading={isUpdating}
                leftIcon={CheckCircle2}
              >
                Mark Delivered at Site
              </Button>
            </>
          )}

          {/* Delivered State */}
          {order.orderStatus === 'Delivered' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPodModalOpen(true)}
              leftIcon={CheckSquare}
            >
              Confirm POD & Complete
            </Button>
          )}

          {/* Completed State */}
          {order.orderStatus === 'Completed' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-black text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Order Completed ✓
            </div>
          )}

          {/* Cancelled State */}
          {order.orderStatus === 'Cancelled' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800">
              <XCircle className="w-4 h-4 text-rose-600" /> Order Cancelled
            </div>
          )}
        </div>
      </div>

      {/* 2. ORDER DETAILS SUMMARY BANNER */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
          <span>Order Overview & Key Parameters</span>
          <span className="font-mono text-slate-500 font-normal">{order.orderNumber}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Order ID:</span>
            <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Customer Entity:</span>
            <span className="font-bold text-slate-900 truncate block">{order.buyer?.company}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Invoice Value:</span>
            <span className="font-black text-slate-900">{formatCurrency(order.totalAmount)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Payment Status:</span>
            <span className="font-bold text-emerald-700">{order.paymentStatus}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Lifecycle Status:</span>
            <span className="font-bold text-amber-600">{order.orderStatus}</span>
          </div>
        </div>
      </div>

      {/* 3. COMMERCIAL TAX INVOICE SECTION (Strictly Separated from E-Way Bill) */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Statutory Tax Invoice Document
            </h3>
          </div>
          {hasInvoice ? (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Invoice Generated
            </span>
          ) : (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Invoice Required Before Dispatch
            </span>
          )}
        </div>

        {hasInvoice ? (
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-emerald-100/80 border border-emerald-300 text-emerald-800 rounded-xl shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Commercial Tax Invoice</h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                    Statutory ✓
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Invoice No: <strong className="font-mono text-slate-900">{invoiceNumber}</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Invoice Date: <span className="font-medium text-slate-800">{formatDate(invoiceDate)}</span> • Total: <strong className="text-slate-900">{formatCurrency(order.totalAmount)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInvoiceModalOpen(true)}
                leftIcon={FileText}
              >
                View Invoice
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setInvoiceModalOpen(true);
                  setTimeout(() => triggerPrint(), 300);
                }}
                leftIcon={Printer}
              >
                Download / Print
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-100 border border-amber-300 text-amber-800 rounded-xl shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">Commercial Tax Invoice</h4>
                <p className="text-xs text-slate-600 font-medium">
                  Invoice not generated yet.
                </p>
                <p className="text-[11px] text-slate-500">
                  Click Generate Invoice to create the official statutory tax invoice before dispatching this consignment.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateInvoice}
                isLoading={isGeneratingInvoice}
                leftIcon={Receipt}
              >
                Generate Invoice
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Complete Order Lifecycle Progression Timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Complete Order Lifecycle Progression
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {[
            { status: 'Confirmed', desc: 'Order Accepted' },
            { status: 'Processing', desc: 'Material Packed' },
            { status: 'Ready for Dispatch', desc: 'Invoice Attached' },
            { status: 'Dispatched', desc: 'Carrier Loaded' },
            { status: 'In Transit', desc: 'En Route Site' },
            { status: 'Delivered', desc: 'Delivered at Site' },
            { status: 'Completed', desc: 'POD Confirmed' },
          ].map((step) => {
            const isCompletedStep =
              order.orderStatus === step.status ||
              (step.status === 'Confirmed' && !['New', 'Pending', 'Cancelled'].includes(order.orderStatus)) ||
              (step.status === 'Processing' &&
                ['Ready for Dispatch', 'Packed / Ready', 'Dispatched', 'In Transit', 'Delivered', 'Completed'].includes(order.orderStatus)) ||
              (step.status === 'Ready for Dispatch' &&
                ['Dispatched', 'In Transit', 'Delivered', 'Completed'].includes(order.orderStatus)) ||
              (step.status === 'Dispatched' &&
                ['In Transit', 'Delivered', 'Completed'].includes(order.orderStatus)) ||
              (step.status === 'In Transit' &&
                ['Delivered', 'Completed'].includes(order.orderStatus)) ||
              (step.status === 'Delivered' && order.orderStatus === 'Completed') ||
              order.orderStatus === 'Completed';

            return (
              <div
                key={step.status}
                className={cn(
                  'p-2.5 rounded-lg border text-xs transition-all',
                  isCompletedStep
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                )}
              >
                <div className="flex items-center gap-1 mb-1">
                  {isCompletedStep ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate text-[11px] font-bold">{step.status}</span>
                </div>
                <p className="text-[10px] font-normal text-slate-500 truncate">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. In-Transit / Logistics Live Tracking Card */}
      {['Dispatched', 'In Transit', 'Delivered', 'Completed'].includes(order.orderStatus) && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" /> Assigned Logistics & Fleet Tracking
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Docket: {order.dispatchDetails?.trackingNumber || 'TRK2026881290'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Carrier Fleet:</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {order.dispatchDetails?.transporter || 'VRL Heavy Logistics Fleet'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Vehicle: {order.dispatchDetails?.vehicleNo || 'MH-04-GP-8812'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Driver Contact:</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {order.dispatchDetails?.driverContact || '+91 94221 00987'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Notes: {order.dispatchDetails?.notes || 'Bhiwandi Central Loading Bay'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Shipment Status:</span>
              <p className="font-bold text-emerald-600 mt-0.5">{order.orderStatus}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">ETA: Express Direct Corridors</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Proof of Delivery (POD) Section */}
      {['Delivered', 'Completed'].includes(order.orderStatus) && (
        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" /> Proof of Delivery (POD) Confirmation
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              POD Verified ✓
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Site Receiving Person:</span>
              <span className="font-bold text-slate-900">{podForm.receivedBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">GRN / Reference Number:</span>
              <span className="font-mono font-bold text-slate-900">{podForm.grnNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Delivered Timestamp:</span>
              <span className="font-medium text-slate-900">{formatDate(podForm.deliveryTimestamp, true)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 7. Buyer & Destination Site Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buyer Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-emerald-600" /> Buyer Entity Details
          </h3>

          <div className="space-y-1.5 text-xs text-slate-700">
            <p className="font-bold text-sm text-slate-900">{order.buyer?.company}</p>
            <p>
              Contact Person: <span className="font-semibold text-slate-900">{order.buyer?.name}</span>
            </p>
            <p>
              Email: <span className="font-mono">{order.buyer?.email}</span>
            </p>
            <p>
              Phone: <span className="font-mono">{order.buyer?.phone}</span>
            </p>
            {order.buyer?.gstin && (
              <p className="pt-1 text-slate-500 font-mono">
                GSTIN: <strong className="text-slate-800">{order.buyer.gstin}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Site Delivery Address */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-emerald-600" /> Project Site Delivery Location
          </h3>

          <div className="space-y-1.5 text-xs text-slate-700">
            <p className="font-bold text-sm text-slate-900">{order.deliveryAddress?.siteName}</p>
            <p className="leading-relaxed text-slate-600">{order.deliveryAddress?.address}</p>
            <p className="font-medium text-slate-800">
              {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
            </p>
          </div>
        </div>
      </div>

      {/* 8. Ordered Line Items Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Ordered Construction Materials ({order.items?.length || 1})
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Unit Rate</th>
                <th className="py-2.5 px-3">GST Rate</th>
                <th className="py-2.5 px-3 text-right">Taxable Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(order.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{item.sku}</td>
                  <td className="py-3 px-3 font-bold">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-3 font-bold text-emerald-600">{item.gstRate}%</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-80 space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between">
              <span>Taxable Value:</span>
              <span className="font-bold">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (CGST + SGST):</span>
              <span className="font-bold">{formatCurrency(order.gstAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Freight Surcharge:</span>
              <span className="font-bold">{formatCurrency(order.freightCharges || 0)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-black text-slate-900">
              <span>Total Invoice Amount:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 9. Order Event History & Audit Timeline */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Order Activity & Audit Log
        </h3>

        <div className="space-y-4 text-xs">
          {(order.timeline || []).map((event, idx) => (
            <div key={idx} className="flex items-start gap-3 relative pb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{event.status}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDate(event.timestamp, true)}
                  </span>
                </div>
                <p className="text-slate-600 text-[11.5px] mt-0.5">{event.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10. Dispatch Modal */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title="Record Dispatch & Assign Transport Fleet"
        subtitle={`Assign logistics carrier and vehicle for ${order.orderNumber}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmDispatch} leftIcon={Truck}>
              Confirm Dispatch
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmDispatch} className="space-y-3.5 py-2">
          {hasInvoice ? (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center gap-2.5 text-xs text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Commercial Tax Invoice <strong className="font-mono">{invoiceNumber}</strong> is attached.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-center gap-2.5 text-xs text-amber-950">
              <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Commercial Tax Invoice will be automatically generated upon dispatch.
              </span>
            </div>
          )}

          <Input
            label="Transporter / Carrier Fleet Name"
            value={dispatchForm.transporter}
            onChange={(e) => setDispatchForm({ ...dispatchForm, transporter: e.target.value })}
            required
          />

          <Input
            label="Vehicle Registration Number"
            placeholder="e.g. MH-04-GP-8812"
            value={dispatchForm.vehicleNo}
            onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNo: e.target.value })}
            required
          />

          <Input
            label="Driver Contact Number"
            placeholder="+91 94221 00987"
            value={dispatchForm.driverContact}
            onChange={(e) => setDispatchForm({ ...dispatchForm, driverContact: e.target.value })}
            required
          />

          <Input
            label="Tracking Number / Docket ID"
            placeholder="e.g. TRK2026881290"
            value={dispatchForm.trackingNumber}
            onChange={(e) => setDispatchForm({ ...dispatchForm, trackingNumber: e.target.value })}
          />

          <Input
            label="Loading Notes / Warehouse Bay"
            placeholder="e.g. Loaded at Bay 3"
            value={dispatchForm.notes}
            onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* 11. Proof of Delivery (POD) Modal */}
      <Modal
        isOpen={podModalOpen}
        onClose={() => setPodModalOpen(false)}
        title="Confirm Proof of Delivery (POD)"
        subtitle={`Record receiver signature and site GRN for ${order.orderNumber}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPodModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmPod} leftIcon={CheckSquare}>
              Confirm POD & Complete
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmPod} className="space-y-3.5 py-2">
          <Input
            label="Site Engineer / Receiver Name"
            value={podForm.receivedBy}
            onChange={(e) => setPodForm({ ...podForm, receivedBy: e.target.value })}
            required
          />

          <Input
            label="Receiver Contact Phone"
            value={podForm.receiverPhone}
            onChange={(e) => setPodForm({ ...podForm, receiverPhone: e.target.value })}
            required
          />

          <Input
            label="Goods Receipt Note (GRN) / Challan Ref"
            value={podForm.grnNumber}
            onChange={(e) => setPodForm({ ...podForm, grnNumber: e.target.value })}
            required
          />

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">Signed_Delivery_Challan_GRN.pdf</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600">Attached</span>
          </div>

          <Input
            label="Delivery Remarks / Inspection Notes"
            value={podForm.notes}
            onChange={(e) => setPodForm({ ...podForm, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* 12. Cancel Order Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Order"
        subtitle={`Are you sure you want to cancel ${order.orderNumber}?`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Back
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel} leftIcon={XCircle}>
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmCancel} className="space-y-3.5 py-2">
          <p className="text-xs text-slate-600">
            Cancelling an order will release reserved inventory and trigger an automatic notification to the buyer.
          </p>
          <Input
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* 13. Tax Invoice Modal / Print Preview */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Commercial Tax Invoice"
        subtitle={`Invoice for ${order.orderNumber}`}
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
              <span className="text-base font-extrabold uppercase block text-amber-600 tracking-wider">
                TAX INVOICE
              </span>
              <p className="font-mono font-bold text-slate-900 text-sm">{invoiceNumber}</p>
              <p className="text-slate-600">Invoice Date: {formatDate(invoiceDate)}</p>
              <p className="text-slate-500 font-mono text-[11px]">Order: {order.orderNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold block text-[11px] text-slate-500 uppercase">BILLED TO:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{order.buyer?.company || order.buyer?.name}</p>
              <p className="text-slate-600 mt-0.5">{order.deliveryAddress?.address}</p>
              {order.buyer?.gstin && (
                <p className="font-mono text-slate-700 mt-1">GSTIN: {order.buyer.gstin}</p>
              )}
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold block text-[11px] text-slate-500 uppercase">SHIPPED TO SITE:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{order.deliveryAddress?.siteName}</p>
              <p className="text-slate-600 mt-0.5">{order.deliveryAddress?.address}</p>
              <p className="text-slate-700 mt-1">
                {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
              </p>
            </div>
          </div>

          {/* Table */}
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
                {(order.items || []).map((i, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-semibold text-slate-900">{i.name}</td>
                    <td className="p-2.5 font-mono text-slate-600">{i.sku || '72142090'}</td>
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

          <div className="flex justify-between items-end pt-2">
            <div className="text-[11px] text-slate-500 max-w-xs space-y-1">
              <p className="font-semibold text-slate-700">Terms & Conditions:</p>
              <p>
                This is a statutory computer-generated tax invoice issued under GST Act 2017. Material unloaded subject to
                formal site inspection certificate.
              </p>
            </div>
            <div className="text-right space-y-1 w-64 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (CGST + SGST):</span>
                <span className="font-semibold">{formatCurrency(order.gstAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Freight:</span>
                <span className="font-semibold">{formatCurrency(order.freightCharges || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-300">
                <span>Total Amount:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
