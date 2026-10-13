import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Warehouse,
  Boxes,
  AlertTriangle,
  Download,
  Search,
  Plus,
  Sliders,
  CheckCircle2,
  XCircle,
  TrendingUp,
  IndianRupee,
  Layers,
  X,
} from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { QuickStockModal } from '../../components/products/QuickPriceModal';
import { exportToCsv } from '../../utils/exportUtils';
import { formatNumber, formatCurrency } from '../../utils/formatters';

export function InventoryStockPage() {
  const navigate = useNavigate();
  const { inventory = [], warehouses = [], isLoadingInventory, updateStock } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Real KPI Metrics derived strictly from authoritative inventory data (NO hardcoded numbers or fake fallbacks)
  const totalUnits = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (Number(item.availableStock) || 0), 0);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(
      (item) =>
        (item.isLowStock || (Number(item.availableStock) > 0 && Number(item.availableStock) <= Number(item.lowStockThreshold || 10))) &&
        Number(item.availableStock) > 0
    ).length;
  }, [inventory]);

  const outOfStockCount = useMemo(() => {
    return inventory.filter((item) => Number(item.availableStock) === 0 || item.isOutOfStock).length;
  }, [inventory]);

  const totalStockValue = useMemo(() => {
    return inventory.reduce((sum, item) => {
      const stock = Number(item.availableStock) || 0;
      const price = Number(item.sellingPrice) || Number(item.price) || 0;
      return sum + stock * price;
    }, 0);
  }, [inventory]);

  // Dynamic Filtering: Warehouse + Status + Search across Material Title, SKU, Category, Brand, Warehouse
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // 1. Warehouse Filter
      if (selectedWarehouse !== 'All' && String(item.warehouseId) !== String(selectedWarehouse)) {
        return false;
      }

      // 2. Status Filter
      if (selectedStatus !== 'All' && (item.status || '').toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }

      // 3. Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchSku = (item.sku || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchWh = (item.warehouseName || '').toLowerCase().includes(q);

        if (!matchName && !matchTitle && !matchSku && !matchCat && !matchBrand && !matchWh) {
          return false;
        }
      }

      return true;
    });
  }, [inventory, selectedWarehouse, selectedStatus, searchTerm]);

  // Paginated data slice
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInventory.slice(start, start + pageSize);
  }, [filteredInventory, currentPage, pageSize]);

  // Export real inventory data to CSV
  const handleExport = () => {
    const exportDataset = filteredInventory.length > 0 ? filteredInventory : inventory;
    const rows = exportDataset.map((i) => ({
      SKU: i.sku || 'N/A',
      Name: i.name || 'N/A',
      Category: i.category || '—',
      AvailableStock: i.availableStock ?? 0,
      ReservedStock: i.reservedStock ?? 0,
      Threshold: i.lowStockThreshold ?? 10,
      Unit: i.unit || 'PIECE',
      Price: i.sellingPrice || i.price || 0,
      Warehouse: i.warehouseName || 'Central Logistics Yard',
      Status: i.status || 'In Stock',
    }));
    exportToCsv('HinchMart_Inventory_Balance_Sheet', rows);
  };

  // Context-aware empty state
  const renderEmptyState = () => {
    if (inventory.length === 0) {
      return (
        <EmptyState
          title="No inventory records found"
          description="You haven't listed or allocated any warehouse stock for your catalog items yet."
          actionLabel="+ Add Product to Catalog"
          onAction={() => navigate('/seller/products/new')}
        />
      );
    }

    return (
      <EmptyState
        title="No inventory items match your criteria"
        description="Try adjusting your search terms, clearing warehouse allocations, or resetting status filters."
        actionLabel="Clear Filters"
        onAction={() => {
          setSearchTerm('');
          setSelectedWarehouse('All');
          setSelectedStatus('All');
          setCurrentPage(1);
        }}
      />
    );
  };

  const columns = [
    {
      header: 'Product / SKU',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">{row.name}</span>
          <span className="text-[11px] font-mono text-slate-500">
            SKU: <strong className="text-slate-700">{row.sku}</strong> • {row.category?.replace('-', ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      accessorKey: 'availableStock',
      sortable: true,
      cell: ({ row }) => {
        const isOut = Number(row.availableStock) === 0;
        const isLow = row.isLowStock;

        return (
          <div>
            <span
              className={`text-xs font-extrabold block ${
                isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              {formatNumber(row.availableStock)} {row.unit}
            </span>
            <span className="text-[10px] text-slate-400">
              Reserved: {row.reservedStock || 0} {row.unit}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Minimum Stock',
      accessorKey: 'lowStockThreshold',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-600">
          {row.lowStockThreshold} {row.unit}
        </span>
      ),
    },
    {
      header: 'Storage Warehouse',
      accessorKey: 'warehouseName',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{row.warehouseName}</span>
        </div>
      ),
    },
    {
      header: 'Stock Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const isOut = Number(row.availableStock) === 0;
        const isLow = row.isLowStock;

        if (isOut) {
          return (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Out of Stock
            </span>
          );
        }
        if (isLow) {
          return (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Low Stock
            </span>
          );
        }
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> In Stock
          </span>
        );
      },
    },
    {
      header: 'Action',
      id: 'action',
      cellClassName: 'text-right',
      cell: ({ row }) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setAdjustingProduct({
              id: row.productId || row.id,
              name: row.name,
              sku: row.sku,
              stock: row.availableStock,
              unit: row.unit,
            })
          }
        >
          Adjust Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock balance, warehouse allocations, low stock alerts, and inbound inventory tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleExport} leftIcon={Download}>
            Export Stock Sheet
          </Button>

          <Link to="/seller/inventory/warehouses">
            <Button variant="secondary" size="sm" leftIcon={Warehouse}>
              Manage Warehouses
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards (Calculated dynamically from real data; skeleton state during loading) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Stock Units */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Stock Units
            </span>
            {isLoadingInventory ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
                {formatNumber(totalUnits)}
              </span>
            )}
            <span className="text-[10px] text-slate-400">Across all warehouses</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Low Stock Alert */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Low Stock Alert
            </span>
            {isLoadingInventory ? (
              <div className="h-8 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <span className="text-2xl font-extrabold text-amber-600 mt-0.5 block">
                {lowStockCount}
              </span>
            )}
            <span className="text-[10px] text-amber-600 font-semibold">Below min threshold</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Out of Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Out of Stock
            </span>
            {isLoadingInventory ? (
              <div className="h-8 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <span className="text-2xl font-extrabold text-rose-600 mt-0.5 block">
                {outOfStockCount}
              </span>
            )}
            <span className="text-[10px] text-rose-600 font-semibold">Zero balance</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Stock Value (Calculated dynamically, never hardcoded) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Stock Value
            </span>
            {isLoadingInventory ? (
              <div className="h-8 w-24 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block">
                {formatCurrency(totalStockValue)}
              </span>
            )}
            <span className="text-[10px] text-slate-400">Estimated book value</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md relative">
          <Input
            placeholder="Search inventory by material title, SKU, or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            LeftIcon={Search}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-48">
            <Select
              options={[
                { value: 'All', label: 'All Warehouses' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="w-36">
            <Select
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'In Stock', label: 'In Stock' },
                { value: 'Low Stock', label: 'Low Stock' },
                { value: 'Out of Stock', label: 'Out of Stock' },
              ]}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. DataTable */}
      <DataTable
        columns={columns}
        data={paginatedInventory}
        isLoading={isLoadingInventory}
        keyField="id"
        emptyState={renderEmptyState()}
        pagination={{
          currentPage,
          totalItems: filteredInventory.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <QuickStockModal
          isOpen={Boolean(adjustingProduct)}
          onClose={() => setAdjustingProduct(null)}
          product={adjustingProduct}
          onSave={async (id, data) => {
            await updateStock({ productId: id, adjustment: data });
          }}
        />
      )}
    </div>
  );
}

