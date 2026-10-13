import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  HardHat,
  Send,
  Building,
  ShoppingCart,
  ArrowRight,
  Clock,
  XCircle,
} from 'lucide-react';
import { useQuotation, useQuotations } from '../../hooks/useQuotations';
import { useOrders } from '../../hooks/useOrders';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { triggerPrint } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { quotation, isLoading } = useQuotation(id);
  const { updateQuotationStatus } = useQuotations();
  const { createOrder } = useOrders();
  const { profile } = useSellerProfile();
  const [isConverting, setIsConverting] = useState(false);

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/seller/quotations');
    }
  };

  if (isLoading || !quotation) {
    return (
      <div className="space-y-6 w-full py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const handleConvertToOrder = async () => {
    setIsConverting(true);
    try {
      // Create purchase order from quotation
      const newOrder = await createOrder({
        buyer: quotation.buyer,
        items: quotation.items || [],
        subtotal: quotation.subtotal,
        discountTotal: quotation.discountTotal || 0,
        taxTotal: quotation.taxTotal || 0,
        freightCharges: quotation.freightCharges || 0,
        totalAmount: quotation.grandTotal,
        deliveryAddress: {
          address: quotation.buyer.address,
          city: quotation.buyer.city || 'Project Site',
        },
        quotationId: quotation.id,
        orderStatus: 'Confirmed',
        paymentStatus: 'Paid',
      });

      // Update quotation status to Accepted/Converted
      await updateQuotationStatus({ id: quotation.id, status: 'Accepted' });

      navigate(`/seller/orders/${newOrder.id || ''}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header (No print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={ArrowLeft} onClick={handleBack}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 font-mono">
                {quotation.quotationNumber}
              </h1>
              <StatusBadge status={quotation.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued {formatDate(quotation.createdAt)} • Valid until {formatDate(quotation.validUntil)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {quotation.status !== 'Accepted' && quotation.status !== 'Converted' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConvertToOrder}
              leftIcon={ShoppingCart}
              isLoading={isConverting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Accept & Convert to Order
            </Button>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Converted to Purchase Order
            </span>
          )}

          {quotation.status === 'Draft' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/seller/quotations/create?editId=${quotation.id}`, {
                  state: { quotation, from: location },
                })
              }
              leftIcon={FileText}
            >
              Edit Draft
            </Button>
          )}

          <Button variant="secondary" size="sm" onClick={triggerPrint} leftIcon={Printer}>
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Corporate Letterhead Formal Quotation (Printable Area) */}
      <div className="printable-area bg-white p-8 sm:p-10 rounded-xl border border-slate-300 shadow-xl space-y-6 text-slate-900">
        {/* Letterhead Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded bg-emerald-600 flex items-center justify-center font-black text-white text-lg">
                <HardHat className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                {profile?.companyName || 'Ultratech Infra & Steel Suppliers'}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-sm leading-tight">
              {profile?.address?.completeAddress || 'Industrial Area Phase 2, Pune, Maharashtra'}
            </p>
            <p className="text-xs text-slate-600">
              Phone: {profile?.businessPhone || '+91 20 6711 9000'} • Email: {profile?.companyEmail || 'sales@ultratechinfra.com'}
            </p>
            <p className="text-xs font-mono font-bold text-slate-900">
              GSTIN: {profile?.legal?.gstin || '27AAACU1234F1Z8'} • PAN: {profile?.legal?.pan || 'AAACU1234F'}
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="text-lg font-black uppercase text-emerald-700 block">
              COMMERCIAL QUOTATION
            </span>
            <p className="text-xs font-mono font-bold text-slate-900">
              {quotation.quotationNumber}
            </p>
            <p className="text-xs text-slate-500">Date: {formatDate(quotation.createdAt)}</p>
            <p className="text-xs font-semibold text-rose-600">
              Valid Until: {formatDate(quotation.validUntil)}
            </p>
          </div>
        </div>

        {/* Client & Project Destination */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              QUOTATION ISSUED TO
            </span>
            <p className="font-bold text-sm text-slate-900">{quotation.buyer?.company}</p>
            <p className="font-medium text-slate-700">Attn: {quotation.buyer?.name}</p>
            <p className="text-slate-600">Phone: {quotation.buyer?.phone}</p>
            <p className="text-slate-600">Email: {quotation.buyer?.email}</p>
            {quotation.buyer?.gstin && (
              <p className="font-mono text-slate-600">GSTIN: {quotation.buyer?.gstin}</p>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              PROJECT SITE DELIVERY DESTINATION
            </span>
            <p className="font-semibold text-slate-900 leading-relaxed">
              {quotation.buyer?.address}
            </p>
            <p className="text-slate-600 pt-2 text-[11px]">
              Transporter: Dedicated Fleet / Trailer Delivery Included
            </p>
          </div>
        </div>

        {/* Itemized Materials Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 font-bold border-b border-slate-300 uppercase text-[11px] text-slate-700">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Material Specification</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Unit Rate</th>
                <th className="p-3">GST %</th>
                <th className="p-3 text-right">Taxable Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {quotation.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 text-slate-400">{idx + 1}</td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">SKU: {item.sku}</span>
                  </td>
                  <td className="p-3 font-bold">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-3 font-bold text-emerald-600">{item.gstRate}%</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.total || item.amount || item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Commercial Total Summary */}
        <div className="flex justify-end pt-2">
          <div className="w-72 space-y-2 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between">
              <span>Material Subtotal:</span>
              <span className="font-semibold">{formatCurrency(quotation.subtotal)}</span>
            </div>
            {quotation.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Allowed:</span>
                <span>-{formatCurrency(quotation.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Total GST Tax:</span>
              <span className="font-bold">{formatCurrency(quotation.taxTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Freight Surcharge:</span>
              <span className="font-semibold">{formatCurrency(quotation.freightCharges || 0)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
              <span>Quotation Total:</span>
              <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Commercial Terms */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs text-slate-700">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Commercial Terms & Conditions
          </h4>
          <p>
            <strong>Payment Terms:</strong> {quotation.paymentTerms}
          </p>
          <p>
            <strong>Delivery Schedule:</strong> {quotation.deliveryTerms}
          </p>
          <p className="text-[11px] text-slate-500 pt-1">
            * Prices are valid until {formatDate(quotation.validUntil)}. Material prices subject to market fluctuation after validity period.
          </p>
        </div>

        {/* Signature Box */}
        <div className="pt-6 flex justify-between items-end text-xs text-slate-700">
          <div>
            <p className="font-bold text-slate-900">{profile?.companyName}</p>
            <p className="text-[11px] text-slate-500">Authorized Commercial Signatory</p>
          </div>
          <div className="text-right">
            <div className="h-10 border-b border-slate-400 w-48 mb-1" />
            <p className="text-[11px] text-slate-500">Buyer Acceptance Stamp & Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
