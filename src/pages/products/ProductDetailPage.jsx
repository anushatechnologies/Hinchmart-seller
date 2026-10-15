import React, { useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Copy,
  Archive,
  Trash2,
  QrCode,
  Tag,
  Boxes,
  ShieldCheck,
  Package,
  Layers,
  Calendar,
  Building,
  CheckCircle,
  ExternalLink,
  BookOpen,
  FileText,
  Clock,
  Warehouse,
  IndianRupee,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useProduct, useProducts } from '../../hooks/useProducts';
import { useInventory } from '../../hooks/useInventory';
import { getProductImageUrl, getCleanProductImages } from '../../utils/productImages';
import { usePricing } from '../../hooks/usePricing';
import { useOrders } from '../../hooks/useOrders';
import { StatusBadge } from '../../components/common/Badge';
import { ProductStatusBadge } from '../../components/products/ProductStatusBadge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { QuickPriceModal, QuickStockModal } from '../../components/products/QuickPriceModal';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { product, isLoading } = useProduct(id);
  const { duplicateProduct, archiveProduct, deleteProduct } = useProducts();
  const { warehouses = [], updateStock } = useInventory();
  const { updateProductPrice } = usePricing();
  const { orders = [] } = useOrders();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'specs' | 'images' | 'docs' | 'inventory' | 'sales'
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Extract and normalize specifications entries (MUST be before any early returns to satisfy React Rules of Hooks)
  const specsEntries = React.useMemo(() => {
    let rawSpecs = product?.specifications ?? product?.specs ?? product?.technicalSpecifications ?? product?.attributes ?? {};
    if (typeof rawSpecs === 'string') {
      try {
        rawSpecs = JSON.parse(rawSpecs);
      } catch (_) {
        const parsedMap = {};
        rawSpecs.split(',').forEach((part) => {
          const [k, ...v] = part.split(':');
          if (k && v.length) parsedMap[k.trim()] = v.join(':').trim();
        });
        rawSpecs = parsedMap;
      }
    }
    if (Array.isArray(rawSpecs)) {
      const converted = {};
      rawSpecs.forEach((item) => {
        const k = item?.key || item?.name || item?.attributeName || item?.label;
        if (k) converted[k] = item?.value ?? item?.val ?? '';
      });
      rawSpecs = converted;
    }
    if (typeof rawSpecs === 'object' && rawSpecs !== null) {
      return Object.entries(rawSpecs).filter(([k, v]) => v !== undefined && v !== null && String(v).trim() !== '');
    }
    return [];
  }, [product]);

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/seller/products');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full py-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <Package className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested product ID <code className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{id}</code> could not be found in your catalog.
        </p>
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={() => navigate('/seller/products')} leftIcon={ArrowLeft}>
            Back to Catalog Management
          </Button>
        </div>
      </div>
    );
  }

  const warehouse = warehouses.find((w) => w.id === product.warehouseId) || warehouses[0] || { name: 'Central Hub', city: 'Mumbai' };
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 0);
  const isOut = (product.stock || 0) === 0;
  const isRejected = product?.status === 'REJECTED' || product?.approvalStatus === 'REJECTED';

  const isDeletedByAdmin =
    !isRejected && (
      product?.status === 'DELETED_BY_ADMIN' ||
      product?.status === 'DELETED' ||
      product?.status === 'REMOVED_BY_ADMIN' ||
      product?.approvalStatus === 'DELETED_BY_ADMIN' ||
      Boolean(product?.deletedByAdmin)
    );

  // Filter orders containing this product
  const productOrders = orders.filter((o) =>
    o.items?.some((i) => i.productId === product.id || i.sku === product.sku || i.name === product.name)
  );

  return (
    <div className="space-y-6 w-full">
      {/* 4-Tier Hierarchy Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto py-1" aria-label="Breadcrumb">
        <Link to="/seller/dashboard" className="hover:text-emerald-700 transition-colors font-medium shrink-0">Home</Link>
        <span className="text-slate-300 shrink-0">/</span>
        <Link to="/seller/products" className="hover:text-emerald-700 transition-colors font-medium shrink-0">Catalog Management</Link>
        {product.categoryName && (
          <>
            <span className="text-slate-300 shrink-0">/</span>
            <Link to={`/seller/products?category=${encodeURIComponent(product.categoryName)}`} className="hover:text-emerald-700 transition-colors font-medium shrink-0">
              {product.categoryName}
            </Link>
          </>
        )}
        {product.subcategoryName && (
          <>
            <span className="text-slate-300 shrink-0">/</span>
            <Link to={`/seller/products?subcategory=${encodeURIComponent(product.subcategoryName)}`} className="hover:text-emerald-700 transition-colors font-medium shrink-0">
              {product.subcategoryName}
            </Link>
          </>
        )}
        {product.brandName && (
          <>
            <span className="text-slate-300 shrink-0">/</span>
            <Link to={`/seller/products?brand=${encodeURIComponent(product.brandName)}`} className="hover:text-emerald-700 transition-colors font-medium shrink-0">
              {product.brandName}
            </Link>
          </>
        )}
        <span className="text-slate-300 shrink-0">/</span>
        <span className="font-bold text-slate-800 truncate max-w-xs">{product.title || product.name}</span>
      </nav>

      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={ArrowLeft} onClick={handleBack}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{product.name}</h1>
              <ProductStatusBadge status={isDeletedByAdmin ? 'DELETED_BY_ADMIN' : product.status} product={product} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Product ID: <strong className="text-slate-800">{product.id}</strong> • SKU: <strong className="text-slate-800">{product.sku}</strong> • HSN: {product.hsnCode || '—'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isDeletedByAdmin ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={Trash2}
            >
              Remove from My List
            </Button>
          ) : isRejected ? (
            <>
              <Link to={`/seller/products/${id}/edit`}>
                <Button variant="primary" size="sm" leftIcon={Edit2} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-xs">
                  Edit & Re-submit
                </Button>
              </Link>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                leftIcon={Trash2}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Link to={`/seller/products/${id}/edit`}>
                <Button variant="primary" size="sm" leftIcon={Edit2}>
                  Edit Product
                </Button>
              </Link>

              <Link to="/seller/products/labels" state={{ selectedProductId: product.id }}>
                <Button variant="secondary" size="sm" leftIcon={QrCode}>
                  Generate Label
                </Button>
              </Link>

              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const res = await duplicateProduct(product.id);
                  navigate(`/seller/products/${res.id}/edit`);
                }}
                leftIcon={Copy}
              >
                Duplicate
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowArchiveModal(true)}
                leftIcon={Archive}
              >
                Archive
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                leftIcon={Trash2}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rejected by Admin Banner */}
      {isRejected && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                  Rejected by Admin
                </span>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Compliance Feedback Received
                </h4>
              </div>
              <p className="text-xs text-rose-950 font-semibold mt-1">
                Reason: <span className="font-normal text-rose-800">{product.rejectionReason || 'Specifications, pricing, or product images require revision.'}</span>
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Click "Edit & Re-submit" to update the listing and return it to Admin review.
              </p>
            </div>
          </div>
          <Link to={`/seller/products/${id}/edit`} className="shrink-0">
            <Button variant="primary" size="sm" leftIcon={Edit2} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-xs">
              Edit & Re-submit
            </Button>
          </Link>
        </div>
      )}

      {/* Deleted by Admin Warning Banner */}
      {isDeletedByAdmin && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-950">This Product Was Deleted by the Admin</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                The administrator removed this listing from the marketplace catalog. It is no longer accessible to buyers.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            leftIcon={Trash2}
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 font-bold"
          >
            Remove from My List
          </Button>
        </div>
      )}

      {/* 2. Main Grid: Media + Pricing & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Media Gallery & Stock Snapshot */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            {(() => {
              const displayImages = getCleanProductImages(product);
              const currentMainImage = displayImages[activeImageIndex] || displayImages[0] || getProductImageUrl(product);

              return (
                <>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                    {currentMainImage ? (
                      <img
                        src={currentMainImage}
                        alt={product.name || product.title}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.detail-fallback-icon');
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                    ) : null}
                    <Package className={`w-16 h-16 text-slate-300 detail-fallback-icon ${currentMainImage ? 'hidden' : ''}`} />
                    {product.brand && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500 text-white shadow-xs">
                        {product.brand}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {displayImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {displayImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all bg-slate-100 flex items-center justify-center ${
                            activeImageIndex === idx
                              ? 'border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Quick Stock Summary Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-emerald-600" />
                Warehouse Inventory
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowStockModal(true)}
              >
                Update Stock
              </Button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Available Stock Balance</span>
                <span
                  className={`text-xl font-extrabold ${
                    isOut ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                  }`}
                >
                  {formatNumber(product.stock)} {product.unit}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Primary Warehouse</span>
                <span className="text-xs font-bold text-slate-800">{warehouse?.name || 'Central Hub'}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex justify-between pt-1 font-medium">
              <span>Low stock threshold: <strong className="text-slate-800">{product.lowStockThreshold || 10} {product.unit}</strong></span>
              <span>MOQ: <strong className="text-slate-800">{product.moq || 1} {product.unit}</strong></span>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Commercial Pricing & Volume Tiers */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Commercial B2B Rates
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-black text-slate-900">
                    {formatCurrency(product.sellingPrice)}
                  </span>
                  <span className="text-sm font-medium text-slate-500">/ {product.unit}</span>
                  {product.mrp && product.mrp > product.sellingPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      MRP: {formatCurrency(product.mrp)}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPriceModal(true)}
                leftIcon={Tag}
              >
                Change Rates
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Wholesale Rate
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {product.wholesalePrice ? formatCurrency(product.wholesalePrice) : '—'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Dealer Rate
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {product.dealerPrice ? formatCurrency(product.dealerPrice) : '—'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Tax / GST Rate
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  +{product.gstRate}% GST
                </span>
              </div>
            </div>

            {/* Quantity-Based Tier Matrix */}
            {product.pricingTiers?.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Volume Quantity Tiers
                </h4>
                <div className="overflow-hidden border border-slate-200 rounded-lg text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Order Quantity</th>
                        <th className="py-2 px-3">B2B Rate / {product.unit}</th>
                        <th className="py-2 px-3 text-right">Effective Savings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {product.pricingTiers.map((t, idx) => {
                        const savings = Math.round(((product.sellingPrice - t.price) / product.sellingPrice) * 100);
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              {t.minQty} - {t.maxQty} {product.unit}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {formatCurrency(t.price)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                              {savings > 0 ? `${savings}% OFF` : 'Base Tier'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Technical Specifications Snippet */}
            {specsEntries.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Technical Specifications ({specsEntries.length})</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {specsEntries.map(([k, v]) => (
                    <div key={k} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">{k}</span>
                      <span className="font-bold text-slate-900 block mt-0.5 truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABS SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 flex items-center gap-1 px-4 bg-slate-50/70 overflow-x-auto">
          {[
            { id: 'info', label: 'Product Information', icon: Package },
            { id: 'specs', label: `Specifications (${specsEntries.length})`, icon: ShieldCheck },
            { id: 'images', label: 'Media Gallery', icon: BookOpen },
            { id: 'docs', label: 'Documents & Brochures', icon: FileText },
            { id: 'inventory', label: 'Inventory & Batch Logs', icon: Boxes },
            { id: 'sales', label: 'Sales History', icon: IndianRupee },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* TAB 1: Product Information */}
          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Product Name</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{product.name}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Product ID</span>
                  <span className="font-bold text-slate-900 font-mono block mt-0.5">{product.id}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">SKU Code</span>
                  <span className="font-bold text-slate-900 font-mono block mt-0.5">{product.sku}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">HSN / SAC Code</span>
                  <span className="font-bold text-slate-900 font-mono block mt-0.5">{product.hsnCode || '—'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Category</span>
                  <span className="font-bold text-slate-900 capitalize block mt-0.5">{product.category?.replace('-', ' & ')}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Subcategory</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{product.subcategory || 'General'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Manufacturer / Brand</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{product.brand || 'HinchMart'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">GST Rate</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">{product.gstRate}%</span>
                </div>
              </div>

              {/* Technical Specifications Box in Information View */}
              {specsEntries.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Technical Specifications & Properties</span>
                    </h4>
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {specsEntries.length} attributes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {specsEntries.map(([key, val]) => (
                      <div key={key} className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="font-bold text-slate-900 block mt-0.5">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Short Description</h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    {product.shortDescription || product.description || 'No short summary provided.'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Full Technical Description & Engineering Details</h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-line">
                    {product.fullDescription || 'No full technical description provided.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Specifications */}
          {activeTab === 'specs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Technical Specifications Matrix
                </h4>
                <Link to={`/seller/products/${product.id}/edit`}>
                  <Button variant="secondary" size="xs" leftIcon={Edit2}>
                    Edit Specifications
                  </Button>
                </Link>
              </div>

              {specsEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {specsEntries.map(([key, val]) => (
                    <div key={key} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-extrabold text-slate-900 block mt-1 text-sm">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <p className="text-xs text-slate-500 italic">
                    No technical specifications configured for this material.
                  </p>
                  <Link to={`/seller/products/${product.id}/edit`}>
                    <Button variant="primary" size="sm" leftIcon={Edit2}>
                      Add Specifications Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}


          {/* TAB 3: Images */}
          {activeTab === 'images' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {(product.images || []).map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group relative">
                    <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white">
                      Image {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Documents & Compliance */}
          {activeTab === 'docs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Technical Datasheet (TDS)</h5>
                      <p className="text-[11px] text-slate-500">PDF Document • 2.4 MB</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" leftIcon={Download}>
                    Download
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">BIS IS:1786 / IS:269 Certificate</h5>
                      <p className="text-[11px] text-slate-500">Compliance Audit Report • 1.1 MB</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" leftIcon={Download}>
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Inventory & Batch Logs */}
          {activeTab === 'inventory' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Stock on Hand</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{product.stock} {product.unit}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Low Stock Threshold</span>
                  <span className="font-bold text-amber-700 block mt-0.5">{product.lowStockThreshold || 10} {product.unit}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Batch Number</span>
                  <span className="font-bold text-slate-900 font-mono block mt-0.5">{product.batchNumber || 'B-2026/LOT-8841'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Heat / Melt Lot #</span>
                  <span className="font-bold text-slate-900 font-mono block mt-0.5">{product.heatNumber || 'HEAT-9042'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Sales History */}
          {activeTab === 'sales' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Order Fulfillment History for {product.name}
              </h4>

              {productOrders.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Buyer Company</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {productOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                          <td className="py-2.5 px-3">{ord.buyer?.company || ord.buyer?.contactName || ord.customerName || 'Customer'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{formatDate(ord.createdAt)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{formatCurrency(ord.totalAmount)}</td>
                          <td className="py-2.5 px-3"><StatusBadge status={ord.orderStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500">
                  No previous orders placed for this specific material SKU yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Modals */}
      <QuickPriceModal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        product={product}
        onSave={async (prodId, data) => {
          await updateProductPrice({ id: prodId, priceData: data });
        }}
      />

      <QuickStockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        product={product}
        onSave={async (prodId, data) => {
          await updateStock({ productId: prodId, adjustment: data });
        }}
      />

      <ConfirmationDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          await deleteProduct(product.id);
          navigate('/seller/products');
        }}
        title={isDeletedByAdmin ? "Remove Product from List" : "Delete Product"}
        message={isDeletedByAdmin ? `Remove "${product.name || product.title}" from your product list? This will dismiss the deleted listing.` : `Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`}
        confirmText={isDeletedByAdmin ? "Remove from My List" : "Delete Product"}
        variant="danger"
      />

      <ConfirmationDialog
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={async () => {
          await archiveProduct(product.id);
          navigate('/seller/products');
        }}
        title="Archive Product"
        message={`Move "${product.name}" to archived catalog?`}
        confirmText="Archive Product"
        variant="warning"
      />
    </div>
  );
}
