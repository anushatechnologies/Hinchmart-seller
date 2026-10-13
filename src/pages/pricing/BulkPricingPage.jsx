import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tag, ArrowLeft, CheckCircle2, TrendingUp, Sliders, AlertCircle } from 'lucide-react';
import { usePricing } from '../../hooks/usePricing';
import { useCategories } from '../../hooks/useCategories';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { formatCurrency } from '../../utils/formatters';

export function BulkPricingPage() {
  const navigate = useNavigate();
  const { pricingList, applyBulkAdjustment, isBulkApplying } = usePricing();
  const { categories } = useCategories();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [adjustmentType, setAdjustmentType] = useState('percentage_increase'); // percentage_increase | percentage_decrease | fixed_increase | fixed_decrease
  const [adjustmentValue, setAdjustmentValue] = useState(5);
  const [applyTo, setApplyTo] = useState('sellingPrice'); // 'sellingPrice' | 'both'
  const [appliedResults, setAppliedResults] = useState(null);

  // Calculate live preview of affected items
  const affectedProducts = pricingList.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false;
    return true;
  });

  const previewItems = affectedProducts.slice(0, 5).map((p) => {
    let newPrice = p.sellingPrice;
    if (adjustmentType === 'percentage_increase') {
      newPrice = Math.round(p.sellingPrice * (1 + adjustmentValue / 100));
    } else if (adjustmentType === 'percentage_decrease') {
      newPrice = Math.round(p.sellingPrice * (1 - adjustmentValue / 100));
    } else if (adjustmentType === 'fixed_increase') {
      newPrice = p.sellingPrice + Number(adjustmentValue);
    } else if (adjustmentType === 'fixed_decrease') {
      newPrice = Math.max(1, p.sellingPrice - Number(adjustmentValue));
    }

    return {
      ...p,
      newPrice,
      diff: newPrice - p.sellingPrice,
    };
  });

  const handleApply = async (e) => {
    e.preventDefault();
    const res = await applyBulkAdjustment({
      categoryId: selectedCategory,
      brand: selectedBrand,
      adjustmentType,
      value: Number(adjustmentValue),
      applyTo,
    });
    setAppliedResults(res);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/seller/pricing">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Price Master
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Bulk Price Adjustment Engine
            </h1>
            <p className="text-xs text-slate-500">
              Apply market rate changes, steel index corrections, or cement freight surcharges in bulk across your catalog
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Rule Configuration */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Price Adjustment Rule
            </h3>

            <Select
              label="Target Material Category"
              options={[
                { value: 'All', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />

            <Select
              label="Adjustment Formula"
              options={[
                { value: 'percentage_increase', label: 'Percentage Increase (+%)' },
                { value: 'percentage_decrease', label: 'Percentage Decrease (-%)' },
                { value: 'fixed_increase', label: 'Fixed Amount Increase (+₹ / Unit)' },
                { value: 'fixed_decrease', label: 'Fixed Amount Decrease (-₹ / Unit)' },
              ]}
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
            />

            <Input
              label={`Adjustment Value (${
                adjustmentType.startsWith('percentage') ? '%' : '₹'
              })`}
              type="number"
              min={0.1}
              step={0.1}
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(Number(e.target.value))}
              required
            />

            <Select
              label="Apply Rate Adjustment To"
              options={[
                { value: 'sellingPrice', label: 'Selling Price Only' },
                { value: 'both', label: 'Both Selling Price & MRP' },
              ]}
              value={applyTo}
              onChange={(e) => setApplyTo(e.target.value)}
            />

            <div className="pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleApply}
                isLoading={isBulkApplying}
                rightIcon={CheckCircle2}
              >
                Apply to {affectedProducts.length} Materials
              </Button>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Live Impact Preview Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Rate Impact Preview
                </h3>
                <p className="text-[11px] text-slate-500">
                  {affectedProducts.length} materials will be updated with this formula
                </p>
              </div>

              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                {affectedProducts.length} Matches
              </span>
            </div>

            {previewItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No materials matched the chosen filters.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Current Rate</th>
                      <th className="py-2.5 px-3">New Rate</th>
                      <th className="py-2.5 px-3 text-right">Net Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {previewItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.name}
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.sku}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {formatCurrency(item.sellingPrice)} / {item.unit}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {formatCurrency(item.newPrice)} / {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {item.diff >= 0 ? (
                            <span className="text-emerald-600">+{formatCurrency(item.diff)}</span>
                          ) : (
                            <span className="text-rose-600">{formatCurrency(item.diff)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {appliedResults && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Successfully updated {appliedResults.modifiedCount} product rates in your master catalog.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
