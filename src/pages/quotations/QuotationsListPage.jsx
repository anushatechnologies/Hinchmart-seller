import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  RotateCcw,
  AlertCircle,
  Clock,
  X,
} from 'lucide-react';
import { useQuotations } from '../../hooks/useQuotations';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import {
  QUOTATION_STATUS_OPTIONS,
  isQuotationExpired,
  normalizeQuotationFilter,
  matchesQuotationStatus,
  calculateQuotationMetrics,
  getQuotationFilterLabel,
} from '../../utils/quotationFilterUtils';

export function QuotationsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Route URL Filter Synchronization
  const currentStatusParam = searchParams.get('status') || 'all';
  const activeStatusFilter = normalizeQuotationFilter(currentStatusParam);

  const {
    quotations = [],
    isLoading,
    isError,
    error,
    refetch,
    deleteQuotation,
  } = useQuotations();

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteQuoteId, setDeleteQuoteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Real-time Summary Metrics from actual backend/db data
  const metrics = useMemo(() => calculateQuotationMetrics(quotations), [quotations]);

  const handleStatusSelect = (statusKey) => {
    const canonical = normalizeQuotationFilter(statusKey);
    const newParams = new URLSearchParams(searchParams);
    if (canonical === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', canonical);
    }
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    handleStatusSelect('all');
  };

  // Filtered dataset based on search and canonical status
  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      // 1. Status Filter
      if (!matchesQuotationStatus(q, activeStatusFilter)) {
        return false;
      }

      // 2. Search Filter
      if (searchTerm.trim()) {
        const s = searchTerm.trim().toLowerCase();
        const quoteNum = (q.quotationNumber || '').toLowerCase();
        const company = (q.buyer?.company || '').toLowerCase();
        const contact = (q.buyer?.name || '').toLowerCase();
        const email = (q.buyer?.email || '').toLowerCase();
        const phone = (q.buyer?.phone || '').toLowerCase();
        const itemsMatch = (q.items || []).some(
          (item) =>
            (item.name || item.productTitle || '').toLowerCase().includes(s) ||
            (item.sku || '').toLowerCase().includes(s)
        );

        return (
          quoteNum.includes(s) ||
          company.includes(s) ||
          contact.includes(s) ||
          email.includes(s) ||
          phone.includes(s) ||
          itemsMatch
        );
      }

      return true;
    });
  }, [quotations, activeStatusFilter, searchTerm]);

  // Paginated dataset
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Export currently active/filtered quotation dataset
  const handleExport = () => {
    const exportDataset = filtered.length > 0 ? filtered : quotations;
    const rows = exportDataset.map((q) => ({
      QuotationNumber: q.quotationNumber,
      BuyerCompany: q.buyer?.company || 'N/A',
      BuyerContact: q.buyer?.name || 'N/A',
      BuyerPhone: q.buyer?.phone || 'N/A',
      BuyerEmail: q.buyer?.email || 'N/A',
      ItemsCount: q.items?.length || 1,
      GrandTotal: q.grandTotal ?? q.total ?? 0,
      Status: q.status,
      ValidUntil: q.validUntil,
      CreatedDate: q.createdAt,
    }));
    exportToCsv('HinchMart_Quotations_Master', rows);
  };

  const columns = [
    {
      header: 'Quotation #',
      accessorKey: 'quotationNumber',
      cell: ({ row }) => (
        <div
          onClick={() =>
            navigate(`/seller/quotations/${row.id}`, { state: { from: location } })
          }
          className="cursor-pointer group"
        >
          <span className="text-xs font-mono font-bold text-slate-900 block group-hover:text-emerald-700 transition-colors">
            {row.quotationNumber}
          </span>
          <span className="text-[10px] text-slate-400">
            Created {formatDate(row.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer / Buyer',
      accessorKey: 'buyer',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            {row.buyer?.company || 'Contractor'}
          </span>
          <span className="text-[11px] text-slate-500">
            {row.buyer?.name || 'Authorized Buyer'}
          </span>
        </div>
      ),
    },
    {
      header: 'Quote Value',
      accessorKey: 'grandTotal',
      sortable: true,
      cell: ({ row }) => {
        const totalVal = row.grandTotal ?? row.total ?? 0;
        const itemsCount = row.items?.length || 1;
        return (
          <div>
            <span className="text-xs font-black text-slate-900 block">
              {formatCurrency(totalVal)}
            </span>
            <span className="text-[10px] text-slate-500">
              {itemsCount} material {itemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Valid Until',
      accessorKey: 'validUntil',
      cell: ({ row }) => {
        const expired = isQuotationExpired(row);
        return (
          <div className="flex flex-col items-start gap-1">
            <span
              className={cn(
                'text-xs font-medium',
                expired ? 'text-rose-600 font-semibold' : 'text-slate-600'
              )}
            >
              {formatDate(row.validUntil)}
            </span>
            {expired && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                <Clock className="w-2.5 h-2.5" />
                Expired
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      id: 'action',
      cellClassName: 'text-right',
      cell: ({ row }) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(`/seller/quotations/${row.id}`, { state: { from: location } })
            }
            leftIcon={Eye}
          >
            Review
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteQuoteId(row.id)}
            className="text-slate-400 hover:text-rose-600"
            title="Delete quotation"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Dynamic Empty State calculation
  const renderEmptyState = () => {
    if (quotations.length === 0) {
      return (
        <EmptyState
          title="No quotations yet"
          description="Create and manage customer price proposals, commercial estimates, and convert accepted quotes into purchase orders."
          actionLabel="+ Create Quotation"
          onAction={() => navigate('/seller/quotations/create')}
        />
      );
    }

    if (searchTerm.trim()) {
      return (
        <EmptyState
          title="No quotations match your search"
          description={`We couldn't find any quotations matching "${searchTerm}". Try searching by a different quotation number or buyer name.`}
          actionLabel="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      );
    }

    return (
      <EmptyState
        title="No quotations found"
        description={`There are no quotations matching the "${getQuotationFilterLabel(
          activeStatusFilter
        )}" status filter.`}
        actionLabel="Show All Quotations"
        onAction={() => handleStatusSelect('all')}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Quotations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and manage customer price proposals, commercial estimates, and convert accepted quotes into purchase orders
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleExport} leftIcon={Download}>
            Export Quotes
          </Button>

          <Link to="/seller/quotations/create">
            <Button variant="primary" size="sm" leftIcon={Plus}>
              Create Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {isError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between gap-4 text-xs text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              {error?.message || 'Failed to load live quotations from server. Displaying local data cache.'}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} leftIcon={RotateCcw}>
            Retry
          </Button>
        </div>
      )}

      {/* 2. Top Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Drafts */}
        <button
          type="button"
          onClick={() => handleStatusSelect('draft')}
          aria-pressed={activeStatusFilter === 'draft'}
          className={cn(
            'text-left p-3.5 rounded-xl border shadow-2xs transition-all duration-200 cursor-pointer card-lift press-scale flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
            activeStatusFilter === 'draft'
              ? 'bg-slate-50 border-slate-400 ring-2 ring-slate-200 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
          )}
        >
          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
            Drafts
          </span>
          {isLoading ? (
            <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {metrics.draft}
            </span>
          )}
          <span className="text-[10px] text-slate-400">Unsent proposals</span>
        </button>

        {/* Card 2: Sent / Viewed */}
        <button
          type="button"
          onClick={() => handleStatusSelect('sent')}
          aria-pressed={activeStatusFilter === 'sent'}
          className={cn(
            'text-left p-3.5 rounded-xl border shadow-2xs transition-all duration-200 cursor-pointer card-lift press-scale flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
            activeStatusFilter === 'sent'
              ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
          )}
        >
          <span className="text-[10.5px] font-bold text-blue-600 uppercase tracking-wider block">
            Sent / Viewed
          </span>
          {isLoading ? (
            <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-blue-600 mt-1 block">
              {metrics.sent}
            </span>
          )}
          <span className="text-[10px] text-blue-700 font-semibold">Under buyer review</span>
        </button>

        {/* Card 3: Accepted */}
        <button
          type="button"
          onClick={() => handleStatusSelect('accepted')}
          aria-pressed={activeStatusFilter === 'accepted'}
          className={cn(
            'text-left p-3.5 rounded-xl border shadow-2xs transition-all duration-200 cursor-pointer card-lift press-scale flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
            activeStatusFilter === 'accepted'
              ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
          )}
        >
          <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider block">
            Accepted
          </span>
          {isLoading ? (
            <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-emerald-600 mt-1 block">
              {metrics.accepted}
            </span>
          )}
          <span className="text-[10px] text-emerald-700 font-semibold">Ready for order</span>
        </button>

        {/* Card 4: Rejected */}
        <button
          type="button"
          onClick={() => handleStatusSelect('rejected')}
          aria-pressed={activeStatusFilter === 'rejected'}
          className={cn(
            'text-left p-3.5 rounded-xl border shadow-2xs transition-all duration-200 cursor-pointer card-lift press-scale flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400',
            activeStatusFilter === 'rejected'
              ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-sm'
          )}
        >
          <span className="text-[10.5px] font-bold text-rose-600 uppercase tracking-wider block">
            Rejected
          </span>
          {isLoading ? (
            <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-rose-600 mt-1 block">
              {metrics.rejected}
            </span>
          )}
          <span className="text-[10px] text-rose-700 font-semibold">Price re-negotiation</span>
        </button>

        {/* Card 5: Expired */}
        <button
          type="button"
          onClick={() => handleStatusSelect('expired')}
          aria-pressed={activeStatusFilter === 'expired'}
          className={cn(
            'text-left p-3.5 rounded-xl border shadow-2xs transition-all duration-200 cursor-pointer card-lift press-scale flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
            activeStatusFilter === 'expired'
              ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
          )}
        >
          <span className="text-[10.5px] font-bold text-amber-600 uppercase tracking-wider block">
            Expired
          </span>
          {isLoading ? (
            <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-amber-600 mt-1 block">
              {metrics.expired}
            </span>
          )}
          <span className="text-[10px] text-amber-700 font-semibold">Past validity date</span>
        </button>

        {/* Card 6: Total Quotations */}
        <button
          type="button"
          onClick={() => handleStatusSelect('all')}
          aria-pressed={activeStatusFilter === 'all'}
          className={cn(
            'text-left p-3.5 rounded-xl border shadow-2xs transition-all duration-200 cursor-pointer card-lift press-scale flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400',
            activeStatusFilter === 'all'
              ? 'bg-purple-50/50 border-purple-400 ring-2 ring-purple-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'
          )}
        >
          <span className="text-[10.5px] font-bold text-purple-600 uppercase tracking-wider block">
            Total Quotations
          </span>
          {isLoading ? (
            <div className="h-7 w-12 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <span className="text-xl font-black text-purple-600 mt-1 block">
              {metrics.total}
            </span>
          )}
          <span className="text-[10px] text-purple-700 font-semibold">Active catalog quotes</span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md relative">
          <Input
            placeholder="Search by quote number, buyer company, or contact..."
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

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-52">
            <Select
              options={QUOTATION_STATUS_OPTIONS}
              value={activeStatusFilter}
              onChange={(e) => handleStatusSelect(e.target.value)}
            />
          </div>

          {(activeStatusFilter !== 'all' || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              leftIcon={RotateCcw}
              className="text-slate-500 hover:text-slate-800 text-xs flex-shrink-0"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 4. DataTable */}
      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        keyField="id"
        emptyState={renderEmptyState()}
        pagination={{
          currentPage,
          totalItems: filtered.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
        onRowClick={(row) =>
          navigate(`/seller/quotations/${row.id}`, { state: { from: location } })
        }
      />

      {/* Delete Modal */}
      <ConfirmationDialog
        isOpen={Boolean(deleteQuoteId)}
        onClose={() => setDeleteQuoteId(null)}
        onConfirm={async () => {
          if (deleteQuoteId) {
            await deleteQuotation(deleteQuoteId);
            setDeleteQuoteId(null);
          }
        }}
        title="Delete Quotation"
        message="Are you sure you want to permanently delete this quotation proposal? This action cannot be undone."
        confirmText="Delete Quotation"
        variant="danger"
      />
    </div>
  );
}
