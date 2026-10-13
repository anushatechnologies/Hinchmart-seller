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
    const c = searchParams.get('category');
    const b = searchParams.get('brand');
    const sort = searchParams.get('sortBy');
    if (s !== null) setSearchTerm(s);
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
    selectedCategory !== 'All' ||
    selectedBrand !== 'All' ||
    stockFilter !== 'All' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sortBy !== 'newest'
  );

  const handleClearFilters = () => {
    setSearchTerm('');
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
      cell: ({ row }) => (
        <div className="flex items-center gap-3 min-w-[240px]">
          <img
            src={getProductImageUrl(row)}
            alt={row.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getProductImageUrl({ ...row, images: [] });
            }}
            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
          />
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
          </div>
        </div>
      ),
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
      cell: ({ row }) => <ProductStatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      cell: ({ row }) => (
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
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
          title="Delete Product Permanently"
          message={`Are you sure you want to permanently delete "${deleteConfirmProduct.name}"? This action cannot be undone.`}
          confirmText="Yes, Delete Product"
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
  );
}
