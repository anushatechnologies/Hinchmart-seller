import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Save,
  ArrowLeft,
  Sliders,
  Tag,
  Warehouse,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { useProduct } from '../../hooks/useProducts';
import { useCategories, useSubcategories, useBrands } from '../../hooks/useCategories';
import { useInventory } from '../../hooks/useInventory';
import { UNITS, GST_RATES } from '../../constants/units';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { DynamicSpecRenderer } from '../../components/products/DynamicSpecRenderer';
import { ImageUploader } from '../../components/products/ImageUploader';
import { PricingTierEditor } from '../../components/pricing/PricingTierEditor';
import { Skeleton } from '../../components/common/Skeleton';

export function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { product, isLoading, updateProduct, isUpdating } = useProduct(id);
  const { categories = [] } = useCategories();
  const { warehouses } = useInventory();

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        specifications: product.specifications || {},
        pricingTiers: product.pricingTiers || [],
      });
    }
  }, [product]);

  const categoryId = formData?.categoryId || formData?.category;
  const subcategoryId = formData?.subcategoryId || formData?.subcategory;

  const { subcategories = [] } = useSubcategories(categoryId);
  const { brands = [] } = useBrands(subcategoryId, { categoryId });

  if (isLoading || !formData) {
    return (
      <div className="space-y-4 w-full py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (newCat) => {
    setFormData((prev) => ({
      ...prev,
      category: newCat,
      categoryId: newCat,
      subcategory: '',
      subcategoryId: '',
      brand: '',
      brandId: '',
      brandName: '',
    }));
  };

  const handleSubcategoryChange = (newSub) => {
    setFormData((prev) => ({
      ...prev,
      subcategory: newSub,
      subcategoryId: newSub,
      brand: '',
      brandId: '',
      brandName: '',
    }));
  };

  const handleSpecChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [field]: value,
      },
    }));
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    try {
      await updateProduct(formData);
      navigate(`/seller/products/${id}`);
    } catch (err) {
      console.warn('Product save notice:', err);
      navigate(`/seller/products/${id}`);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to={`/seller/products/${id}`}>
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Edit Product: {formData.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono">SKU: {formData.sku}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={isUpdating}
          leftIcon={Save}
        >
          Save Changes
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Basic Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" /> Basic Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Title"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              required
            />

            <Input
              label="Product ID"
              value={formData.productId || formData.id}
              onChange={(e) => handleFieldChange('productId', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU Code"
              value={formData.sku}
              onChange={(e) => handleFieldChange('sku', e.target.value)}
              required
            />

            <Input
              label="HSN / SAC Code"
              value={formData.hsnCode}
              onChange={(e) => handleFieldChange('hsnCode', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Category"
              options={categories.map((c) => ({ value: c.id || c.categoryId, label: c.name }))}
              value={formData.category || formData.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
            />

            <Select
              label="Subcategory"
              options={subcategories.map((s) => ({
                value: s.name || s.id,
                label: s.name,
              }))}
              value={formData.subcategory || formData.subcategoryId}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              disabled={!categoryId}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Brand <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.brand || formData.brandName || ''}
                onChange={(e) => {
                  const bName = e.target.value;
                  const bObj = brands.find(b => b.name === bName || String(b.id) === bName || String(b.brandId) === bName);
                  setFormData((prev) => ({
                    ...prev,
                    brand: bName,
                    brandName: bName,
                    brandId: bObj?.id || bObj?.brandId || prev.brandId,
                  }));
                }}
                disabled={!subcategoryId || brands.length === 0}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none disabled:opacity-50 transition-all"
              >
                <option value="">
                  {!subcategoryId
                    ? 'Select subcategory first'
                    : brands.length === 0
                    ? 'No eligible brands available'
                    : '-- Select Brand --'}
                </option>
                {formData.brand && !brands.some(b => b.name === formData.brand) && (
                  <option value={formData.brand}>{formData.brand} (Current)</option>
                )}
                {brands.map((b) => (
                  <option key={b.id || b.brandId} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Textarea
            label="Short Description"
            rows={2}
            value={formData.shortDescription}
            onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
            required
          />

          <Textarea
            label="Full Technical Description"
            rows={4}
            value={formData.fullDescription}
            onChange={(e) => handleFieldChange('fullDescription', e.target.value)}
            required
          />
        </div>

        {/* Section 2: Media */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-600" /> Product Media & Brochures
          </h3>
          <ImageUploader
            images={formData.images || []}
            onChange={(imgs) => handleFieldChange('images', imgs)}
          />

          <Input
            label="Video URL (Optional)"
            placeholder="https://youtube.com/watch?v=..."
            value={formData.videoUrl || ''}
            onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
          />

          <Input
            label="Brochure / Technical Datasheet URL (Optional)"
            placeholder="https://..."
            value={formData.brochureUrl || ''}
            onChange={(e) => handleFieldChange('brochureUrl', e.target.value)}
          />
        </div>

        {/* Section 3: Technical Specifications */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" /> Dynamic Technical Specifications
          </h3>
          <DynamicSpecRenderer
            categoryId={formData.category}
            values={formData.specifications}
            onChange={handleSpecChange}
          />
        </div>

        {/* Section 4: Pricing & Tiers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" /> Commercial Pricing & Quantity Tiers
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Maximum Retail Price (MRP)"
              type="number"
              prefix="₹"
              value={formData.mrp}
              onChange={(e) => handleFieldChange('mrp', Number(e.target.value))}
              required
            />

            <Input
              label="Base B2B Selling Price"
              type="number"
              prefix="₹"
              value={formData.sellingPrice}
              onChange={(e) => handleFieldChange('sellingPrice', Number(e.target.value))}
              required
            />

            <Select
              label="Unit of Measure"
              options={UNITS}
              value={formData.unit}
              onChange={(e) => handleFieldChange('unit', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input
              label="Wholesale Rate"
              type="number"
              prefix="₹"
              value={formData.wholesalePrice}
              onChange={(e) => handleFieldChange('wholesalePrice', Number(e.target.value))}
            />

            <Input
              label="Dealer Rate"
              type="number"
              prefix="₹"
              value={formData.dealerPrice}
              onChange={(e) => handleFieldChange('dealerPrice', Number(e.target.value))}
            />

            <Input
              label="Minimum Order Qty (MOQ)"
              type="number"
              value={formData.moq}
              onChange={(e) => handleFieldChange('moq', Number(e.target.value))}
              required
            />

            <Select
              label="GST Tax Rate"
              options={GST_RATES}
              value={formData.gstRate}
              onChange={(e) => handleFieldChange('gstRate', Number(e.target.value))}
              required
            />
          </div>

          <PricingTierEditor
            tiers={formData.pricingTiers}
            onChange={(tiers) => handleFieldChange('pricingTiers', tiers)}
            unit={formData.unit}
            basePrice={formData.sellingPrice}
          />
        </div>

        {/* Section 5: Inventory */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-emerald-600" /> Warehouse Inventory & Tracking
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={`Current Stock (${formData.unit})`}
              type="number"
              value={formData.stock}
              onChange={(e) => handleFieldChange('stock', Number(e.target.value))}
              required
            />

            <Input
              label="Low Stock Threshold"
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => handleFieldChange('lowStockThreshold', Number(e.target.value))}
              required
            />

            <Select
              label="Warehouse Assignment"
              options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.city})` }))}
              value={formData.warehouseId}
              onChange={(e) => handleFieldChange('warehouseId', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Input
              label="Batch Number (Optional)"
              placeholder="e.g. B-2026/LOT-8841"
              value={formData.batchNumber || ''}
              onChange={(e) => handleFieldChange('batchNumber', e.target.value)}
            />

            <Input
              label="Heat / Melt Number (Optional)"
              placeholder="e.g. TATA/HEAT-9042"
              value={formData.heatNumber || ''}
              onChange={(e) => handleFieldChange('heatNumber', e.target.value)}
              helperText="Optional for steel and metals (not required for cement, PVC, etc.)"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => navigate(`/seller/products/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="lg" isLoading={isUpdating} leftIcon={Save}>
            Save All Updates
          </Button>
        </div>
      </form>
    </div>
  );
}
