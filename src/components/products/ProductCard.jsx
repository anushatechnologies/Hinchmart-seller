import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  Edit2,
  Copy,
  Archive,
  Trash2,
  QrCode,
  MoreVertical,
  Layers,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { ProductStatusBadge } from './ProductStatusBadge';
import { getProductImageUrl } from '../../utils/productImages';

export function ProductCard({
  product,
  onDuplicate,
  onArchive,
  onDelete,
  onQuickPrice,
  onQuickStock,
}) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const isRejected = product.status === 'REJECTED' || product.approvalStatus === 'REJECTED';

  const isDeletedByAdmin =
    !isRejected && (
      product.status === 'DELETED_BY_ADMIN' ||
      product.status === 'DELETED' ||
      product.status === 'REMOVED_BY_ADMIN' ||
      product.approvalStatus === 'DELETED_BY_ADMIN' ||
      Boolean(product.deletedByAdmin)
    );

  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 0);
  const isOutOfStock = (product.stock || 0) === 0;

  const stockBadge = isOutOfStock ? (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-xs inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Out of Stock
    </span>
  ) : isLowStock ? (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-xs inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-950" /> Low Stock ({product.stock} {product.unit})
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-white" /> In Stock
    </span>
  );

  const handleCardClick = (e) => {
    // If clicking on an interactive control (button, link, menu), let it handle its own action
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="menu"]')) {
      return;
    }
    if (isDeletedByAdmin) {
      onDelete(product);
      return;
    }
    navigate(`/seller/products/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
    >
      {/* 1. Image Container with Badges & 3-Dot Menu */}
      <div className="relative aspect-video w-full bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
        {getProductImageUrl(product) ? (
          <img
            src={getProductImageUrl(product)}
            alt={product.name || product.title}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.prod-card-fallback-icon');
              if (fallback) fallback.classList.remove('hidden');
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : null}
        <Package className={`w-8 h-8 text-slate-300 prod-card-fallback-icon ${getProductImageUrl(product) ? 'hidden' : ''}`} />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap pointer-events-none">
          <ProductStatusBadge status={isDeletedByAdmin ? 'DELETED_BY_ADMIN' : product.status} product={product} />
          {product.brand && (
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-900/90 text-white backdrop-blur-xs">
              {product.brand}
            </span>
          )}
          {product.backendSyncNotice && (
            <span
              title={`Backend rejected: ${product.backendSyncNotice}`}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600/95 text-white backdrop-blur-xs"
            >
              Local Draft
            </span>
          )}
        </div>

        {/* Top Right 3-Dot Menu */}
        <div className="absolute top-2.5 right-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-xs flex items-center justify-center transition-all"
              title="Product Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-8 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                  {isDeletedByAdmin ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(product);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold w-full text-left"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" /> Remove from My List
                    </button>
                  ) : (
                    <>
                      <Link
                        to={`/seller/products/${product.id}`}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Eye className="w-4 h-4 text-slate-400" /> View Details
                      </Link>

                      <Link
                        to={`/seller/products/${product.id}/edit`}
                        className={`flex items-center gap-2 px-3 py-2 ${isRejected ? 'text-amber-700 font-bold bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50 hover:text-slate-900'}`}
                      >
                        <Edit2 className="w-4 h-4" /> {isRejected ? 'Edit & Re-submit' : 'Edit Product'}
                      </Link>

                      <Link
                        to="/seller/products/labels"
                        state={{ selectedProductId: product.id }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <QrCode className="w-4 h-4 text-slate-400" /> Generate Label
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDuplicate(product.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 hover:text-slate-900 w-full text-left"
                      >
                        <Copy className="w-4 h-4 text-slate-400" /> Duplicate
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onArchive(product);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-amber-50 text-amber-700 w-full text-left"
                      >
                        <Archive className="w-4 h-4 text-amber-500" /> Archive Product
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDelete(product);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-rose-600 w-full text-left"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" /> Delete Permanently
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category & HSN */}
          <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-semibold mb-1">
            <span className="uppercase tracking-wider truncate max-w-[150px]">
              {product.category?.replace('-', ' & ')}
            </span>
            {product.hsnCode && (
              <span className="font-mono text-slate-400">HSN: {product.hsnCode}</span>
            )}
          </div>

          {/* Product Name */}
          <Link
            to={`/seller/products/${product.id}`}
            className="text-sm font-black text-slate-900 hover:text-amber-600 line-clamp-2 leading-tight transition-colors"
          >
            {product.name}
          </Link>

          {/* Product ID & SKU */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-500 mt-1.5">
            <span>ID: <strong className="text-slate-800">{product.id || product.productId}</strong></span>
            <span>•</span>
            <span className="truncate">SKU: <strong className="text-slate-800">{product.sku}</strong></span>
          </div>

          {/* Deleted by admin notice */}
          {isDeletedByAdmin && (
            <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-tight flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-rose-950">Removed by Admin</span>
                <span className="text-rose-700">Listing removed from catalog by Admin.</span>
              </div>
            </div>
          )}

          {/* Rejected by admin notice */}
          {isRejected && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] leading-tight flex items-start gap-2 shadow-2xs">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-rose-950">Rejected by Admin</span>
                <span className="text-rose-700 font-medium mt-0.5 block">
                  {product.rejectionReason || 'Details require revision before approval. Click "Edit & Re-submit" to update.'}
                </span>
              </div>
            </div>
          )}

          {/* Quick Specifications preview */}
          {(() => {
            let specsObj = product.specifications || product.specs;
            if (typeof specsObj === 'string') {
              try { specsObj = JSON.parse(specsObj); } catch (_) { specsObj = null; }
            }
            if (Array.isArray(specsObj)) {
              const converted = {};
              specsObj.forEach((item) => {
                const k = item?.key || item?.name || item?.attributeName || item?.label;
                if (k) converted[k] = item?.value ?? item?.val ?? '';
              });
              specsObj = converted;
            }
            const entries = specsObj && typeof specsObj === 'object' ? Object.entries(specsObj).filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== '') : [];
            if (!entries.length) return null;
            return (
              <div className="flex flex-wrap gap-1 mt-2">
                {entries.slice(0, 3).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60 max-w-[130px] truncate">
                    <span className="text-slate-400 mr-1">{k}:</span>
                    <span className="font-semibold">{String(v)}</span>
                  </span>
                ))}
                {entries.length > 3 && (
                  <span className="text-[10px] text-slate-400 self-center font-semibold">
                    +{entries.length - 3}
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Pricing & Stock Grid */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          {/* Price */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Rate / Price</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-slate-900">
                {formatCurrency(product.sellingPrice)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">/{product.unit}</span>
            </div>
            {product.mrp && product.mrp > product.sellingPrice && (
              <span className="text-[10px] text-slate-400 line-through">
                MRP: {formatCurrency(product.mrp)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Available Stock</span>
            <span
              className={`text-sm font-black block mt-0.5 ${
                isOutOfStock
                  ? 'text-rose-600'
                  : isLowStock
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {formatNumber(product.stock)} {product.unit}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              Min: {product.lowStockThreshold || 10} {product.unit}
            </span>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {isDeletedByAdmin ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product);
              }}
              className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              title="Remove this deleted listing from your list"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove from My List
            </button>
          ) : isRejected ? (
            <>
              <Link
                to={`/seller/products/${product.id}/edit`}
                className="flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  title="Edit product details and re-submit for admin approval"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit & Re-submit
                </button>
              </Link>

              <Link
                to={`/seller/products/${product.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  title="View details"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link
                to={`/seller/products/${product.id}`}
                className="flex-1"
              >
                <button
                  type="button"
                  className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
              </Link>

              <Link
                to={`/seller/products/${product.id}/edit`}
                className="flex-1"
              >
                <button
                  type="button"
                  className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              </Link>

              <Link
                to="/seller/products/labels"
                state={{ selectedProductId: product.id }}
                title="Generate Label & Barcode"
              >
                <button
                  type="button"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
