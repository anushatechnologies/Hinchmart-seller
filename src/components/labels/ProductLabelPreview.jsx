import React from 'react';
import { QRCodeBox } from './QRCodeBox';
import { BarcodeBox } from './BarcodeBox';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { db } from '../../mock/db';

export function ProductLabelPreview({
  product,
  customer,
  batchNo,
  mfgDate,
  expiryDate,
  quantity = 1,
  labelSize = '4x6', // '4x6' | '3x2' | '2x1'
  labelTemplate = 'Standard Industrial Pallet Tag',
  qrPosition = 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  qrSize = 'medium', // 'small' | 'medium' | 'large'
  profile,
  labelId = 'LBL-PREVIEW',
  className = '',
}) {
  if (!product) return null;

  const currentSeller = profile || db.getSeller();
  const sellerDisplayName = currentSeller?.companyName || currentSeller?.storeName || currentSeller?.businessName || currentSeller?.name || 'HinchMart Authorized Seller';

  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const productIdValue = product.id || product.productId || product.sku;
  const activeBatchNo = batchNo || `BATCH-${new Date().getFullYear()}-${String(productIdValue || '001')}`;
  const activeMfgDate = mfgDate || todayStr;
  const activeExpiryDate = expiryDate || nextYearStr;

  // Authoritative QR Payload
  const qrDataUrl = `https://verify.hinchmart.com/label/${labelId}?productId=${productIdValue}&batch=${encodeURIComponent(activeBatchNo)}${customer ? `&cust=${customer.id}` : ''}`;

  return (
    <div
      className={`label-container physical-label-box bg-white text-slate-900 border-2 border-slate-900 rounded-lg p-3.5 sm:p-4.5 shadow-md flex flex-col justify-between relative overflow-hidden transition-all ${
        labelSize === '4x6'
          ? 'min-h-[480px] w-full'
          : labelSize === '3x2'
          ? 'min-h-[300px] w-full'
          : 'min-h-[190px] w-full'
      } ${className}`}
      data-label-size={labelSize}
    >
      {/* 1. Header: HINCHMART Brand + Seller Company */}
      <div className="border-b-2 border-slate-900 pb-2.5 flex items-start justify-between gap-2 relative">
        {/* Top-Left QR position */}
        {qrPosition === 'top-left' && labelSize !== '2x1' && (
          <QRCodeBox
            value={qrDataUrl}
            size={qrSize}
            position={qrPosition}
            labelSize={labelSize}
            className="mr-2 mb-1"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] uppercase rounded leading-none">
              HINCHMART
            </span>
            <span className="text-[10.5px] font-black tracking-wider text-slate-800 uppercase truncate block">
              {sellerDisplayName}
            </span>
          </div>

          {/* Product Name (Bold, Clear, Prominent) */}
          <h3 className="text-sm sm:text-base font-black leading-tight text-slate-900 tracking-tight mt-1">
            {product.name}
          </h3>

          {/* Product ID & Brand Line */}
          <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-600 font-mono mt-1">
            <span>
              Product ID: <strong className="text-slate-900">{productIdValue}</strong>
            </span>
            {product.brand && (
              <>
                <span>•</span>
                <span>Brand: {product.brand}</span>
              </>
            )}
            {product.hsnCode && (
              <>
                <span>•</span>
                <span>HSN: {product.hsnCode}</span>
              </>
            )}
          </div>
        </div>

        {/* Top-Right QR position */}
        {qrPosition === 'top-right' && labelSize !== '2x1' && (
          <QRCodeBox
            value={qrDataUrl}
            size={qrSize}
            position={qrPosition}
            labelSize={labelSize}
            className="ml-2 mb-1"
          />
        )}
      </div>

      {/* 2. Commercial Pricing & Batch Matrix (Utilizing full width cleanly without image) */}
      <div className="py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] font-mono border-b border-slate-200">
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">MRP Rate:</span>
          <span className="font-bold text-xs text-slate-900">₹{product.mrp}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Selling Rate:</span>
          <span className="font-extrabold text-xs text-slate-900">₹{product.sellingPrice}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Tax (GST):</span>
          <span className="font-bold text-xs text-emerald-700">+{product.gstRate}%</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Billing Unit:</span>
          <span className="font-bold text-xs text-slate-900">{product.unit}</span>
        </div>
      </div>

      {/* 3. Batch & Lot Information */}
      <div className="py-2 grid grid-cols-3 gap-2 text-[10.5px] font-mono border-b border-slate-200">
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Batch / Heat #:</span>
          <span className="font-bold text-xs text-slate-900">{activeBatchNo}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Lot Quantity:</span>
          <span className="font-bold text-xs text-slate-900">
            {quantity} {product.unit}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Mfg / Exp Date:</span>
          <span className="font-semibold text-slate-800">
            {formatDate(activeMfgDate)} / {formatDate(activeExpiryDate)}
          </span>
        </div>
      </div>

      {/* 4. Center QR Position option */}
      {qrPosition === 'center' && labelSize !== '2x1' && (
        <div className="py-1.5 flex justify-center border-b border-slate-200">
          <QRCodeBox
            value={qrDataUrl}
            size={qrSize}
            position={qrPosition}
            labelSize={labelSize}
          />
        </div>
      )}

      {/* 5. Customer / Consignee Block (Admin-Controlled Data) */}
      <div className="my-2 bg-slate-50 p-2.5 rounded border border-slate-300 space-y-0.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 mb-1">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
            CUSTOMER / CONSIGNEE
          </span>
          {customer && (
            <span className="text-[9.5px] font-mono font-bold text-amber-800">
              Customer ID: {customer.id}
            </span>
          )}
        </div>

        {customer ? (
          <div className="text-[10.5px] space-y-0.5">
            <p className="font-black text-xs text-slate-900 leading-tight">
              {customer.companyName}
            </p>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-700">
              <span>Attn: {customer.name}</span>
              <span>Mobile: {customer.mobile}</span>
            </div>
            <p className="text-slate-700 font-mono text-[10px]">
              GSTIN: <strong className="text-slate-900">{customer.gstin || '—'}</strong>
            </p>
            <p className="text-slate-600 leading-tight line-clamp-2 text-[9.5px] pt-0.5">
              Delivery: {customer.deliveryAddress}
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-rose-600 font-bold italic py-1">
            [ NO CUSTOMER SELECTED — PLEASE SELECT FROM DATABASE ]
          </p>
        )}
      </div>

      {/* 6. Barcode & QR Code Section (Strictly Inside Label Boundary) */}
      <div className="pt-2 border-t-2 border-slate-900 flex items-center justify-between gap-3">
        {/* If QR position is bottom-left */}
        {qrPosition === 'bottom-left' && (
          <QRCodeBox
            value={qrDataUrl}
            size={qrSize}
            position={qrPosition}
            labelSize={labelSize}
          />
        )}

        {/* Code128 Linear Barcode */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          <BarcodeBox value={productIdValue} labelSize={labelSize} />
        </div>

        {/* If QR position is bottom-right (Default) */}
        {(qrPosition === 'bottom-right' ||
          (qrPosition !== 'bottom-left' &&
            qrPosition !== 'top-right' &&
            qrPosition !== 'top-left' &&
            qrPosition !== 'center')) && (
          <QRCodeBox
            value={qrDataUrl}
            size={qrSize}
            position="bottom-right"
            labelSize={labelSize}
          />
        )}
      </div>

      {/* 7. Footer Certification Stamp */}
      <div className="text-[8px] font-mono text-center text-slate-400 pt-1 border-t border-slate-200 mt-1">
        HinchMart B2B Enterprise Certified • Origin: India
      </div>
    </div>
  );
}
