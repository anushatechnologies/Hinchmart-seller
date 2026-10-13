import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  QrCode,
  UserCheck,
  UserPlus,
  Clock,
  RotateCcw,
  AlertCircle,
  X,
} from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { Tabs } from '../../components/common/Tabs';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { CustomerFormModal } from '../../components/customers/CustomerFormModal';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const STATUS_TABS = [
  { id: 'All', label: 'All Customers' },
  { id: 'Active', label: 'Active' },
  { id: 'Inactive', label: 'Inactive' },
  { id: 'Blocked', label: 'Blocked' },
];

// Helper: A customer is "New" if registered/created within the current calendar year ("Added this year")
export function isCustomerAddedThisYear(customer) {
  if (!customer) return false;
  const dateStr = customer.createdDate || customer.createdAt;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getFullYear() === new Date().getFullYear();
}

export function CustomersListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync tab and filters with URL query parameters (?status=Active or ?filter=new)
  const filterParam = searchParams.get('filter');
  const statusParam = searchParams.get('status');
  const isNewFilter = filterParam?.toLowerCase() === 'new' || statusParam?.toLowerCase() === 'new';

  const initialTab = isNewFilter
    ? ''
    : STATUS_TABS.some((t) => t.id.toLowerCase() === (statusParam || 'All').toLowerCase())
    ? STATUS_TABS.find((t) => t.id.toLowerCase() === (statusParam || 'All').toLowerCase()).id
    : 'All';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sync state with URL search parameters (e.g. browser back/forward or direct navigation)
  useEffect(() => {
    if (isNewFilter) {
      setActiveTab('');
    } else {
      const match = STATUS_TABS.find((t) => t.id.toLowerCase() === (statusParam || 'All').toLowerCase());
      setActiveTab(match ? match.id : 'All');
    }
  }, [isNewFilter, statusParam]);

  // Fetch full customer dataset for the authenticated seller
  const {
    customers: allCustomers = [],
    isLoading,
    isError,
    error,
    refetch,
    createCustomer,
    isCreating,
    updateCustomer,
    isUpdating,
  } = useCustomers();

  // Handle Tab Switch & URL sync (clears New Customers filter)
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('filter');
    if (tabId === 'All') {
      newParams.delete('status');
    } else {
      newParams.set('status', tabId);
    }
    setSearchParams(newParams);
  };

  // Handle New Customers Card Click & URL sync (clears status tabs)
  const handleNewCustomersClick = () => {
    setActiveTab('');
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('status');
    newParams.set('filter', 'new');
    setSearchParams(newParams);
  };

  // Real KPI Metrics derived strictly from real customer records (NO hardcoded numbers or fake fallbacks)
  const metrics = useMemo(() => {
    const total = allCustomers.length;
    const active = allCustomers.filter(
      (c) => (c.status || '').toLowerCase() === 'active'
    ).length;

    // Real New Customers: customers added in the current calendar year
    const newCust = allCustomers.filter(isCustomerAddedThisYear).length;
    const pendingInactive = allCustomers.filter((c) =>
      ['inactive', 'pending'].includes((c.status || '').toLowerCase())
    ).length;

    return {
      total,
      active,
      newCust,
      pendingInactive,
    };
  }, [allCustomers]);

  // Dynamic Filtering: Tab / New Filter + Search across Name, Company, Mobile, Email, ID, GSTIN, City
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter((c) => {
      // 1. Status / New Customers Filter
      if (isNewFilter) {
        if (!isCustomerAddedThisYear(c)) {
          return false;
        }
      } else if (activeTab !== 'All' && (c.status || '').toLowerCase() !== activeTab.toLowerCase()) {
        return false;
      }

      // 2. Search Filter
      if (searchTerm.trim()) {
        const s = searchTerm.trim().toLowerCase();
        const company = (c.companyName || '').toLowerCase();
        const contact = (c.name || '').toLowerCase();
        const phone = (c.mobile || c.phone || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const id = (c.id || '').toLowerCase();
        const gstin = (c.gstin || '').toLowerCase();
        const city = (c.city || '').toLowerCase();
        const state = (c.state || '').toLowerCase();

        return (
          company.includes(s) ||
          contact.includes(s) ||
          phone.includes(s) ||
          email.includes(s) ||
          id.includes(s) ||
          gstin.includes(s) ||
          city.includes(s) ||
          state.includes(s)
        );
      }

      return true;
    });
  }, [allCustomers, isNewFilter, activeTab, searchTerm]);

  // Paginated data slice
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Export real customer data to CSV
  const handleExport = () => {
    const exportDataset = filteredCustomers.length > 0 ? filteredCustomers : allCustomers;
    const rows = exportDataset.map((c) => ({
      CustomerID: c.id,
      CompanyName: c.companyName || 'N/A',
      ContactPerson: c.name || 'N/A',
      Mobile: c.mobile || c.phone || 'N/A',
      Email: c.email || 'N/A',
      GSTIN: c.gstin || 'Unregistered',
      City: c.city || '—',
      State: c.state || '—',
      BillingAddress: c.billingAddress || 'N/A',
      DeliveryAddress: c.deliveryAddress || 'N/A',
      Status: c.status || 'Active',
      CreditLimit: c.creditLimit || 0,
      CreatedDate: c.createdDate || c.createdAt || 'N/A',
    }));
    exportToCsv('HinchMart_Customer_Master_Database', rows);
  };

  // Add/Edit Customer Save Handler
  const handleSaveCustomer = async (formData) => {
    try {
      if (editingCustomer) {
        await updateCustomer({ id: editingCustomer.id, updates: formData });
      } else {
        await createCustomer(formData);
      }
      setModalOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error('Failed to save customer:', err);
    }
  };

  const columns = [
    {
      header: 'Customer Name / Company',
      accessorKey: 'companyName',
      cell: ({ row }) => (
        <div
          onClick={() => navigate(`/seller/customers/${row.id}`, { state: { from: location } })}
          className="cursor-pointer group"
        >
          <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-700 transition-colors">
            {row.companyName}
          </span>
          <span className="text-[11px] text-slate-500">
            Attn: <strong className="text-slate-700">{row.name}</strong> • ID: {row.id}
          </span>
        </div>
      ),
    },
    {
      header: 'Phone / Email',
      accessorKey: 'mobile',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-mono font-medium text-slate-900 block">{row.mobile || row.phone}</span>
          <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Location / Tax ID',
      accessorKey: 'city',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800 block">
            {row.city || '—'}, {row.state || '—'}
          </span>
          <span className="text-[10.5px] font-mono text-slate-500">
            GST: {row.gstin || 'Unregistered'}
          </span>
        </div>
      ),
    },
    {
      header: 'Credit / Orders',
      accessorKey: 'creditLimit',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-bold text-emerald-600 block">
            {row.creditLimit ? formatCurrency(row.creditLimit) : 'Standard'}
          </span>
          <span className="text-[10px] text-slate-400">Credit Limit</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.status === 'Active' && (
            <Link
              to="/seller/products/labels"
              state={{ preselectedCustomer: row }}
              title="Generate Product Label for this Client"
            >
              <Button variant="secondary" size="sm" leftIcon={QrCode}>
                Label
              </Button>
            </Link>
          )}

          <Link to={`/seller/customers/${row.id}`} state={{ from: location }}>
            <Button variant="secondary" size="sm" leftIcon={Eye}>
              View
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingCustomer(row);
              setModalOpen(true);
            }}
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4 text-slate-500 hover:text-emerald-700 transition-colors" />
          </Button>
        </div>
      ),
    },
  ];

  // Dynamic Empty State rendering
  const renderEmptyState = () => {
    if (allCustomers.length === 0) {
      return (
        <EmptyState
          title="No customers found"
          description="You haven't enrolled any business client accounts yet."
          actionLabel="+ Add Customer"
          onAction={() => {
            setEditingCustomer(null);
            setModalOpen(true);
          }}
        />
      );
    }

    if (searchTerm.trim()) {
      return (
        <EmptyState
          title="No customers match your search"
          description={`No customer accounts matched "${searchTerm}". Try searching by another company name, phone, or GSTIN.`}
          actionLabel="Clear Search"
          onAction={() => {
            setSearchTerm('');
            setCurrentPage(1);
          }}
        />
      );
    }

    if (isNewFilter) {
      return (
        <EmptyState
          title="No new customers found"
          description="No customer accounts have been registered within the current calendar year."
          actionLabel="Show All Customers"
          onAction={() => handleTabChange('All')}
        />
      );
    }

    return (
      <EmptyState
        title="No customers found"
        description={`No customers found under the "${activeTab}" status filter.`}
        actionLabel="Show All Customers"
        onAction={() => handleTabChange('All')}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your business customers, credit terms, project delivery addresses, and order history
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleExport} leftIcon={Download}>
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCustomer(null);
              setModalOpen(true);
            }}
            leftIcon={Plus}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Error banner with retry */}
      {isError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between gap-4 text-xs text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error?.message || 'Failed to fetch customers. Displaying local data cache.'}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} leftIcon={RotateCcw}>
            Retry
          </Button>
        </div>
      )}

      {/* 2. Four KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Customers */}
        <div
          onClick={() => handleTabChange('All')}
          className={cn(
            'bg-white p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer card-lift press-scale transition-all',
            activeTab === 'All' && !isNewFilter ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Customers
            </span>
            {isLoading ? (
              <div className="h-8 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
                {metrics.total}
              </span>
            )}
            <span className="text-[10px] text-slate-400">Enrolled accounts</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Active Customers */}
        <div
          onClick={() => handleTabChange('Active')}
          className={cn(
            'bg-white p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer card-lift press-scale transition-all',
            activeTab === 'Active' && !isNewFilter ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-emerald-200'
          )}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Customers
            </span>
            {isLoading ? (
              <div className="h-8 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block">
                {metrics.active}
              </span>
            )}
            <span className="text-[10px] text-emerald-600 font-semibold">Authorized buyers</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: New Customers */}
        <div
          onClick={handleNewCustomersClick}
          className={cn(
            'bg-white p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer card-lift press-scale transition-all',
            isNewFilter ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200 hover:border-amber-300'
          )}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              New Customers
            </span>
            {isLoading ? (
              <div className="h-8 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <span className="text-2xl font-extrabold text-amber-600 mt-0.5 block">
                {metrics.newCust}
              </span>
            )}
            <span className="text-[10px] text-slate-400">Added this year</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Pending / Inactive */}
        <div
          onClick={() => handleTabChange('Inactive')}
          className={cn(
            'bg-white p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer card-lift press-scale transition-all',
            activeTab === 'Inactive' && !isNewFilter ? 'border-slate-400 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pending / Inactive
            </span>
            {isLoading ? (
              <div className="h-8 w-12 bg-slate-100 animate-pulse rounded my-0.5" />
            ) : (
              <span className="text-2xl font-extrabold text-slate-700 mt-0.5 block">
                {metrics.pendingInactive}
              </span>
            )}
            <span className="text-[10px] text-slate-400">Requires verification</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs tabs={STATUS_TABS} activeTab={activeTab} onChange={(id) => handleTabChange(id)} />

        {/* Expanded width so full placeholder is cleanly visible on normal desktop displays */}
        <div className="w-full sm:w-80 md:w-96 relative">
          <Input
            placeholder="Search customers by company, name, mobile, GSTIN..."
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
      </div>

      {/* 4. DataTable */}
      <DataTable
        columns={columns}
        data={paginatedCustomers}
        isLoading={isLoading}
        keyField="id"
        emptyState={renderEmptyState()}
        pagination={{
          currentPage,
          totalItems: filteredCustomers.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
        onRowClick={(row) => navigate(`/seller/customers/${row.id}`, { state: { from: location } })}
      />

      {/* Add / Edit Customer Modal */}
      {modalOpen && (
        <CustomerFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingCustomer(null);
          }}
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          isLoading={isCreating || isUpdating}
        />
      )}
    </div>
  );
}
