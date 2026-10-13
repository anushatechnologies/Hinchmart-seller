import React from 'react';
import { Plus, Trash2, Layers, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { formatCurrency } from '../../utils/formatters';

export function PricingTierEditor({
  tiers = [],
  onChange,
  unit = 'Unit',
  basePrice = 0,
}) {
  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? lastTier.maxQty + 1 : 10;
    const newMax = newMin + 100;
    const newPrice = lastTier ? Math.round(lastTier.price * 0.95) : Math.round(basePrice * 0.95);

    onChange([...tiers, { minQty: newMin, maxQty: newMax, price: newPrice }]);
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...tiers];
    updated[index] = {
      ...updated[index],
      [field]: Number(value),
    };
    onChange(updated);
  };

  const handleRemove = (index) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-500" />
            Quantity-Based Tiered B2B Pricing
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Incentivize bulk purchase orders by providing volume discounts based on order quantity.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddTier}
          leftIcon={Plus}
        >
          Add Tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
          No quantity tiers added. Standard selling price ({formatCurrency(basePrice)}/{unit}) will apply to all purchase order sizes.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-2">
            <div className="col-span-3">Min Quantity</div>
            <div className="col-span-3">Max Quantity</div>
            <div className="col-span-3">Tier Price (₹ / {unit})</div>
            <div className="col-span-2 text-right">Discount</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {tiers.map((tier, index) => {
            const discountPct = basePrice > 0 ? Math.round(((basePrice - tier.price) / basePrice) * 100) : 0;

            return (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={1}
                    value={tier.minQty}
                    onChange={(e) => handleUpdate(index, 'minQty', e.target.value)}
                    placeholder="Min"
                  />
                </div>

                <div className="col-span-3">
                  <Input
                    type="number"
                    min={tier.minQty}
                    value={tier.maxQty}
                    onChange={(e) => handleUpdate(index, 'maxQty', e.target.value)}
                    placeholder="Max"
                  />
                </div>

                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0.1}
                    value={tier.price}
                    prefix="₹"
                    onChange={(e) => handleUpdate(index, 'price', e.target.value)}
                    placeholder="Price"
                  />
                </div>

                <div className="col-span-2 text-right font-bold text-emerald-600">
                  {discountPct > 0 ? `${discountPct}% OFF` : '—'}
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
