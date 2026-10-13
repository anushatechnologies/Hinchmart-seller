import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  AlertCircle,
  Eye,
  IndianRupee,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function PaymentsListPage() {
  const navigate = useNavigate();
  const { orders = [], isLoading } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter payments
  const filteredPayments = orders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.buyer.company.toLowerCase().includes(q) ||
      (o.id && o.id.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'All' || o.paymentStatus.toLowerCase().includes(statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalSettled = orders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalEscrow = orders
    .filter((o) => o.paymentStatus === 'Escrow Secured')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalCredit = orders
    .filter((o) => o.paymentStatus.includes('Credit'))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCount = orders.filter((o) => o.paymentStatus === 'Pending' || o.paymentStatus === 'Unpaid').length;

  const handleExportPayments = () => {
    const rows = filteredPayments.map((o) => ({
      OrderNumber: o.orderNumber,
      BuyerCompany: o.buyer?.company || o.buyer?.name || '',
      Amount: o.totalAmount,
      PaymentStatus: o.paymentStatus,
      PaymentMethod: o.paymentMethod || (o.paymentStatus === 'Escrow Secured' ? 'HinchMart B2B Escrow' : 'Direct RTGS / NEFT'),
      Date: o.createdAt,
      SettlementRef: o.utrNumber || o.paymentDetails?.transactionId || (o.id ? `REF-${o.id.replace('ord_', '')}` : '—'),
    }));
    exportToCsv('HinchMart_Payments_Settlement_Ledger', rows);
  };

  const columns = [
    {
      header: 'Order Reference',
      accessorKey: 'orderNumber',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-mono font-bold text-slate-900 block hover:text-emerald-700">
            {row.orderNumber}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {formatDate(row.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: 'Buyer / Customer',
      accessorKey: 'buyer',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">{row.buyer?.company || row.buyer?.name}</span>
          <span className="text-[11px] text-slate-500">{row.deliveryAddress?.siteName || row.buyer?.name}</span>
        </div>
      ),
    },
    {
      header: 'Payment Amount',
      accessorKey: 'totalAmount',
      cell: ({ row }) => {
        const refStr = row.utrNumber
          ? `UTR: ${row.utrNumber}`
          : row.paymentDetails?.transactionId
          ? `Txn: ${row.paymentDetails.transactionId}`
          : row.id
          ? `Ref: ${row.id}`
          : '';
        return (
          <div>
            <span className="text-xs font-black text-slate-900 block">{formatCurrency(row.totalAmount)}</span>
            {refStr && <span className="text-[10px] text-slate-400 font-mono">{refStr}</span>}
          </div>
        );
      },
    },
    {
      header: 'Payment Terms / Channel',
      cell: ({ row }) => {
        if (row.paymentStatus === 'Escrow Secured') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Escrow Protected
            </span>
          );
        }
        if (row.paymentStatus.includes('Credit')) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Institutional Credit
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Direct Settlement
          </span>
        );
      },
    },
    {
      header: 'Payment Status',
      accessorKey: 'paymentStatus',
      cell: ({ row }) => {
        const isPaid = row.paymentStatus === 'Paid' || row.paymentStatus === 'Escrow Secured';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isPaid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {row.paymentStatus}
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
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/seller/orders/${row.id}`);
          }}
          leftIcon={Eye}
        >
          View Order
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Payments & Settlements</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track escrow releases, direct NEFT/RTGS settlements, credit accounts, and transaction records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleExportPayments} leftIcon={Download}>
            Export Ledger
          </Button>
        </div>
      </div>

      {/* 2. Top Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider block">
            Direct Settled Funds
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{formatCurrency(totalSettled)}</span>
          <span className="text-[10px] text-emerald-700 font-semibold">Transferred to registered bank</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10.5px] font-bold text-indigo-600 uppercase tracking-wider block">
            Held in HinchMart Escrow
          </span>
          <span className="text-xl font-black text-indigo-600 mt-1 block">{formatCurrency(totalEscrow)}</span>
          <span className="text-[10px] text-indigo-700 font-semibold">Releases upon site POD</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10.5px] font-bold text-amber-600 uppercase tracking-wider block">
            Credit Receivables (30D)
          </span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{formatCurrency(totalCredit)}</span>
          <span className="text-[10px] text-amber-700 font-semibold">Institutional buyer credit</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
            Pending / Awaiting Action
          </span>
          <span className="text-xl font-black text-slate-800 mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-slate-400">Awaiting clearance</span>
        </div>
      </div>

      {/* 3. Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by Order #, Company, or UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            LeftIcon={Search}
          />
        </div>

        <div className="w-48 shrink-0">
          <Select
            options={[
              { value: 'All', label: 'All Payment Status' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Escrow Secured', label: 'Escrow Secured' },
              { value: 'Credit', label: 'Credit (30 Days)' },
              { value: 'Pending', label: 'Pending' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Payments Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        keyField="id"
        onRowClick={(row) => navigate(`/seller/orders/${row.id}`)}
      />
    </div>
  );
}
