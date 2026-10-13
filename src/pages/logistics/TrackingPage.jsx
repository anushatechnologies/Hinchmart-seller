import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Building,
  ArrowRight,
  PackageCheck,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function TrackingPage() {
  const navigate = useNavigate();
  const { orders = [], isLoading } = useOrders();

  const [searchDocket, setSearchDocket] = useState('');

  // Find all active in-transit and dispatched orders
  const trackingOrders = orders.filter((o) =>
    ['Dispatched', 'In Transit', 'Delivered', 'Completed'].includes(o.orderStatus)
  );

  const selectedOrder =
    (searchDocket.trim()
      ? trackingOrders.find(
          (o) =>
            o.orderNumber.toLowerCase().includes(searchDocket.trim().toLowerCase()) ||
            (o.dispatchDetails?.trackingNumber &&
              o.dispatchDetails.trackingNumber.toLowerCase().includes(searchDocket.trim().toLowerCase()))
        )
      : trackingOrders[0]) || trackingOrders[0];

  const steps = [
    { label: 'Order Packed & Weighed', key: 'packed', completed: true, desc: 'Central Warehouse Loading Bay' },
    { label: 'Dispatched with Invoice', key: 'dispatched', completed: true, desc: 'Handed over to carrier fleet' },
    {
      label: 'In Transit En Route',
      key: 'in_transit',
      completed: ['In Transit', 'Delivered', 'Completed'].includes(selectedOrder?.orderStatus),
      desc: 'Express arterial freight corridor',
    },
    {
      label: 'Delivered at Site',
      key: 'delivered',
      completed: ['Delivered', 'Completed'].includes(selectedOrder?.orderStatus),
      desc: selectedOrder?.deliveryAddress?.siteName || 'Destination Site',
    },
    {
      label: 'POD Signed & Completed',
      key: 'pod',
      completed: selectedOrder?.orderStatus === 'Completed',
      desc: 'GRN inspection verified',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Shipment Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time docket status, carrier details, transit corridors, and destination site ETAs
          </p>
        </div>
      </div>

      {/* 2. Docket Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Enter Docket # (e.g. TRK2026908190) or Order # (ORD-2026-09081)..."
            value={searchDocket}
            onChange={(e) => setSearchDocket(e.target.value)}
            LeftIcon={Search}
          />
        </div>
        <Button variant="primary" size="md" leftIcon={Navigation} className="w-full sm:w-auto">
          Track Consignment
        </Button>
      </div>

      {selectedOrder ? (
        <div className="space-y-6">
          {/* 3. Live Active Consignment Status Hero */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    Docket: {selectedOrder.dispatchDetails?.trackingNumber || 'TRK2026881290'}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Order Ref: <strong className="font-mono">{selectedOrder.orderNumber}</strong>
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Destination: {selectedOrder.deliveryAddress.siteName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedOrder.buyer.company} • {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/seller/orders/${selectedOrder.id}`)}
                  leftIcon={Eye}
                >
                  View Full Order
                </Button>
              </div>
            </div>

            {/* Step Progression Timeline */}
            <div className="py-2">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs transition-all ${
                      step.completed
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold">{step.label}</span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 leading-tight">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrier & Fleet Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[11px]">Carrier Logistics Provider:</span>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedOrder.dispatchDetails?.transporter || 'VRL Heavy Logistics Fleet'}
                </p>
                <p className="text-[11.5px] font-mono text-slate-600">
                  Vehicle No: <strong>{selectedOrder.dispatchDetails?.vehicleNo || 'MH-04-GP-8812'}</strong>
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[11px]">Driver & Bay Assignment:</span>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedOrder.dispatchDetails?.driverContact || '+91 94221 00987'}
                </p>
                <p className="text-[11.5px] text-slate-600">
                  {selectedOrder.dispatchDetails?.notes || 'Loaded at Central Warehouse Bay 3'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[11px]">Invoice & Compliance:</span>
                <p className="font-bold text-emerald-700 text-sm font-mono">
                  {selectedOrder.invoice?.invoiceNumber || 'INV-ATTACHED'}
                </p>
                <p className="text-[11.5px] text-slate-600">
                  Commercial Tax Invoice attached to consignment
                </p>
              </div>
            </div>
          </div>

          {/* 4. Active Shipments Queue Table */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              All Active Consignments ({trackingOrders.length})
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-bold text-slate-600 uppercase border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Docket ID</th>
                    <th className="py-2.5 px-3">Order Ref</th>
                    <th className="py-2.5 px-3">Customer Site</th>
                    <th className="py-2.5 px-3">Transporter</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {trackingOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setSearchDocket(o.orderNumber)}
                      className={`hover:bg-slate-50 cursor-pointer ${
                        selectedOrder.id === o.id ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {o.dispatchDetails?.trackingNumber || 'TRK2026881290'}
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-700 font-bold">{o.orderNumber}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{o.deliveryAddress.siteName}</td>
                      <td className="py-3 px-3">{o.dispatchDetails?.transporter || 'VRL Fleet'}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{o.dispatchDetails?.vehicleNo || 'MH-04'}</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">{o.orderStatus}</td>
                      <td className="py-3 px-3 text-right">
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/seller/orders/${o.id}`)}>
                          Track
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          No active consignments found in transit.
        </div>
      )}
    </div>
  );
}
