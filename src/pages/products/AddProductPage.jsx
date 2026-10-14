import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Package,
  Building2,
  Tag,
  IndianRupee,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  Upload,
  Layers,
  Link2,
  X,
  ShieldCheck,
  Zap,
  Plus,
  Trash2,
  Sparkles,
  Check,
  TrendingDown,
  SlidersHorizontal,
} from 'lucide-react';
import { useCategories, useSubcategories, useBrands } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { UNITS, GST_RATES } from '../../constants/units';
import { useUIStore } from '../../store/uiStore';
import { uploadService } from '../../services/upload.service';

export function AddProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useUIStore((state) => state.addToast);
  const { createProduct, isCreating } = useProducts();

  // Prepopulate from navigation state if available
  const navState = location.state || {};

  // Form State matching Backend Specification
  const [categoryId, setCategoryId] = useState(navState.defaultCategory || '');
  const [subcategoryId, setSubcategoryId] = useState(navState.defaultSubcategory || '');
  const [brandId, setBrandId] = useState(navState.defaultBrandId || '');
  const [brandName, setBrandName] = useState(navState.defaultBrand || '');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [sku, setSku] = useState('');

  // Pricing & Inventory State
  const [price, setPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState('');
  const [moq, setMoq] = useState('1');
  const [stock, setStock] = useState('');
  const [hsn, setHsn] = useState('');
  const [gstRate, setGstRate] = useState('18% GST');
  const [is24HourDelivery, setIs24HourDelivery] = useState(false);

  // Bulk Pricing Tiers State
  const [bulkPricingTiers, setBulkPricingTiers] = useState([]);

  // Specifications State (Key-Value map)
  const [specifications, setSpecifications] = useState([]);

  // Imagery State
  const [activeImageTab, setActiveImageTab] = useState('upload'); // 'upload' | 'url'
  const [images, setImages] = useState([]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Description & Status State
  const [description, setDescription] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('PENDING');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories query
  const { categories = [], isLoading: isLoadingCategories } = useCategories();

  // Cascading Subcategories & Brands
  const { subcategories = [] } = useSubcategories(categoryId);
  const { brands = [] } = useBrands(subcategoryId, { categoryId });

  // Selected Category / Subcategory objects
  const selectedCatObj = useMemo(() => {
    return categories.find((c) => String(c.id) === String(categoryId) || String(c.categoryId) === String(categoryId));
  }, [categories, categoryId]);

  const selectedSubcatObj = useMemo(() => {
    return subcategories.find((s) => String(s.id) === String(subcategoryId) || String(s.subcategoryId) === String(subcategoryId));
  }, [subcategories, subcategoryId]);

  const selectedBrandObj = useMemo(() => {
    return brands.find((b) => String(b.id) === String(brandId) || String(b.brandId) === String(brandId) || b.name === brandName);
  }, [brands, brandId, brandName]);

  // Sync price with sellingPrice if not edited separately
  // Sync price with sellingPrice if not edited separately
  const handlePriceChange = (val) => {
    setPrice(val);
    setSellingPrice(val);
    if (val && !isNaN(parseFloat(val)) && (!mrp || parseFloat(mrp) <= parseFloat(val))) {
      setMrp(String((parseFloat(val) * 1.15).toFixed(2)));
    } else if (!val) {
      setMrp('');
    }
  };

  // Bulk Tier Handlers
  const handleAddTier = () => {
    const lastTier = bulkPricingTiers[bulkPricingTiers.length - 1];
    const nextMin = lastTier?.maxQty ? Number(lastTier.maxQty) + 1 : (Number(moq) || 1) + 50;
    setBulkPricingTiers((prev) => [
      ...prev,
      { minQty: nextMin, maxQty: nextMin + 200, price: price || '', discountPercentage: 5.0 },
    ]);
  };

  const handleRemoveTier = (idxToRemove) => {
    setBulkPricingTiers((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleTierChange = (idx, field, val) => {
    setBulkPricingTiers((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      // Auto calculate discount if tier price changes
      if (field === 'price' && sellingPrice) {
        const base = parseFloat(sellingPrice) || parseFloat(price) || 1;
        const tierP = parseFloat(val) || 0;
        if (tierP > 0 && tierP < base) {
          updated[idx].discountPercentage = Number((((base - tierP) / base) * 100).toFixed(1));
        }
      }
      return updated;
    });
  };

  // Specifications Handlers
  const handleAddSpec = () => {
    setSpecifications((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (idxToRemove) => {
    setSpecifications((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSpecChange = (idx, field, val) => {
    setSpecifications((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  // Auto-generate Slug on Title change
  const handleTitleChange = (val) => {
    setTitle(val);
    if (!slugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  // Handle Image Upload directly to AWS S3
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImage(true);
    setUploadProgress(10);
    try {
      for (const file of files) {
        try {
          const res = await uploadService.uploadFile(
            file,
            (progress) => setUploadProgress(progress),
            'products'
          );
          if (res?.url) {
            setImages((prev) => [...prev, res.url]);
          }
        } catch (err) {
          console.warn('S3 upload notice:', err?.message);
          // Fallback to data URL
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setImages((prev) => [...prev, event.target.result]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleAddCloudUrl = (e) => {
    e?.preventDefault();
    if (customImageUrl.trim()) {
      setImages((prev) => [...prev, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!title.trim()) {
      addToast({
        title: 'Title Required',
        message: 'Product title is required by the backend API.',
        type: 'error',
      });
      return;
    }

    const resolvedBrandId = Number(selectedBrandObj?.brandId || selectedBrandObj?.id || brandId) || null;
    const resolvedBrandName = selectedBrandObj?.name || selectedBrandObj?.brandName || brandName.trim() || '';

    if (!unit.trim()) {
      addToast({
        title: 'Unit Required',
        message: 'Measurement unit is required (@NotBlank) (e.g. Bags, Ton, Pieces).',
        type: 'error',
      });
      return;
    }

    if (!price || isNaN(Number(price))) {
      addToast({
        title: 'Price Required',
        message: 'Please enter a valid Price in INR.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    const parsedGst = parseInt(gstRate, 10) || 18;
    const finalPrice = parseFloat(price) || 0;
    const finalSellingPrice = parseFloat(sellingPrice) || finalPrice;
    const finalMrp = parseFloat(mrp) || Math.round(finalPrice * 1.15);
    const finalMoq = parseInt(moq, 10) || 1;
    const finalStock = parseInt(stock, 10) || 0;

    const resolvedCatId = Number(selectedCatObj?.categoryId || selectedCatObj?.id || categoryId) || null;
    const resolvedCatName = selectedCatObj?.name || selectedCatObj?.title || '';

    const resolvedSubcatId = Number(selectedSubcatObj?.subcategoryId || selectedSubcatObj?.id || subcategoryId) || null;
    const resolvedSubcatName = selectedSubcatObj?.name || selectedSubcatObj?.title || '';

    // Format Bulk Pricing Tiers according to BulkPricingTier.java
    const cleanBulkPricingTiers = bulkPricingTiers
      .filter((t) => t.minQty && t.price)
      .map((t) => ({
        minQty: parseInt(t.minQty, 10),
        maxQty: t.maxQty !== null && t.maxQty !== undefined && t.maxQty !== '' ? parseInt(t.maxQty, 10) : null,
        price: parseFloat(t.price),
        discountPercentage: parseFloat(t.discountPercentage || 0.0),
      }));

    // Format Specifications Key-Value Map
    const cleanSpecifications = specifications.reduce((acc, curr) => {
      if (curr.key && curr.key.trim()) {
        acc[curr.key.trim()] = curr.value ? curr.value.trim() : '';
      }
      return acc;
    }, {});

    const newProductPayload = {
      title: title.trim(),
      name: title.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      description: description.trim(),
      categoryId: resolvedCatId,
      category: resolvedCatName,
      categoryName: resolvedCatName,
      subcategoryId: resolvedSubcatId,
      subcategory: resolvedSubcatName,
      subcategoryName: resolvedSubcatName,
      brandId: resolvedBrandId,
      brand: resolvedBrandName,
      brandName: resolvedBrandName,
      price: finalPrice,
      sellingPrice: finalSellingPrice,
      mrp: finalMrp,
      unit: unit.trim(),
      moq: finalMoq,
      stock: finalStock,
      stockQty: finalStock,
      hsn: hsn.trim(),
      hsnCode: hsn.trim(),
      gstRate: parsedGst,
      gst: parsedGst,
      is24HourDelivery: Boolean(is24HourDelivery),
      images: images,
      imageUrl: images[0] || null,
      bulkPricingTiers: cleanBulkPricingTiers,
      specifications: cleanSpecifications,
      status: 'PENDING',
      approvalStatus: 'PENDING',
      active: false,
    };

    try {
      await createProduct(newProductPayload);
      addToast({
        title: 'Product Submitted',
        message: 'Product listing submitted successfully to the marketplace.',
        type: 'success',
      });
      navigate('/seller/products');
    } catch (err) {
      console.error('Error creating product:', err);
      addToast({
        title: 'Submission Error',
        message: err.message || 'Failed to submit product to marketplace.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pb-16">
      {/* Outer Card with Dark Slate/Navy Header (Exact Match to Screenshot 3, 4, 5) */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* DARK NAVY HEADER BANNER */}
        <div className="bg-[#0f172a] text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Add New Marketplace Product
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit a new B2B product listing to the marketplace catalog
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MAIN FORM */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 bg-slate-50/60">
          {/* ========================================================================= */}
          {/* CARD 1: 4-TIER CATALOG HIERARCHY MAPPING (SCREENSHOT 3)                   */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>4-Tier Catalog Hierarchy Mapping</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  1. Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId('');
                    setBrandName('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-2xs"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  2. Subcategory <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={subcategoryId}
                  onChange={(e) => {
                    setSubcategoryId(e.target.value);
                    setBrandName('');
                  }}
                  disabled={!categoryId}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <option value="">-- Select Subcategory --</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  3. Brand <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={brandId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setBrandId(chosenId);
                    const bObj = brands.find((b) => String(b.id || b.brandId) === String(chosenId));
                    if (bObj) setBrandName(bObj.name || bObj.brandName || '');
                  }}
                  disabled={!subcategoryId}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <option value="">
                    {!subcategoryId ? '-- Select Subcategory First --' : (brands.length === 0 ? '-- No Brands Configured --' : '-- Select Brand --')}
                  </option>
                  {brands.map((b) => (
                    <option key={b.id || b.brandId || b.name} value={b.id || b.brandId}>
                      {b.name || b.brandName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 2: PRODUCT IDENTITY (SCREENSHOT 3)                                   */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>Product Identity</span>
            </div>

            {/* Product Title / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Product Title / Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tata Tiscon 550D TMT Rebar (12mm)"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
              />
            </div>

            {/* 2-Column: URL Slug & SKU Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tata-tiscon-550d-tmt-rebar-12mm"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Auto-generated SEO identifier for product URL
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  SKU Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="SKU-870323"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 3: PRICING & INVENTORY                                               */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
              <IndianRupee className="w-4 h-4 text-amber-500" />
              <span>Pricing & Inventory Details</span>
            </div>

            {/* Row 1: Base Price, Selling Price, MRP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Base Price in INR (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Selling Price in INR (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">Default buyer price (overrides Base Price)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  MRP in INR (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">Maximum Retail Price</p>
              </div>
            </div>

            {/* Row 2: Unit, MOQ, Available Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Unit of Measure <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-2xs font-medium"
                >
                  <option value="">-- Select Unit of Measure --</option>
                  <option value="Bags">Bags (e.g. Cement, Putty)</option>
                  <option value="Ton">Ton / MT (e.g. TMT Steel)</option>
                  <option value="Pieces">Pieces / SKU</option>
                  <option value="Meters">Meters (e.g. Cables, Pipes)</option>
                  <option value="Kg">Kilograms (Kg)</option>
                  <option value="Box">Box / Carton</option>
                  <option value="Sq.Ft">Square Feet (Sq.Ft)</option>
                  <option value="Sq.M">Square Meters (Sq.M)</option>
                  <option value="Litre">Litres (L)</option>
                  <option value="Bundle">Bundle</option>
                  <option value="Truckload">Full Truckload (FTL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Minimum Order Quantity (MOQ)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Available Stock Inventory
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Row 3: HSN Code, GST Rate, 24-Hour Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7214"
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  GST Applicable Rate
                </label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-2xs"
                >
                  <option value="18% GST">18% GST (Standard)</option>
                  <option value="28% GST">28% GST (Cement / Luxury)</option>
                  <option value="12% GST">12% GST (Pipes / Hardware)</option>
                  <option value="5% GST">5% GST (Aggregates / Sand)</option>
                  <option value="0% GST">0% GST (Exempt)</option>
                </select>
              </div>

              <div className="pb-1">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-amber-50/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={is24HourDelivery}
                    onChange={(e) => setIs24HourDelivery(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer shrink-0"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    <span>24-Hour Express Delivery</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 3B: WHOLESALE BULK PRICING TIERS                                     */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
                <TrendingDown className="w-4 h-4 text-amber-500" />
                <span>Wholesale Quantity Discount Tiers (Bulk Pricing)</span>
              </div>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <p className="text-[11.5px] text-slate-500">
              Provide volume-based discounted pricing for bulk B2B procurement contractors & distributors.
            </p>

            {bulkPricingTiers.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                No bulk pricing tiers added yet. Click &quot;Add Tier&quot; to offer volume discounts.
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-extrabold text-slate-500 px-1 uppercase tracking-wider">
                  <div className="col-span-3">Min Qty</div>
                  <div className="col-span-3">Max Qty</div>
                  <div className="col-span-3">Tier Price (₹)</div>
                  <div className="col-span-2">Discount %</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {bulkPricingTiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                  >
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="50"
                        value={tier.minQty}
                        onChange={(e) => handleTierChange(idx, 'minQty', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Optional max (e.g. 199)"
                        value={tier.maxQty || ''}
                        onChange={(e) => handleTierChange(idx, 'maxQty', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="380.00"
                        value={tier.price}
                        onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={tier.discountPercentage}
                        onChange={(e) => handleTierChange(idx, 'discountPercentage', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove Tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CARD 3C: TECHNICAL SPECIFICATIONS (KEY-VALUE PAIRS)                       */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <span>Technical Specifications (Key-Value)</span>
              </div>
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Specification</span>
              </button>
            </div>

            <p className="text-[11.5px] text-slate-500">
              Provide engineering, statutory compliance, grade, and packaging specs for buyers.
            </p>

            {specifications.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                No technical specifications added. Click &quot;Add Specification&quot; to configure properties.
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-extrabold text-slate-500 px-1 uppercase tracking-wider">
                  <div className="col-span-5">Specification Key</div>
                  <div className="col-span-6">Specification Value</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {specifications.map((spec, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="e.g. Grade, Packaging, Standard"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="e.g. PPC Grade, 50 kg HDPE Bag"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove Specification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CARD 4: PRODUCT IMAGERY (SCREENSHOT 4)                                    */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span>Product Imagery</span>
            </div>

            {/* Image Source Tabs: Upload File, Cloud URL */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveImageTab('upload')}
                className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeImageTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveImageTab('url')}
                className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeImageTab === 'url'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Cloud URL</span>
              </button>
            </div>

            {/* TAB 1: UPLOAD FILE DROPZONE */}
            {activeImageTab === 'upload' && (
              <div
                onClick={() => {
                  const input = document.getElementById('marketplace-product-file-upload');
                  if (input) input.click();
                }}
                className="border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20 rounded-2xl p-8 text-center transition-all cursor-pointer group"
              >
                <input
                  id="marketplace-product-file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-amber-600" />
                </div>

                <h4 className="text-sm font-bold text-slate-800">
                  Click to Upload or Drag & Drop
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Any format & resolution supported (JPG, PNG, WebP, GIF, SVG) — No size limit
                </p>
              </div>
            )}

            {/* TAB 3: CLOUD URL */}
            {activeImageTab === 'url' && (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Paste direct HTTPS image URL (https://...)"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddCloudUrl}
                  disabled={!customImageUrl.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  Add Image
                </button>
              </div>
            )}

            {/* Uploaded / Selected Images Preview Strip */}
            {images.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-600 block mb-2">
                  Attached Imagery ({images.length})
                </span>
                <div className="flex flex-wrap gap-3">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs"
                    >
                      <img
                        src={imgUrl}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 right-1 text-center bg-slate-900/85 text-amber-400 text-[8.5px] font-bold py-0.5 rounded backdrop-blur-xs">
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        title="Remove Image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CARD 5: TECHNICAL DESCRIPTION (SCREENSHOT 5)                              */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Technical Description</span>
            </div>

            <textarea
              rows={3}
              placeholder="Enter structural specs, tolerances, grade certification, chemical composition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs resize-none"
            />
          </div>

          {/* ========================================================================= */}
          {/* CARD 6: APPROVAL & VISIBILITY STATUS (SCREENSHOT 5)                       */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Approval & Visibility Status</span>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Initial Listing Status:</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                ⏳ PENDING ADMIN APPROVAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              New listings are reviewed by the HinchMart Catalog Compliance Team. Once an Admin reviews and approves this product, its status will automatically update to <span className="font-bold text-emerald-700">APPROVED</span>. If rejected, the rejection reason will be displayed.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* MODAL / FORM FOOTER (SCREENSHOT 5)                                        */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <span>All fields auto-validated before submission</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate('/seller/products')}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !price}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Product...' : 'Create Product'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
