import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Building,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  QrCode,
  Edit2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShoppingCart,
  Printer,
  Calendar,
} from 'lucide-react';
import { useCustomer, useCustomers } from '../../hooks/useCustomers';
import { useLabelHistory } from '../../hooks/useLabels';
import { useOrders } from '../../hooks/useOrders';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { CustomerFormModal } from '../../components/customers/CustomerFormModal';
import { formatDate, formatCurrency } from '../../utils/formatters';

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { customer, isLoading } = useCustomer(id);
  const { updateCustomer, updateCustomerStatus } = useCustomers();
  const { history } = useLabelHistory({ customerId: id });
  const { orders } = useOrders();

  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/seller/customers');
    }
  };

  if (isLoading || !customer) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Filter orders matching customer
  const customerOrders = orders.filter(
    (o) =>
      o.buyer?.company?.toLowerCase() === customer.companyName?.toLowerCase() ||
      o.buyer?.name?.toLowerCase() === customer.name?.toLowerCase()
  );

  const isInactive = customer.status !== 'Active';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={ArrowLeft} onClick={handleBack}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900">{customer.companyName}</h1>
              <StatusBadge status={customer.status} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Customer ID: <strong className="text-slate-800">{customer.id}</strong> • Enrolled{' '}
              {formatDate(customer.createdDate)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {!isInactive && (
            <Link to="/seller/products/labels" state={{ preselectedCustomer: customer }}>
              <Button variant="primary" size="sm" leftIcon={QrCode}>
                Generate Product Label
              </Button>
            </Link>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditModalOpen(true)}
            leftIcon={Edit2}
          >
            Edit Profile
          </Button>

          <Button
            variant={customer.status === 'Active' ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() =>
              updateCustomerStatus({
                id: customer.id,
                status: customer.status === 'Active' ? 'Inactive' : 'Active',
              })
            }
            className={customer.status === 'Active' ? 'text-rose-600 hover:bg-rose-50' : ''}
          >
            {customer.status === 'Active' ? 'Deactivate Customer' : 'Activate Customer'}
          </Button>
        </div>
      </div>

      {/* Inactive Restriction Alert Banner */}
      {isInactive && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-3 text-xs text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            <strong>Customer Account Suspended ({customer.status}):</strong> This customer is currently locked. Product label creation and purchase order bookings are restricted until the account is activated.
          </span>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact & GST Tax Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-amber-500" />
            Corporate Credentials & Contacts
          </h3>

          <div className="space-y-3 text-xs text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Enterprise Legal Name
              </span>
              <span className="font-bold text-sm text-slate-900">{customer.companyName}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Authorized Contact
                </span>
                <span className="font-semibold text-slate-900">{customer.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Mobile Number
                </span>
                <span className="font-mono font-bold text-slate-800">{customer.mobile}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Official Email
                </span>
                <span className="font-mono text-slate-800">{customer.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  GSTIN (Tax ID)
                </span>
                <span className="font-mono font-bold text-slate-900">{customer.gstin || 'Not Provided'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Approved Credit Limit
              </span>
              <span className="font-extrabold text-sm text-emerald-600">
                {customer.creditLimit ? formatCurrency(customer.creditLimit) : 'Standard Terms'}
              </span>
            </div>
          </div>
        </div>

        {/* Locations & Site Delivery Coordinates */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-amber-500" />
            Addresses & Dispatch Destinations
          </h3>

          <div className="space-y-3 text-xs text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Primary Project Site Delivery Address (On Labels)
              </span>
              <p className="font-semibold text-slate-900 leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-200 mt-1">
                {customer.deliveryAddress}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Registered Billing Office Address
              </span>
              <p className="text-slate-600 leading-relaxed mt-0.5">
                {customer.billingAddress}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
              <div>
                <span className="text-slate-400 block">City:</span>
                <span className="font-bold text-slate-800">{customer.city}</span>
              </div>
              <div>
                <span className="text-slate-400 block">State:</span>
                <span className="font-bold text-slate-800">{customer.state}</span>
              </div>
              <div>
                <span className="text-slate-400 block">PIN Code:</span>
                <span className="font-bold text-slate-800">{customer.pincode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Labels for this Customer */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-500" />
              Generated Product Labels History ({history.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Labels generated and dispatched specifically for {customer.companyName}
            </p>
          </div>

          {!isInactive && (
            <Link to="/seller/products/labels" state={{ preselectedCustomer: customer }}>
              <Button variant="secondary" size="sm" leftIcon={QrCode}>
                New Label for Client
              </Button>
            </Link>
          )}
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No product labels generated for this client yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Label ID</th>
                  <th className="py-2.5 px-3">Product Name & SKU</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Batch / Heat #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {history.map((lbl) => (
                  <tr key={lbl.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{lbl.id}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{lbl.productName}</span>
                      <span className="text-[10px] font-mono text-slate-500">{lbl.productSku}</span>
                    </td>
                    <td className="py-3 px-3 font-bold">
                      {lbl.quantity} {lbl.unit}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{lbl.batchNumber}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(lbl.createdAt)}</td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to="/seller/products/labels"
                        state={{ reloadedLabel: lbl, preselectedCustomer: customer }}
                      >
                        <Button variant="secondary" size="sm" leftIcon={Printer}>
                          Reprint
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Associated Orders */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-500" />
              Purchase Orders ({customerOrders.length})
            </h3>
          </div>
        </div>

        {customerOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No purchase orders booked by this client yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-3">Order Value</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customerOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {formatCurrency(ord.totalAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ord.paymentStatus} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ord.orderStatus} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link to={`/seller/orders/${ord.id}`}>
                        <Button variant="secondary" size="sm">
                          View PO
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      {editModalOpen && (
        <CustomerFormModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          customer={customer}
          onSave={async (formData) => {
            await updateCustomer({ id: customer.id, updates: formData });
            setEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
