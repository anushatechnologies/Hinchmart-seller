import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  Download,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Building,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  CheckCheck,
} from 'lucide-react';
import { useEnquiries } from '../../hooks/useEnquiries';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Drawer } from '../../components/common/Drawer';
import { exportToCsv } from '../../utils/exportUtils';
import { formatDate } from '../../utils/formatters';

export function BuyerEnquiriesPage() {
  const navigate = useNavigate();
  const { enquiries = [], isLoading, updateEnquiryStatus } = useEnquiries();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Status Metrics
  const totalCount = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === 'New').length;
  const pendingCount = enquiries.filter((e) => e.status === 'Pending' || e.status === 'Under Review').length;
  const respondedCount = enquiries.filter((e) => e.status === 'Quotation Sent' || e.status === 'Responded').length;
  const convertedCount = enquiries.filter((e) => e.status === 'Accepted' || e.status === 'Converted').length;

  const filtered = enquiries.filter((e) => {
    if (statusFilter !== 'All' && e.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        e.buyerName?.toLowerCase().includes(q) ||
        e.company?.toLowerCase().includes(q) ||
        e.productName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const rows = enquiries.map((e) => ({
      BuyerName: e.buyerName,
      Company: e.company,
      Product: e.productName,
      Quantity: e.quantityRequired,
      TargetPrice: e.targetPrice,
      Location: e.deliveryLocation,
      Status: e.status,
      Date: e.createdAt,
    }));
    exportToCsv('HinchMart_Buyer_Enquiries_RFQs', rows);
  };

  const handleConvertToQuote = (enquiry) => {
    navigate('/seller/quotations/create', { state: { enquiry } });
  };

  const columns = [
    {
      header: 'Buyer / Company',
      accessorKey: 'buyerName',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">{row.buyerName}</span>
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <Building className="w-3 h-3 text-slate-400" />
            {row.company}
          </span>
        </div>
      ),
    },
    {
      header: 'Required Material & Volume',
      accessorKey: 'productName',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <span className="text-xs font-bold text-slate-800 line-clamp-1 block">
            {row.productName}
          </span>
          <span className="text-[11px] font-semibold text-amber-700">
            Quantity: {row.quantityRequired}
          </span>
        </div>
      ),
    },
    {
      header: 'Target Rate & Project',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900 block">{row.targetPrice}</span>
          <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
            {row.projectType || row.deliveryLocation}
          </span>
        </div>
      ),
    },
    {
      header: 'Received Date',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>
      ),
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
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedEnquiry(row)}
            leftIcon={Eye}
          >
            Review
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleConvertToQuote(row)}
            leftIcon={FileText}
          >
            Create Quote
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Buyer Enquiries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming contractor quote requests, tender negotiation targets, and convert RFQs into commercial quotations
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={handleExport} leftIcon={Download}>
          Export Enquiries
        </Button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              New RFQs
            </span>
            <span className="text-2xl font-extrabold text-amber-600 mt-0.5 block">
              {newCount}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">Awaiting review</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pending Pricing
            </span>
            <span className="text-2xl font-extrabold text-blue-600 mt-0.5 block">
              {pendingCount}
            </span>
            <span className="text-[10px] text-slate-400">Under review</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quotes Sent
            </span>
            <span className="text-2xl font-extrabold text-purple-600 mt-0.5 block">
              {respondedCount}
            </span>
            <span className="text-[10px] text-slate-400">Proposals active</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Converted Orders
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block">
              {convertedCount}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">Won contracts</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. B2B Commercial Lifecycle Banner */}
      <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-xs hidden md:flex items-center justify-between text-xs">
        <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
          Procurement Pipeline Workflow:
        </span>
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="px-2 py-0.5 bg-slate-800 rounded text-white">1. Buyer Enquiry</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-2 py-0.5 bg-slate-800 rounded text-white">2. Seller Reviews</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold">
            3. Create Quotation
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-2 py-0.5 bg-slate-800 rounded text-white">4. Customer Accepts</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold">
            5. Convert to Order
          </span>
        </div>
      </div>

      {/* 4. Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search enquiries by buyer, company, material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            LeftIcon={Search}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'New', label: 'New / Unquoted' },
              { value: 'Quotation Sent', label: 'Quotation Sent' },
              { value: 'Accepted', label: 'Accepted' },
              { value: 'Responded', label: 'Responded' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* 5. DataTable */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        keyField="id"
      />

      {/* Enquiry Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedEnquiry)}
        onClose={() => setSelectedEnquiry(null)}
        title="Buyer RFQ Details"
        subtitle={selectedEnquiry?.productName}
        footer={
          selectedEnquiry && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await updateEnquiryStatus({ id: selectedEnquiry.id, status: 'Rejected' });
                  setSelectedEnquiry(null);
                }}
                className="text-rose-600 hover:bg-rose-50"
              >
                Reject RFQ
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  handleConvertToQuote(selectedEnquiry);
                  setSelectedEnquiry(null);
                }}
                rightIcon={ArrowRight}
              >
                Generate Quotation Now
              </Button>
            </div>
          )
        }
      >
        {selectedEnquiry && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedEnquiry.buyerName}</span>
                <StatusBadge status={selectedEnquiry.status} />
              </div>
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {selectedEnquiry.company}
              </p>
              <p className="text-slate-500 font-mono">
                Phone: {selectedEnquiry.phone} • Email: {selectedEnquiry.email}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Procurement Requirement
              </h4>
              <div className="space-y-1.5">
                <p>
                  <strong>Material:</strong> {selectedEnquiry.productName}
                </p>
                <p>
                  <strong>Quantity Demanded:</strong> {selectedEnquiry.quantityRequired}
                </p>
                <p>
                  <strong>Target Rate Indicated:</strong> {selectedEnquiry.targetPrice}
                </p>
                <p>
                  <strong>Project Type:</strong> {selectedEnquiry.projectType || 'Commercial Infrastructure'}
                </p>
                <p className="flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>Site Location:</strong> {selectedEnquiry.deliveryLocation}</span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200/60 space-y-1.5">
              <h4 className="font-bold text-amber-950 text-[11px] uppercase tracking-wider">
                Buyer Project Note / Special Clauses
              </h4>
              <p className="text-slate-700 leading-relaxed italic">
                "{selectedEnquiry.message || 'Immediate dispatch required upon technical approval.'}"
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
