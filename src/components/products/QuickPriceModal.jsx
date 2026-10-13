import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

export function QuickPriceModal({ isOpen, onClose, product, onSave }) {
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice || '');
  const [mrp, setMrp] = useState(product?.mrp || '');
  const [wholesalePrice, setWholesalePrice] = useState(product?.wholesalePrice || '');
  const [isLoading, setIsLoading] = useState(false);

  if (!product) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(product.id, {
        sellingPrice: Number(sellingPrice),
        mrp: Number(mrp),
        wholesalePrice: Number(wholesalePrice) || Number(sellingPrice),
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Price Adjustment"
      subtitle={`Update commercial selling rates for ${product.name}`}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
            Save New Rates
          </Button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 py-2">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between">
          <div>
            <span className="text-slate-500 font-medium">SKU:</span>{' '}
            <span className="font-mono font-bold text-slate-800">{product.sku}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Unit:</span>{' '}
            <span className="font-bold text-slate-800">{product.unit}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Maximum Retail Price (MRP)"
            type="number"
            min={1}
            prefix="₹"
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
            required
          />

          <Input
            label="B2B Selling Price"
            type="number"
            min={1}
            prefix="₹"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            required
          />
        </div>

        <Input
          label="Wholesale / Institutional Rate"
          type="number"
          min={1}
          prefix="₹"
          value={wholesalePrice}
          onChange={(e) => setWholesalePrice(e.target.value)}
          helperText="Rate for bulk buyers purchasing above MOQ"
        />
      </form>
    </Modal>
  );
}

export function QuickStockModal({ isOpen, onClose, product, onSave }) {
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' | 'subtract' | 'set'
  const [quantity, setQuantity] = useState(100);
  const [reason, setReason] = useState('New Production Batch Received');
  const [isLoading, setIsLoading] = useState(false);

  if (!product) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(product.id, {
        adjustmentType,
        quantity: Number(quantity),
        reason,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const calculatedNewStock =
    adjustmentType === 'add'
      ? product.stock + Number(quantity)
      : adjustmentType === 'subtract'
      ? Math.max(0, product.stock - Number(quantity))
      : Number(quantity);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Stock & Inventory Update"
      subtitle={`Adjust available warehouse balance for ${product.name}`}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
            Update Stock Balance
          </Button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 py-2">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between">
          <div>
            <span className="text-slate-500 font-medium">Current Stock:</span>{' '}
            <span className="font-bold text-slate-900">{product.stock} {product.unit}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">New Stock:</span>{' '}
            <span className="font-bold text-emerald-600">{calculatedNewStock} {product.unit}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Adjustment Operation
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'add', label: '+ Stock In' },
              { id: 'subtract', label: '- Stock Out' },
              { id: 'set', label: '= Set Exact' },
            ].map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setAdjustmentType(op.id)}
                className={`py-2 text-xs font-bold rounded-md border transition-all ${
                  adjustmentType === op.id
                    ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label={`Quantity (${product.unit})`}
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <Input
          label="Reason for Adjustment / Reference PO #"
          placeholder="e.g. Factory Batch Lot 409 Inbound"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </form>
    </Modal>
  );
}
