import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Tag, Truck, Percent } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';

export function PriceSettingsPage() {
  const addToast = useUIStore((state) => state.addToast);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    defaultTaxDisplay: 'exclusive', // 'exclusive' | 'inclusive'
    defaultMoqValue: 10,
    minOrderValue: 25000,
    freightCalculation: 'location_based', // 'free_above_limit' | 'location_based' | 'flat_rate'
    freeFreightThreshold: 150000,
    flatFreightRate: 3500,
    cashDiscountPercent: 2.0,
    creditDaysAllowed: 30,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast({
        title: 'Pricing Settings Saved',
        message: 'Default taxation, minimum order, and freight rules updated',
        type: 'success',
      });
    }, 400);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Commercial Pricing & Taxation Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure global marketplace pricing formulas, GST presentation, freight surcharges, and payment terms
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={Save}
        >
          Save Settings
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Taxation Presentation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Percent className="w-4 h-4 text-emerald-600" />
            Taxation & GST Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Marketplace Base Price Display"
              options={[
                { value: 'exclusive', label: 'GST Exclusive (Prices shown without tax)' },
                { value: 'inclusive', label: 'GST Inclusive (Tax included in displayed rate)' },
              ]}
              value={settings.defaultTaxDisplay}
              onChange={(e) => setSettings({ ...settings, defaultTaxDisplay: e.target.value })}
            />

            <Input
              label="Standard Cash Advance Discount (%)"
              type="number"
              min={0}
              step={0.5}
              value={settings.cashDiscountPercent}
              onChange={(e) =>
                setSettings({ ...settings, cashDiscountPercent: Number(e.target.value) })
              }
              helperText="Discount applied when buyer pays 100% advance against PO"
            />
          </div>
        </div>

        {/* Minimum Order Values */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Tag className="w-4 h-4 text-emerald-600" />
            Order Thresholds & Credit Terms
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Order Value (MOV in ₹)"
              type="number"
              prefix="₹"
              value={settings.minOrderValue}
              onChange={(e) =>
                setSettings({ ...settings, minOrderValue: Number(e.target.value) })
              }
              helperText="Buyers cannot place checkout orders below this threshold"
            />

            <Input
              label="Maximum Credit Period Allowed (Days)"
              type="number"
              value={settings.creditDaysAllowed}
              onChange={(e) =>
                setSettings({ ...settings, creditDaysAllowed: Number(e.target.value) })
              }
              helperText="For verified enterprise construction accounts"
            />
          </div>
        </div>

        {/* Freight & Logistics Rules */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Truck className="w-4 h-4 text-emerald-600" />
            Freight & Logistics Surcharges
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Freight Calculation Method"
              options={[
                { value: 'location_based', label: 'Distance & State Matrix Calculation' },
                { value: 'free_above_limit', label: 'Free Delivery on Orders Above Threshold' },
                { value: 'flat_rate', label: 'Flat Dedicated Truck Surcharge' },
              ]}
              value={settings.freightCalculation}
              onChange={(e) =>
                setSettings({ ...settings, freightCalculation: e.target.value })
              }
            />

            <Input
              label="Free Delivery Threshold (₹)"
              type="number"
              prefix="₹"
              value={settings.freeFreightThreshold}
              onChange={(e) =>
                setSettings({ ...settings, freeFreightThreshold: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving} leftIcon={Save}>
            Save All Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
