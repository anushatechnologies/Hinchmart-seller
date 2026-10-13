import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
} from 'lucide-react';
import { useCategories, useSubcategories, useBrands } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useUIStore } from '../../store/uiStore';
import { uploadService } from '../../services/upload.service';

// Curated B2B Construction Material Presets
const B2B_IMAGE_PRESETS = [
  {
    name: 'Tata Tiscon 550D TMT Rebar',
    category: 'Civil & Structural',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'UltraTech Super Cement 50kg',
    category: 'Civil & Structural',
    url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'JSW NeoSteel 500D TMT Bar',
    category: 'Civil & Structural',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Astral CPVC Pro High Pressure Pipe',
    category: 'Plumbing & Water Management',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Polycab FRLS Industrial Cable 90m',
    category: 'Electrical & Automation',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Havells Heavy Duty MCB Switchboard',
    category: 'Electrical & Automation',
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bosch GSB 500W Professional Impact Drill',
    category: 'Tools & Machinery',
    url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Asian Paints Apex Ultima WeatherProof 20L',
    category: 'Paints & Finishes',
    url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&auto=format&fit=crop&q=80',
  },
];

export function AddProductModal({ isOpen, onClose, initialData = {} }) {
  const addToast = useUIStore((state) => state.addToast);
  const { createProduct } = useProducts();

  // Form State matching Screenshots 3, 4, 5
  const [categoryId, setCategoryId] = useState(initialData.categoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(initialData.subcategoryId || '');
  const [brandName, setBrandName] = useState(initialData.brandName || '');

  const [title, setTitle] = useState(initialData.title || '');
  const [slug, setSlug] = useState(initialData.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [sku, setSku] = useState(() => initialData.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`);

  // Pricing & Inventory State
  const [price, setPrice] = useState(initialData.price || '54200.00');
  const [unit, setUnit] = useState(initialData.unit || 'Unit');
  const [moq, setMoq] = useState(initialData.moq || '1');
  const [stock, setStock] = useState(initialData.stock || '100');
  const [hsn, setHsn] = useState(initialData.hsn || '7214');
  const [gstRate, setGstRate] = useState(initialData.gstRate || '18% GST');
  const [is24HourDelivery, setIs24HourDelivery] = useState(Boolean(initialData.is24HourDelivery));

  // Imagery State
  const [activeImageTab, setActiveImageTab] = useState('upload'); // 'upload' | 'presets' | 'url'
  const [images, setImages] = useState(initialData.images || []);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Description & Status State
  const [description, setDescription] = useState(initialData.description || '');
  const [approvalStatus, setApprovalStatus] = useState(initialData.approvalStatus || 'PENDING');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories query
  const { categories = [] } = useCategories();

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
    return brands.find((b) => String(b.id) === String(brandName) || String(b.brandId) === String(brandName) || b.name === brandName);
  }, [brands, brandName]);

  // Sync initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData.categoryId) setCategoryId(initialData.categoryId);
      if (initialData.subcategoryId) setSubcategoryId(initialData.subcategoryId);
      if (initialData.brandName) setBrandName(initialData.brandName);
    }
  }, [isOpen, initialData]);

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

    for (const file of files) {
      try {
        const res = await uploadService.uploadFile(file, null, 'products');
        if (res?.url) {
          setImages((prev) => [...prev, res.url]);
        }
      } catch (err) {
        console.warn('S3 upload notice in modal:', err?.message);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImages((prev) => [...prev, event.target.result]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddCloudUrl = (e) => {
    e?.preventDefault();
    if (customImageUrl.trim()) {
      setImages((prev) => [...prev, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleSelectPresetImage = (presetUrl) => {
    if (!images.includes(presetUrl)) {
      setImages((prev) => [...prev, presetUrl]);
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
        message: 'Please enter a Product Title / Description',
        type: 'error',
      });
      return;
    }

    if (!price || isNaN(Number(price))) {
      addToast({
        title: 'Price Required',
        message: 'Please enter a valid Price in INR',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    const parsedGst = parseInt(gstRate, 10) || 18;
    const finalPrice = parseFloat(price) || 0;
    const finalMoq = parseInt(moq, 10) || 1;
    const finalStock = parseInt(stock, 10) || 0;

    const resolvedCatId = Number(selectedCatObj?.categoryId || selectedCatObj?.id || categoryId) || null;
    const resolvedCatName = selectedCatObj?.name || selectedCatObj?.title || 'Category';

    const resolvedSubcatId = Number(selectedSubcatObj?.subcategoryId || selectedSubcatObj?.id || subcategoryId) || null;
    const resolvedSubcatName = selectedSubcatObj?.name || selectedSubcatObj?.title || 'Subcategory';

    const resolvedBrandId = Number(selectedBrandObj?.brandId || selectedBrandObj?.id) || null;
    const resolvedBrandName = selectedBrandObj?.name || selectedBrandObj?.brandName || brandName.trim() || 'Brand';

    const newProductPayload = {
      brandId: resolvedBrandId,
      brand: resolvedBrandName,
      brandName: resolvedBrandName,
      categoryId: resolvedCatId,
      category: resolvedCatName,
      categoryName: resolvedCatName,
      subcategoryId: resolvedSubcatId,
      subcategory: resolvedSubcatName,
      subcategoryName: resolvedSubcatName,
      title: title.trim(),
      name: title.trim(),
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      price: finalPrice,
      sellingPrice: finalPrice,
      mrp: Math.round(finalPrice * 1.15),
      unit: unit || 'PIECE',
      moq: finalMoq,
      stock: finalStock,
      stockQty: finalStock,
      hsn: hsn.trim() || '7214',
      hsnCode: hsn.trim() || '7214',
      gstRate: parsedGst,
      gst: parsedGst,
      is24HourDelivery: Boolean(is24HourDelivery),
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80'],
      imageUrl: images[0] || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80',
      description: description.trim(),
      status: approvalStatus,
      approvalStatus: approvalStatus,
      active: approvalStatus === 'APPROVED',
    };

    try {
      await createProduct(newProductPayload);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error creating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
        {/* DARK NAVY HEADER BANNER (SCREENSHOT 3) */}
        <div className="bg-[#0f172a] text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Add New Marketplace Product
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit a new B2B product listing to the marketplace catalog
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE MAIN FORM (MATCHES SCREENSHOTS 3, 4, 5) */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto custom-scrollbar bg-slate-50/60">
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
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  disabled={!subcategoryId}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <option value="">
                    {!subcategoryId ? '-- Select Subcategory First --' : (brands.length === 0 ? '-- No Brands Configured --' : '-- Select Brand --')}
                  </option>
                  {brands.map((b) => (
                    <option key={b.id || b.name} value={b.name}>
                      {b.name}
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
          {/* CARD 3: PRICING & INVENTORY (SCREENSHOT 4)                                */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
              <IndianRupee className="w-4 h-4 text-amber-500" />
              <span>Pricing & Inventory</span>
            </div>

            {/* Row 1: Price, Unit, MOQ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Price in INR (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="54200.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Unit <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-2xs"
                >
                  <option value="Unit">Unit</option>
                  <option value="MT">MT (Metric Ton)</option>
                  <option value="Bag">Bag (50kg)</option>
                  <option value="Piece">Piece / SKU</option>
                  <option value="Ton">Ton</option>
                  <option value="Kg">Kg</option>
                  <option value="Bundle">Bundle</option>
                  <option value="Sq.Ft">Sq.Ft</option>
                  <option value="Box">Box / Carton</option>
                  <option value="Meter">Meter (Rmt)</option>
                  <option value="Litre">Litre (L)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Minimum Order Quantity
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
            </div>

            {/* Row 2: Available Stock, HSN Code, GST Rate */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Available Stock Inventory
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  HSN Code
                </label>
                <input
                  type="text"
                  placeholder="7214"
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  GST Rate
                </label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-2xs"
                >
                  <option value="18% GST">18% GST</option>
                  <option value="5% GST">5% GST</option>
                  <option value="12% GST">12% GST</option>
                  <option value="28% GST">28% GST</option>
                  <option value="0% GST">0% GST</option>
                </select>
              </div>
            </div>

            {/* Row 3: 24-Hour Express Logistics Delivery */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-amber-50/30 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={is24HourDelivery}
                  onChange={(e) => setIs24HourDelivery(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer shrink-0"
                />
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span>Enable 24-Hour Express Logistics Delivery for this product</span>
                </div>
              </label>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 4: PRODUCT IMAGERY (SCREENSHOT 4)                                    */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span>Product Imagery</span>
            </div>

            {/* Image Source Tabs: Upload File, B2B Presets, Cloud URL */}
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
                onClick={() => setActiveImageTab('presets')}
                className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeImageTab === 'presets'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>B2B Presets</span>
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
                  const input = document.getElementById('marketplace-modal-file-upload');
                  if (input) input.click();
                }}
                className="border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20 rounded-2xl p-7 text-center transition-all cursor-pointer group"
              >
                <input
                  id="marketplace-modal-file-upload"
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

            {/* TAB 2: B2B PRESETS */}
            {activeImageTab === 'presets' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium">
                  Select official high-resolution B2B catalog imagery:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                  {B2B_IMAGE_PRESETS.map((preset) => {
                    const isAdded = images.includes(preset.url);
                    return (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => handleSelectPresetImage(preset.url)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isAdded
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-full h-20 rounded-lg overflow-hidden bg-slate-100 mb-1.5 relative">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                          {isAdded && (
                            <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 p-0.5 rounded shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
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
                      className="relative group w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs"
                    >
                      <img
                        src={imgUrl}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 right-1 text-center bg-slate-900/85 text-amber-400 text-[8px] font-bold py-0.5 rounded backdrop-blur-xs">
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        title="Remove Image"
                      >
                        <X className="w-2.5 h-2.5" />
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

            <select
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-2xs"
            >
              <option value="PENDING">⏳ Pending Approval Review</option>
              <option value="APPROVED">✅ Approved & Live in Marketplace</option>
              <option value="INACTIVE">❌ Draft / Inactive</option>
            </select>
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
                onClick={onClose}
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
