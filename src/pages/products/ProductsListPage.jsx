import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit2,
  Copy,
  Archive,
  Trash2,
  Tag,
  Boxes,
  QrCode,
  Eye,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  CheckCircle,
  LayoutGrid,
  List as ListIcon,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Package,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useInventory } from '../../hooks/useInventory';
import { getProductImageUrl } from '../../utils/productImages';
import { usePricing } from '../../hooks/usePricing';
import { useDebounce } from '../../hooks/useDebounce';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { QuickPriceModal, QuickStockModal } from '../../components/products/QuickPriceModal';
import { AddProductModal } from '../../components/products/AddProductModal';
import { ProductCard } from '../../components/products/ProductCard';
import { ProductStatusBadge } from '../../components/products/ProductStatusBadge';
import { ProductStats } from '../../components/products/ProductStats';
import { ProductFilters } from '../../components/products/ProductFilters';
import { Pagination } from '../../components/common/Pagination';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

export function ProductsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // View state (Grid vs List) with localStorage persistence
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('hinchmart_products_view') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('hinchmart_products_view', viewMode);
  }, [viewMode]);

  // Filters state with URL query param support
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'All');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'All');
  const [selectedBrand, setSelectedBrand] = useState(() => searchParams.get('brand') || 'All');
  const [stockFilter, setStockFilter] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || 'newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Sync state if URL query params change
  useEffect(() => {
    const s = searchParams.get('search');
    const st = searchParams.get('status');
    const c = searchParams.get('category');
    const b = searchParams.get('brand');
    const sort = searchParams.get('sortBy');
    if (s !== null) setSearchTerm(s);
    if (st !== null) setStatusFilter(st);
    if (c !== null) setSelectedCategory(c);
    if (b !== null) setSelectedBrand(b);
    if (sort !== null) setSortBy(sort);
  }, [searchParams]);

  // Bulk Selection
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  // Modals state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [quickPriceProduct, setQuickPriceProduct] = useState(null);
  const [quickStockProduct, setQuickStockProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [archiveConfirmProduct, setArchiveConfirmProduct] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 250);

  // Query all products for calculating accurate top stats
  const { products: allProducts = [] } = useProducts();

  // Query filtered products
  const {
    products,
    isLoading,
    deleteProduct,
    archiveProduct,
    duplicateProduct,
  } = useProducts({
    search: debouncedSearch,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    brand: selectedBrand !== 'All' ? selectedBrand : undefined,
    stockStatus: stockFilter !== 'All' ? stockFilter : undefined,
    minPrice: minPrice !== '' ? minPrice : undefined,
    maxPrice: maxPrice !== '' ? maxPrice : undefined,
    sortBy,
  });

  const { categories = [] } = useCategories();
  const { updateStock } = useInventory();
  const { updateProductPrice } = usePricing();

  // Unique brands list
  const uniqueBrands = useMemo(() => {
    const brands = new Set(allProducts.map((p) => p.brand).filter(Boolean));
    return Array.from(brands).sort();
  }, [allProducts]);

  // Active filters check
  const hasActiveFilters = Boolean(
    searchTerm ||
    statusFilter !== 'All' ||
    selectedCategory !== 'All' ||
    selectedBrand !== 'All' ||
    stockFilter !== 'All' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sortBy !== 'newest'
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setSelectedCategory('All');
    setSelectedBrand('All');
    setStockFilter('All');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Pagination slicing
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, currentPage, pageSize]);

  const handleExportCSV = () => {
    const exportRows = products.map((p) => ({
      ID: p.id,
      Name: p.name,
      SKU: p.sku,
      HSN: p.hsnCode || '—',
      Category: p.category,
      Subcategory: p.subcategory || '—',
      Brand: p.brand || '—',
      SellingPrice: p.sellingPrice,
      MRP: p.mrp || p.sellingPrice,
      Stock: p.stock,
      Unit: p.unit,
      Status: p.stock === 0 ? 'Out of Stock' : p.stock <= p.lowStockThreshold ? 'Low Stock' : 'In Stock',
      GST: `${p.gstRate}%`,
    }));
    exportToCsv('HinchMart_Products_Catalog', exportRows);
  };

  const handleBulkArchive = async () => {
    for (const id of selectedRowIds) {
      await archiveProduct(id);
    }
    setSelectedRowIds([]);
  };

  // Table Columns definition for List View
  const columns = [
    {
      header: 'Product',
      accessorKey: 'name',
      cell: ({ row }) => {
        const prodImg = getProductImageUrl(row);
        return (
          <div className="flex items-center gap-3 min-w-[240px]">
            <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
              {prodImg ? (
                <img
                  src={prodImg}
                  alt={row.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.table-fallback-icon');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <Package className={`w-5 h-5 text-slate-300 table-fallback-icon ${prodImg ? 'hidden' : ''}`} />
            </div>
          <div className="min-w-0">
            <Link
              to={`/seller/products/${row.id}`}
              className="text-xs font-bold text-slate-900 hover:text-emerald-700 block line-clamp-1 transition-colors"
            >
              {row.name}
            </Link>
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-500 mt-0.5">
              <span>ID: <strong className="text-slate-700">{row.id}</strong></span>
              <span>•</span>
              <span className="text-slate-600 font-bold">{row.brand || 'HinchMart'}</span>
            </div>
            {(row.status === 'REJECTED' || row.approvalStatus === 'REJECTED') && (
              <div className="text-[10px] text-rose-700 font-semibold mt-1 flex items-start gap-1 bg-rose-50 border border-rose-200/80 rounded px-1.5 py-0.5 max-w-xs">
                <span>❌ {row.rejectionReason || 'Requires revision. Click Edit to update and re-submit.'}</span>
              </div>
            )}
            {row.backendSyncNotice && (
              <div title={row.backendSyncNotice} className="text-[10px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
                <span>⚠️ Local only (Backend rejected: {row.backendSyncNotice.length > 40 ? row.backendSyncNotice.slice(0, 40) + '...' : row.backendSyncNotice})</span>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
    {
      header: 'SKU / HSN',
      accessorKey: 'sku',
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-slate-800 block">{row.sku}</span>
          <span className="text-[10.5px] text-slate-400">HSN: {row.hsnCode || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Category / Brand',
      accessorKey: 'category',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block">{row.category}</span>
          <span className="text-[11px] text-slate-500 font-medium block">{row.subcategory || row.brand}</span>
        </div>
      ),
    },
    {
      header: 'Selling Price (Excl. GST)',
      accessorKey: 'sellingPrice',
      sortable: true,
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-extrabold text-slate-900 block">
            {formatCurrency(row.sellingPrice || row.price)}
          </span>
          {row.mrp > (row.sellingPrice || row.price) && (
            <span className="text-[10.5px] text-slate-400 line-through block">
              MRP: {formatCurrency(row.mrp)}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickPriceProduct(row);
            }}
            className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold block mt-0.5"
          >
            Edit Rate
          </button>
        </div>
      ),
    },
    {
      header: 'Stock',
      accessorKey: 'stock',
      sortable: true,
      cell: ({ row }) => {
        const isLow = row.stock > 0 && row.stock <= (row.lowStockThreshold || 0);
        const isOut = (row.stock || 0) === 0;

        return (
          <div>
            <span
              className={`text-xs font-bold block ${
                isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              {formatNumber(row.stock)} {row.unit}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Min: {row.lowStockThreshold || 10} {row.unit}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuickStockProduct(row);
              }}
              className="text-[10px] text-blue-600 hover:text-blue-700 font-bold block mt-0.5"
            >
              Update Stock
            </button>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        return <ProductStatusBadge status={row.status} product={row} />;
      },
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      cell: ({ row }) => {
        const isRejected = row.status === 'REJECTED' || row.approvalStatus === 'REJECTED';
        const isDeleted = !isRejected && (row.status === 'DELETED_BY_ADMIN' || row.deletedByAdmin);

        if (isDeleted) {
          return (
            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(row)}
                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                title="Remove from My List"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Remove</span>
              </button>
            </div>
          );
        }

        if (isRejected) {
          return (
            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              <Link to={`/seller/products/${row.id}/edit`}>
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                  title="Edit and re-submit this rejected listing to Admin"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Re-submit</span>
                </button>
              </Link>
              <Link to={`/seller/products/${row.id}`}>
                <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="View Details">
                  <Eye className="w-4 h-4" />
                </button>
              </Link>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Link to={`/seller/products/${row.id}`} title="View Product Details">
              <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </Link>

            <Link to={`/seller/products/${row.id}/edit`} title="Edit Product">
              <button className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </Link>

            <Link
              to="/seller/products/labels"
              state={{ selectedProductId: row.id }}
              title="Generate QR & Barcode Label"
            >
              <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                <QrCode className="w-4 h-4" />
              </button>
            </Link>

            <button
              onClick={() => duplicateProduct(row.id)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Duplicate Product"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => setArchiveConfirmProduct(row)}
              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Archive Product"
            >
              <Archive className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDeleteConfirmProduct(row)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Permanently"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Status/Stock filter chips for phone view matching Screen 3
  const [mobileFilter, setMobileFilter] = useState('All');
  const mobileFilterChips = ['All', 'Active', 'Rejected', 'Low Stock', 'Out of Stock'];

  const displayMobileProducts = useMemo(() => {
    return (products || [])
      .map((p) => {
        const isRejected = p.status === 'REJECTED' || p.approvalStatus === 'REJECTED';
        const isDeletedByAdmin =
          !isRejected && (
            p.status === 'DELETED_BY_ADMIN' ||
            p.status === 'DELETED' ||
            p.status === 'REMOVED_BY_ADMIN' ||
            p.approvalStatus === 'DELETED_BY_ADMIN' ||
            Boolean(p.deletedByAdmin)
          );
        const isApproved =
          !isRejected &&
          !isDeletedByAdmin &&
          (p.status === 'APPROVED' ||
            p.approvalStatus === 'APPROVED' ||
            p.status === 'ACTIVE' ||
            p.status === 'Active' ||
            Boolean(p.active));
        const isPending = !isRejected && !isDeletedByAdmin && !isApproved;
        const isLowStock = (p.stock || 0) <= (p.lowStockThreshold || 10) && (p.stock || 0) > 0;
        const isOutOfStock = (p.stock || 0) === 0;

        return {
          id: p.id || p.productId,
          name: p.name || p.title,
          sku: p.sku || '—',
          brand: p.brand || '',
          category: p.category || '',
          price: p.sellingPrice || p.price || 0,
          mrp: p.mrp || 0,
          stock: p.stock || 0,
          unit: p.unit || 'units',
          rejectionReason: p.rejectionReason || '',
          isRejected,
          isDeletedByAdmin,
          isPending,
          isApproved,
          isLowStock,
          isOutOfStock,
          rawProduct: p,
          image: getProductImageUrl(p) || null,
        };
      })
      .filter((p) => {
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchCat && !matchBrand) return false;
        }
        if (mobileFilter === 'Active') return p.isApproved && !p.isLowStock && !p.isOutOfStock;
        if (mobileFilter === 'Rejected') return p.isRejected || p.isDeletedByAdmin;
        if (mobileFilter === 'Low Stock') return p.isApproved && p.isLowStock;
        if (mobileFilter === 'Out of Stock') return p.isApproved && p.isOutOfStock;
        return true;
      });
  }, [products, mobileFilter, searchTerm]);

  return (
    <>
      {/* ================= PHONE VIEW PRODUCTS (All Statuses, Rejection Banners & Actions Included) ================= */}
      <div className="block md:hidden space-y-3 pb-6">
        {/* Title and Add Product Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">My Products</h1>
            <p className="text-xs text-slate-500">Live, pending & rejected catalog listings</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/seller/products/add')}
            className="bg-[#1D64ED] hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, SKU, or brand..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
          />
        </div>

        {/* Horizontal Status Chips (All, Active, Rejected, Low Stock, Out of Stock) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {mobileFilterChips.map((chip) => {
            const isActive = mobileFilter === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setMobileFilter(chip)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? chip === 'Rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-[#1D64ED] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Product Cards List */}
        <div className="space-y-3">
          {displayMobileProducts.map((product) => {
            const hasRejectionOrDeletion = product.isRejected || product.isDeletedByAdmin;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl p-3.5 border shadow-2xs space-y-3 transition-shadow ${
                  hasRejectionOrDeletion ? 'border-rose-200/90' : 'border-slate-200/80'
                }`}
              >
                {/* 1. Header Badges & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ProductStatusBadge
                      status={product.isDeletedByAdmin ? 'DELETED_BY_ADMIN' : product.rawProduct.status}
                      product={product.rawProduct}
                    />
                    {product.brand && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-900 text-white">
                        {product.brand}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/seller/products/${product.id}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!product.isDeletedByAdmin && (
                      <button
                        type="button"
                        onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Listing"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Main Item Section (Image + Title/Category/SKU) */}
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.prod-fallback-icon');
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Package className={`w-8 h-8 text-slate-300 prod-fallback-icon ${product.image ? 'hidden' : ''}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {product.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                        {product.category.replace('-', ' & ')}
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5">
                      {product.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                      ID: <strong className="text-slate-700">{product.id}</strong> • SKU: <strong className="text-slate-700">{product.sku}</strong>
                    </p>
                  </div>
                </div>

                {/* 3. Rejection or Admin Deletion Alert Banner */}
                {product.isRejected && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 shadow-2xs">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-rose-950">Rejected by Admin</span>
                      <span className="text-rose-700 text-[11px] font-medium mt-0.5 block leading-tight">
                        {product.rejectionReason || 'Removed from inventory by seller'}
                      </span>
                    </div>
                  </div>
                )}

                {product.isDeletedByAdmin && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-rose-950">Removed by Admin</span>
                      <span className="text-rose-700 text-[11px] font-medium mt-0.5 block leading-tight">
                        Listing removed from catalog by Admin.
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Pricing & Available Stock Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Rate / Price</span>
                    <span className="text-sm font-black text-slate-900">
                      ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
                      <span className="text-[10px] text-slate-500 font-normal"> /{product.unit}</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Available Stock</span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span
                        className={`text-xs font-black ${
                          product.isOutOfStock ? 'text-rose-600' : product.isLowStock ? 'text-amber-600' : 'text-slate-900'
                        }`}
                      >
                        {typeof product.stock === 'number' ? product.stock.toLocaleString('en-IN') : product.stock} {product.unit}
                      </span>
                      {!hasRejectionOrDeletion && (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                            product.isLowStock
                              ? 'bg-amber-50 text-amber-700'
                              : product.isOutOfStock
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${
                              product.isLowStock ? 'bg-amber-500' : product.isOutOfStock ? 'bg-slate-400' : 'bg-emerald-500'
                            }`}
                          />
                          {product.isLowStock ? 'Low' : product.isOutOfStock ? 'Out' : 'In Stock'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Bottom Action Buttons for Rejected or Deleted by Admin */}
                {product.isRejected && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Edit & Re-submit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/seller/products/${product.id}`)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                )}

                {product.isDeletedByAdmin && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmProduct(product.rawProduct)}
                      className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remove from My List</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {displayMobileProducts.length === 0 && (
            <div className="bg-white rounded-xl p-8 border border-slate-100 text-center">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No products found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= LAPTOP / DESKTOP PRODUCTS (100% Unchanged) ================= */}
      <div className="hidden md:block space-y-6">
        {/* 1. PRODUCTS PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Products
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your construction products, inventory, pricing, and product information.
            </p>
          </div>

          {/* Header Controls: Export, Upload, Add Product, Grid/List Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={Download}
          >
            Export CSV
          </Button>

          <Link to="/seller/products/bulk-upload">
            <Button variant="secondary" size="sm" leftIcon={Upload}>
              Bulk Upload
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setIsAddProductModalOpen(true)}
          >
            Add Product
          </Button>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View (Visual Browsing)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View (Table Management)"
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PRODUCT STATISTICS SUMMARY CARDS */}
      <ProductStats
        products={allProducts}
        activeStatus={statusFilter}
        onFilterStatus={(st) => {
          setStatusFilter(st);
          setCurrentPage(1);
        }}
        onFilterStock={(stockType) => {
          setStockFilter(stockType);
          setCurrentPage(1);
        }}
      />

      {/* 3. SEARCH AND FILTERS SECTION */}
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        category={selectedCategory}
        onCategoryChange={(val) => {
          setSelectedCategory(val);
          setCurrentPage(1);
        }}
        categories={categories}
        stockStatus={stockFilter}
        onStockStatusChange={(val) => {
          setStockFilter(val);
          setCurrentPage(1);
        }}
        brand={selectedBrand}
        onBrandChange={(val) => {
          setSelectedBrand(val);
          setCurrentPage(1);
        }}
        brands={uniqueBrands}
        sortBy={sortBy}
        onSortByChange={(val) => setSortBy(val)}
        minPrice={minPrice}
        onMinPriceChange={(val) => {
          setMinPrice(val);
          setCurrentPage(1);
        }}
        maxPrice={maxPrice}
        onMaxPriceChange={(val) => {
          setMaxPrice(val);
          setCurrentPage(1);
        }}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Bulk Selection Action Bar */}
      {selectedRowIds.length > 0 && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in duration-150 shadow-xs">
          <span className="font-bold text-emerald-950">
            {selectedRowIds.length} products selected for batch operations
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkArchive}
              leftIcon={Archive}
            >
              Bulk Archive
            </Button>

            <Link to="/seller/pricing/bulk" state={{ selectedIds: selectedRowIds }}>
              <Button variant="primary" size="sm" leftIcon={Tag}>
                Bulk Price Update
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 4 & 5. MAIN PRODUCTS DISPLAY: GRID VIEW OR LIST VIEW */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading construction products catalog...</p>
        </div>
      ) : products.length === 0 ? (
        /* 12. EMPTY STATE */
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>

          {hasActiveFilters ? (
            <div>
              <h3 className="text-base font-bold text-slate-900">No products found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No construction materials match your current search and filter criteria. Try clearing filters or searching another keyword.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={handleClearFilters} leftIcon={RotateCcw}>
                  Clear Filters
                </Button>
                <Link to="/seller/products/add">
                  <Button variant="primary" size="sm" leftIcon={Plus}>
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
                <Package className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No products in your catalog yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                All previous sample listings have been cleared. Click below to add your first product using the new 4-tier hierarchy.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={Plus}
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-sm"
                >
                  Add Your First Product
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* 4. GRID VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedData.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDuplicate={duplicateProduct}
                onArchive={(p) => setArchiveConfirmProduct(p)}
                onDelete={(p) => setDeleteConfirmProduct(p)}
                onQuickPrice={(p) => setQuickPriceProduct(p)}
                onQuickStock={(p) => setQuickStockProduct(p)}
              />
            ))}
          </div>

          {/* Grid View Pagination */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value={8}>8 per page</option>
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
              </select>
              <span>of {totalItems} products</span>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      ) : (
        /* 5. LIST / TABLE VIEW */
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={paginatedData}
            keyField="id"
            isLoading={isLoading}
            selectedRowIds={selectedRowIds}
            onSelectRow={(id, checked) => {
              setSelectedRowIds((prev) =>
                checked ? [...prev, id] : prev.filter((item) => item !== id)
              );
            }}
            onSelectAll={(checked) => {
              setSelectedRowIds(checked ? paginatedData.map((p) => p.id) : []);
            }}
            onRowClick={(row) => navigate(`/seller/products/${row.id}`)}
            pagination={{
              currentPage,
              totalItems: products.length,
              pageSize,
              onPageChange: (p) => setCurrentPage(p),
            }}
          />
        </div>
      )}

      {/* Quick Action Modals */}
      {quickPriceProduct && (
        <QuickPriceModal
          isOpen={Boolean(quickPriceProduct)}
          onClose={() => setQuickPriceProduct(null)}
          product={quickPriceProduct}
          onSave={async (id, data) => {
            await updateProductPrice({ id, priceData: data });
          }}
        />
      )}

      {quickStockProduct && (
        <QuickStockModal
          isOpen={Boolean(quickStockProduct)}
          onClose={() => setQuickStockProduct(null)}
          product={quickStockProduct}
          onSave={async (id, data) => {
            await updateStock({ productId: id, adjustment: data });
          }}
        />
      )}

      {deleteConfirmProduct && (
        <ConfirmationDialog
          isOpen={Boolean(deleteConfirmProduct)}
          onClose={() => setDeleteConfirmProduct(null)}
          onConfirm={async () => {
            await deleteProduct(deleteConfirmProduct.id);
            setDeleteConfirmProduct(null);
          }}
          title={
            deleteConfirmProduct.status === 'DELETED_BY_ADMIN' || deleteConfirmProduct.deletedByAdmin
              ? 'Remove Product from List'
              : 'Delete Product Permanently'
          }
          message={
            deleteConfirmProduct.status === 'DELETED_BY_ADMIN' || deleteConfirmProduct.deletedByAdmin
              ? `Remove "${deleteConfirmProduct.name || deleteConfirmProduct.title}" from your product list? This will dismiss the deleted listing from your portal.`
              : `Are you sure you want to permanently delete "${deleteConfirmProduct.name || deleteConfirmProduct.title}"? This action cannot be undone.`
          }
          confirmText={
            deleteConfirmProduct.status === 'DELETED_BY_ADMIN' || deleteConfirmProduct.deletedByAdmin
              ? 'Remove from My List'
              : 'Yes, Delete Product'
          }
          variant="danger"
        />
      )}

      {archiveConfirmProduct && (
        <ConfirmationDialog
          isOpen={Boolean(archiveConfirmProduct)}
          onClose={() => setArchiveConfirmProduct(null)}
          onConfirm={async () => {
            await archiveProduct(archiveConfirmProduct.id);
            setArchiveConfirmProduct(null);
          }}
          title="Archive Product"
          message={`Move "${archiveConfirmProduct.name}" to archived catalog? It will no longer be visible to buyers on HinchMart.`}
          confirmText="Archive Product"
          variant="warning"
        />
      )}

      {/* Add New Marketplace Product Modal (Matches Screenshots 3, 4, 5) */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
      />
    </div>
    </>
  );
}
