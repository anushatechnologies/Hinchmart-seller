import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Search,
  Download,
  CheckCircle2,
  Navigation,
  MapPin,
  Phone,
  Eye,
  FileText,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function DispatchesListPage() {
  const navigate = useNavigate();
  const { orders = [], isLoading } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('All');

  // Filter orders that have dispatch details or are in logistics stages
  const dispatchOrders = orders.filter((o) =>
    ['Dispatched', 'In Transit', 'Delivered', 'Completed'].includes(o.orderStatus)
  );

  const filteredDispatches = dispatchOrders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const d = o.dispatchDetails || {};
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.buyer.company.toLowerCase().includes(q) ||
      (d.transporter && d.transporter.toLowerCase().includes(q)) ||
      (d.vehicleNo && d.vehicleNo.toLowerCase().includes(q)) ||
      (d.trackingNumber && d.trackingNumber.toLowerCase().includes(q));

    const matchesCarrier =
      carrierFilter === 'All' || (d.transporter && d.transporter.toLowerCase().includes(carrierFilter.toLowerCase()));

    return matchesSearch && matchesCarrier;
  });

  const handleExport = () => {
    const rows = filteredDispatches.map((o) => ({
      OrderNumber: o.orderNumber,
      BuyerCompany: o.buyer.company,
      DestinationSite: o.deliveryAddress.siteName,
      Transporter: o.dispatchDetails?.transporter || 'N/A',
      VehicleNo: o.dispatchDetails?.vehicleNo || 'N/A',
      DriverContact: o.dispatchDetails?.driverContact || 'N/A',
      TrackingNumber: o.dispatchDetails?.trackingNumber || 'N/A',
      OrderStatus: o.orderStatus,
      DispatchDate: o.updatedAt || o.createdAt,
    }));
    exportToCsv('HinchMart_Dispatches_Manifest', rows);
  };

  const columns = [
    {
      header: 'Order Reference',
      accessorKey: 'orderNumber',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-mono font-bold text-slate-900 block hover:text-amber-600">
            {row.orderNumber}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {row.dispatchDetails?.trackingNumber || 'TRK2026881290'}
          </span>
        </div>
      ),
    },
    {
      header: 'Destination / Project Site',
      accessorKey: 'deliveryAddress',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">{row.deliveryAddress?.siteName}</span>
          <span className="text-[11px] text-slate-500">
            {row.buyer?.company} • {row.deliveryAddress?.city}
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned Carrier & Fleet',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            {row.dispatchDetails?.transporter || 'VRL Heavy Logistics Fleet'}
          </span>
          <span className="text-[10.5px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
            {row.dispatchDetails?.vehicleNo || 'MH-04-GP-8812'}
          </span>
        </div>
      ),
    },
    {
      header: 'Driver Contact',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.dispatchDetails?.driverContact || '+91 94221 00987'}</span>
        </div>
      ),
    },
    {
      header: 'Consignment Status',
      accessorKey: 'orderStatus',
      cell: ({ row }) => {
        const isCompleted = row.orderStatus === 'Completed' || row.orderStatus === 'Delivered';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-cyan-50 text-cyan-800 border-cyan-200'
            }`}
          >
            {isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Truck className="w-3 h-3 text-cyan-600" />}
            {row.orderStatus}
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
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Dispatches</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logistics carrier fleet dispatch manifests, vehicle numbers, and driver assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleExport} leftIcon={Download}>
            Export Dispatches
          </Button>
        </div>
      </div>

      {/* 2. Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by Order #, Vehicle, or Carrier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            LeftIcon={Search}
          />
        </div>

        <div className="w-48 shrink-0">
          <Select
            options={[
              { value: 'All', label: 'All Transporters' },
              { value: 'VRL', label: 'VRL Logistics' },
              { value: 'Om', label: 'Om Logistics' },
              { value: 'GATI', label: 'GATI KWE' },
              { value: 'TCI', label: 'TCI Freight' },
            ]}
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Table */}
      <DataTable
        columns={columns}
        data={filteredDispatches}
        isLoading={isLoading}
        keyField="id"
        onRowClick={(row) => navigate(`/seller/orders/${row.id}`)}
      />
    </div>
  );
}
