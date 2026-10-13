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
          <ProductStatusBadge status={product.status} />
          {product.brand && (
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-900/90 text-white backdrop-blur-xs">
              {product.brand}
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
                <div className="absolute right-0 top-8 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                  <Link
                    to={`/seller/products/${product.id}`}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Eye className="w-4 h-4 text-slate-400" /> View Details
                  </Link>

                  <Link
                    to={`/seller/products/${product.id}/edit`}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400" /> Edit Product
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
        </div>
      </div>
    </div>
  );
}
