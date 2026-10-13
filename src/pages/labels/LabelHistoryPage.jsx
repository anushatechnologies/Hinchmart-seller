import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History,
  QrCode,
  Plus,
  Search,
  Download,
  Eye,
  Printer,
  Trash2,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  Building,
  Package,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUpDown,
  MoreVertical,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
  Tag,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useLabelHistory } from '../../hooks/useLabels';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { useUIStore } from '../../store/uiStore';
import { Drawer } from '../../components/common/Drawer';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ProductLabelPreview } from '../../components/labels/ProductLabelPreview';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Skeleton } from '../../components/common/Skeleton';
import { exportToCsv, triggerPrint } from '../../utils/exportUtils';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export function LabelHistoryPage() {
  const navigate = useNavigate();
  const addToast = useUIStore((state) => state.addToast);
  const { profile } = useSellerProfile();
  const { customers = [] } = useCustomers();
  const { products = [] } = useProducts();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sorting & Pagination States
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection & Action States
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [drawerLabel, setDrawerLabel] = useState(null);
  const [deleteDialogItem, setDeleteDialogItem] = useState(null); // single or 'bulk'
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Query Hook
  const {
    history = [],
    isLoading,
    isError,
    deleteLabel,
    deleteMultipleLabels,
    updateStatus,
    refetch,
  } = useLabelHistory({
    search: searchTerm,
    customerId: selectedCustomer !== 'All' ? selectedCustomer : undefined,
    productId: selectedProduct !== 'All' ? selectedProduct : undefined,
    status: selectedStatus !== 'All' ? selectedStatus : undefined,
    dateFilter: dateFilter !== 'All' ? dateFilter : undefined,
    startDate: dateFilter === 'Custom Range' ? customStartDate : undefined,
    endDate: dateFilter === 'Custom Range' ? customEndDate : undefined,
  });

  // Calculate Dynamic KPIs (from all historical label data)
  const stats = useMemo(() => {
    const total = history.length;
    const printed = history.filter((l) => l.status === 'Printed').length;
    const generated = history.filter((l) => l.status === 'Generated' || !l.status).length;

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const thisMonth = history.filter((l) => {
      const d = new Date(l.createdAt || 0);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    }).length;

    return { total, printed, generated, thisMonth };
  }, [history]);

  // Unique Customer Options from data + CRM
  const customerOptions = useMemo(() => {
    const map = new Map();
    history.forEach((l) => {
      if (l.customerId && l.customerCompany) {
        map.set(l.customerId, l.customerCompany);
      }
    });
    customers.forEach((c) => {
      if (c.id && c.companyName) {
        map.set(c.id, c.companyName);
      }
    });
    return [
      { value: 'All', label: 'All Customers' },
      ...Array.from(map.entries()).map(([val, name]) => ({
        value: val,
        label: name,
      })),
    ];
  }, [history, customers]);

  // Unique Product Options from data + products
  const productOptions = useMemo(() => {
    const map = new Map();
    history.forEach((l) => {
      const id = l.productId || l.productSku;
      if (id && l.productName) {
        map.set(id, l.productName);
      }
    });
    products.forEach((p) => {
      if (p.id && p.name) {
        map.set(p.id, p.name);
      }
    });
    return [
      { value: 'All', label: 'All Products' },
      ...Array.from(map.entries()).map(([val, name]) => ({
        value: val,
        label: name,
      })),
    ];
  }, [history, products]);

  // Handle Sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sorted and Filtered items
  const sortedHistory = useMemo(() => {
    const list = [...history];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
      } else if (sortField === 'quantity') {
        aVal = Number(a.quantity || 0);
        bVal = Number(b.quantity || 0);
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [history, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedHistory.length / pageSize) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedHistory.slice(start, start + pageSize);
  }, [sortedHistory, currentPage, pageSize]);

  // Clear Filters Handler
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCustomer('All');
    setSelectedProduct('All');
    setSelectedStatus('All');
    setDateFilter('All');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCustomer !== 'All' ||
    selectedProduct !== 'All' ||
    selectedStatus !== 'All' ||
    dateFilter !== 'All';

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allVisibleIds = paginatedHistory.map((item) => item.id);
      setSelectedLabelIds(Array.from(new Set([...selectedLabelIds, ...allVisibleIds])));
    } else {
      const visibleIdsSet = new Set(paginatedHistory.map((item) => item.id));
      setSelectedLabelIds(selectedLabelIds.filter((id) => !visibleIdsSet.has(id)));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllVisibleSelected =
    paginatedHistory.length > 0 &&
    paginatedHistory.every((item) => selectedLabelIds.includes(item.id));

  // Single Actions
  const handlePrintSingle = async (labelItem) => {
    try {
      await updateStatus({ id: labelItem.id, status: 'Printed' });
      setDrawerLabel((prev) => (prev?.id === labelItem.id ? { ...prev, status: 'Printed' } : prev));
      triggerPrint();
    } catch (err) {
      triggerPrint();
    }
  };

  const handleReprint = (labelItem) => {
    navigate('/seller/products/labels', {
      state: {
        reloadedLabel: labelItem,
        preselectedCustomer: {
          id: labelItem.customerId,
          companyName: labelItem.customerCompany,
          name: labelItem.customerName,
          gstin: labelItem.customerGstin,
          mobile: labelItem.customerMobile,
          deliveryAddress: labelItem.customerDeliveryAddress,
          status: 'Active',
        },
      },
    });
  };

  const handleExportSelectedOrAll = (ids = null) => {
    const targetList = ids
      ? history.filter((l) => ids.includes(l.id))
      : history;

    const rows = targetList.map((l) => ({
      LabelID: l.id,
      CustomerCompany: l.customerCompany,
      CustomerContact: l.customerName,
      CustomerGSTIN: l.customerGstin,
      ProductName: l.productName,
      SKU: l.productSku || l.productId,
      Quantity: `${l.quantity} ${l.unit || 'Units'}`,
      BatchNumber: l.batchNumber,
      ManufacturingDate: l.manufacturingDate,
      ExpiryDate: l.expiryDate,
      Status: l.status || 'Generated',
      GeneratedBy: l.generatedBy,
      CreatedDate: l.createdAt,
    }));
    exportToCsv(
      `HinchMart_Label_History_${ids ? 'Selected' : 'All'}_${Date.now()}`,
      rows
    );
  };

  // Bulk Actions
  const handleBulkPrint = async () => {
    for (const id of selectedLabelIds) {
      await updateStatus({ id, status: 'Printed' });
    }
    triggerPrint();
  };

  const handleConfirmDelete = async () => {
    if (deleteDialogItem === 'bulk') {
      await deleteMultipleLabels(selectedLabelIds);
      setSelectedLabelIds([]);
    } else if (deleteDialogItem) {
      await deleteLabel(deleteDialogItem.id);
      if (drawerLabel?.id === deleteDialogItem.id) setDrawerLabel(null);
    }
    setDeleteDialogItem(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Label History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track, search, manage, print and download all generated product labels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExportSelectedOrAll(null)}
            leftIcon={Download}
          >
            Export CSV
          </Button>

          <Link to="/seller/products/labels">
            <Button variant="primary" size="sm" leftIcon={Plus}>
              Create Label
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Dynamic Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Labels */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Labels
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats.total}
            </span>
            <span className="text-[10.5px] text-slate-400">Total generated archive</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Printed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Printed
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats.printed}
            </span>
            <span className="text-[10.5px] text-emerald-700 font-semibold">Dispatched & printed</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Printer className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Generated */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              Generated
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats.generated}
            </span>
            <span className="text-[10.5px] text-amber-700 font-semibold">Ready for printing</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: This Month */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
              This Month
            </span>
            <span className="text-2xl font-black text-purple-600 mt-1 block">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats.thisMonth}
            </span>
            <span className="text-[10.5px] text-slate-400">Current calendar month</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Section Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search labels by ID, customer, product, SKU, batch..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              LeftIcon={Search}
            />
          </div>

          {/* Customer Filter */}
          <div>
            <Select
              options={customerOptions}
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Product Filter */}
          <div>
            <Select
              options={productOptions}
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Generated', label: 'Generated' },
                { value: 'Printed', label: 'Printed' },
              ]}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Date Filter & Clear Toolbar Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Date:
            </span>
            {['All', 'Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Custom Range'].map(
              (df) => (
                <button
                  key={df}
                  type="button"
                  onClick={() => {
                    setDateFilter(df);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-semibold transition-all',
                    dateFilter === df
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {df === 'All' ? 'All Time' : df}
                </button>
              )
            )}
          </div>

          {/* Custom Date Inputs */}
          {dateFilter === 'Custom Range' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs p-1.5 border border-slate-200 rounded-md font-medium"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs p-1.5 border border-slate-200 rounded-md font-medium"
              />
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 ml-auto"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Bulk Action Toolbar (When labels selected) */}
      {selectedLabelIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">
              {selectedLabelIds.length}
            </span>
            <span>label{selectedLabelIds.length > 1 ? 's' : ''} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkPrint}
              leftIcon={Printer}
              className="bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 text-xs"
            >
              Print Selected
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExportSelectedOrAll(selectedLabelIds)}
              leftIcon={Download}
              className="bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 text-xs"
            >
              Download Selected
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteDialogItem('bulk')}
              leftIcon={Trash2}
              className="text-xs"
            >
              Delete Selected
            </Button>

            <button
              type="button"
              onClick={() => setSelectedLabelIds([])}
              className="text-slate-400 hover:text-white text-xs ml-2 underline"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 5. Error State */}
      {isError && (
        <div className="p-8 bg-rose-50 border border-rose-300 rounded-xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-950">Unable to load label history</h3>
          <p className="text-xs text-rose-700 max-w-sm mx-auto">
            An error occurred while retrieving label records from the local repository. Please try again.
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* 6. Desktop & Tablet Table View */}
      {!isError && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 font-bold uppercase text-[10.5px] text-slate-600 border-b border-slate-200">
                <tr>
                  {/* Master Checkbox (Center) */}
                  <th className="p-3.5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </th>

                  {/* Label ID (Left) */}
                  <th
                    className="p-3.5 cursor-pointer hover:text-slate-900 select-none text-left"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Label ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* Customer (Left) */}
                  <th
                    className="p-3.5 cursor-pointer hover:text-slate-900 select-none text-left"
                    onClick={() => handleSort('customerCompany')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Customer</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* Product (Left) */}
                  <th
                    className="p-3.5 cursor-pointer hover:text-slate-900 select-none text-left"
                    onClick={() => handleSort('productName')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* SKU (Center) */}
                  <th className="p-3.5 text-center">SKU</th>

                  {/* Quantity (Center) */}
                  <th
                    className="p-3.5 cursor-pointer hover:text-slate-900 select-none text-center"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Quantity</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* Generated Date (Center) */}
                  <th
                    className="p-3.5 cursor-pointer hover:text-slate-900 select-none text-center"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Generated Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* Status (Center) */}
                  <th className="p-3.5 text-center">Status</th>

                  {/* Actions (Center) */}
                  <th className="p-3.5 text-center w-28">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="p-3.5 text-center">
                        <Skeleton className="w-4 h-4 mx-auto" />
                      </td>
                      <td className="p-3.5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-3.5">
                        <Skeleton className="h-4 w-36" />
                      </td>
                      <td className="p-3.5">
                        <Skeleton className="h-4 w-44" />
                      </td>
                      <td className="p-3.5 text-center">
                        <Skeleton className="h-4 w-20 mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <Skeleton className="h-4 w-28 mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <Skeleton className="h-4 w-16 mx-auto rounded-full" />
                      </td>
                      <td className="p-3.5 text-center">
                        <Skeleton className="h-4 w-16 mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-3">
                        <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-800">
                          {hasActiveFilters ? 'No labels found' : 'No labels generated yet'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {hasActiveFilters
                            ? 'There are no generated labels matching your current filters. Try resetting the filters.'
                            : 'Create your first product label in the Label Generator to see it here.'}
                        </p>
                        {hasActiveFilters ? (
                          <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                            Clear Filters
                          </Button>
                        ) : (
                          <Link to="/seller/products/labels">
                            <Button variant="primary" size="sm" leftIcon={Plus}>
                              Create Label
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((row) => {
                    const isSelected = selectedLabelIds.includes(row.id);
                    const isPrinted = row.status === 'Printed';

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setDrawerLabel(row)}
                        className={cn(
                          'hover:bg-amber-50/40 cursor-pointer transition-colors group',
                          isSelected && 'bg-amber-50/70'
                        )}
                      >
                        {/* Checkbox (Center) */}
                        <td
                          className="p-3.5 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRow(row.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(row.id)}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                          />
                        </td>

                        {/* Label ID (Left) */}
                        <td className="p-3.5 text-left">
                          <span className="font-mono font-bold text-slate-900 block group-hover:text-amber-600">
                            {row.id}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {row.labelSize || '4x6'} Tag
                          </span>
                        </td>

                        {/* Customer (Left) */}
                        <td className="p-3.5 text-left">
                          <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                            {row.customerCompany}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                            Attn: {row.customerName || 'Consignee'} • ID: {row.customerId}
                          </span>
                        </td>

                        {/* Product (Left) */}
                        <td className="p-3.5 text-left">
                          <span className="font-bold text-slate-800 line-clamp-1 max-w-[220px]">
                            {row.productName}
                          </span>
                          <span className="text-[10.5px] text-slate-400 block font-mono">
                            Lot: {row.batchNumber || '—'}
                          </span>
                        </td>

                        {/* SKU (Center) */}
                        <td className="p-3.5 text-center">
                          <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {row.productSku || row.productId || '—'}
                          </span>
                        </td>

                        {/* Quantity (Center) */}
                        <td className="p-3.5 text-center font-bold text-slate-900">
                          {row.quantity} <span className="text-[10px] text-slate-500 font-normal">{row.unit || 'Units'}</span>
                        </td>

                        {/* Generated Date (Center) */}
                        <td className="p-3.5 text-center text-slate-600 whitespace-nowrap">
                          {formatDate(row.createdAt, true)}
                        </td>

                        {/* Status (Center) */}
                        <td className="p-3.5 text-center">
                          {isPrinted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Printed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Generated
                            </span>
                          )}
                        </td>

                        {/* Actions (Center with 3-dot dropdown menu) */}
                        <td
                          className="p-3.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setDrawerLabel(row)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                title="View Label Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePrintSingle(row)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Print Label"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setActiveActionMenuId(activeActionMenuId === row.id ? null : row.id)
                                }
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Dropdown Popover */}
                            {activeActionMenuId === row.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setActiveActionMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 text-left text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setDrawerLabel(row);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-400" /> View Label
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handlePrintSingle(row);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-400" /> Print Label
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleExportSelectedOrAll([row.id]);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-400" /> Download PDF / CSV
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleReprint(row);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Reprint in Generator
                                  </button>

                                  <div className="border-t border-slate-100 my-1" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setDeleteDialogItem(row);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 7. Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded px-2 py-1 font-semibold text-slate-800"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-400 ml-2">
                Showing {sortedHistory.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, sortedHistory.length)} of {sortedHistory.length} labels
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                ← Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                let pageNum = idx + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + idx;
                  if (pageNum > totalPages) pageNum = totalPages - 4 + idx;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-7 h-7 rounded text-xs font-semibold transition-all',
                      currentPage === pageNum
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Mobile Card View (Responsive on mobile screens) */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))
        ) : paginatedHistory.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
            <QrCode className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No labels found</h4>
            <p className="text-xs text-slate-500">No records match the current filters.</p>
          </div>
        ) : (
          paginatedHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => setDrawerLabel(item)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-xs">{item.id}</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{item.customerCompany}</p>
                </div>
                {item.status === 'Printed' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Printed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Generated
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Product:</strong> {item.productName}
                </p>
                <p>
                  <strong>SKU:</strong> <span className="font-mono">{item.productSku || item.productId}</span>
                </p>
                <p>
                  <strong>Quantity:</strong> {item.quantity} {item.unit || 'Units'} • <strong>Lot:</strong> {item.batchNumber}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatDate(item.createdAt, true)}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDrawerLabel(item)}
                  leftIcon={Eye}
                  className="flex-1 text-xs"
                >
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePrintSingle(item)}
                  leftIcon={Printer}
                  className="flex-1 text-xs"
                >
                  Print
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDialogItem(item)}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {sortedHistory.length > pageSize && (
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 font-semibold disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 font-semibold disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* 9. Label Details Side Drawer */}
      <Drawer
        isOpen={Boolean(drawerLabel)}
        onClose={() => setDrawerLabel(null)}
        title="Label Details"
        subtitle={drawerLabel ? `${drawerLabel.id} • ${drawerLabel.customerCompany}` : ''}
        width="max-w-xl"
        footer={
          drawerLabel && (
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleReprint(drawerLabel)}
                leftIcon={RotateCcw}
              >
                Reprint in Generator
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExportSelectedOrAll([drawerLabel.id])}
                  leftIcon={Download}
                >
                  Download
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handlePrintSingle(drawerLabel)}
                  leftIcon={Printer}
                >
                  Print Label
                </Button>
              </div>
            </div>
          )
        }
      >
        {drawerLabel && (
          <div className="space-y-5 text-xs">
            {/* Meta Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-sm text-slate-900">
                  {drawerLabel.id}
                </span>
                {drawerLabel.status === 'Printed' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Printed
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Generated
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">Generated On:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(drawerLabel.createdAt, true)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Generated By:</span>
                  <span className="font-semibold text-slate-800">
                    {drawerLabel.generatedBy || profile?.name || 'Seller Admin'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer & Destination */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-500" /> Consignee Customer Details
              </h4>
              <p className="font-bold text-sm text-slate-900">{drawerLabel.customerCompany}</p>
              <p className="text-slate-600">
                Contact: {drawerLabel.customerName} • Mobile: {drawerLabel.customerMobile || '—'}
              </p>
              <p className="font-mono text-slate-600">GSTIN: {drawerLabel.customerGstin || 'Unregistered'}</p>
              <p className="text-slate-700 bg-amber-50/60 p-2 rounded border border-amber-200/60 text-[11px]">
                <strong>Site Delivery Address:</strong> {drawerLabel.customerDeliveryAddress}
              </p>
            </div>

            {/* Product & Lot Details */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-500" /> Material & Batch Lot
              </h4>
              <p className="font-bold text-sm text-slate-900">{drawerLabel.productName}</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block">SKU / Product ID:</span>
                  <span className="font-bold text-slate-900">{drawerLabel.productSku || drawerLabel.productId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dispatch Quantity:</span>
                  <span className="font-bold text-slate-900">{drawerLabel.quantity} {drawerLabel.unit || 'Units'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Batch / Lot #:</span>
                  <span className="font-bold text-amber-700">{drawerLabel.batchNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mfg / Expiry:</span>
                  <span className="text-slate-800">{drawerLabel.manufacturingDate} / {drawerLabel.expiryDate}</span>
                </div>
              </div>
            </div>

            {/* Live Physical Product Label Preview */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-amber-500" /> Actual Generated Label Preview
              </h4>
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 overflow-hidden">
                <ProductLabelPreview
                  product={{
                    id: drawerLabel.productId,
                    name: drawerLabel.productName,
                    sku: drawerLabel.productSku,
                    brand: drawerLabel.productBrand,
                    mrp: drawerLabel.mrp,
                    sellingPrice: drawerLabel.sellingPrice,
                    unit: drawerLabel.unit,
                  }}
                  customer={{
                    id: drawerLabel.customerId,
                    name: drawerLabel.customerName,
                    companyName: drawerLabel.customerCompany,
                    gstin: drawerLabel.customerGstin,
                    deliveryAddress: drawerLabel.customerDeliveryAddress,
                  }}
                  batchNo={drawerLabel.batchNumber}
                  mfgDate={drawerLabel.manufacturingDate}
                  expiryDate={drawerLabel.expiryDate}
                  quantity={drawerLabel.quantity}
                  labelSize={drawerLabel.labelSize || '4x6'}
                  labelTemplate={drawerLabel.labelTemplate}
                  qrPosition={drawerLabel.qrPosition || 'bottom-right'}
                  qrSize={drawerLabel.qrSize || 'medium'}
                  profile={profile}
                  labelId={drawerLabel.id}
                />
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 10. Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deleteDialogItem)}
        onClose={() => setDeleteDialogItem(null)}
        onConfirm={handleConfirmDelete}
        title={deleteDialogItem === 'bulk' ? 'Delete Selected Labels?' : 'Delete Label Record?'}
        message={
          deleteDialogItem === 'bulk'
            ? `Are you sure you want to delete ${selectedLabelIds.length} selected label records? This action cannot be undone.`
            : `Are you sure you want to permanently delete label record ${deleteDialogItem?.id}? This action cannot be undone.`
        }
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
