import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Building2,
  Tag,
  Layers,
  Package,
  Warehouse,
  Globe,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  ExternalLink,
  Edit3,
  Save,
  MapPin,
  Truck,
  IndianRupee,
  ShieldCheck,
  Phone,
  Mail,
  Eye,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  Copy,
  Check,
  Camera,
  X,
  MessageSquare,
  Send,
} from 'lucide-react';
import { sellerService } from '../../services/seller.service';
import { sellerProductService } from '../../services/sellerProduct.service';
import { categoryService } from '../../services/category.service';
import { inventoryService } from '../../services/inventory.service';
import { uploadService } from '../../services/upload.service';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/common/Button';
import { db } from '../../mock/db';

export function StoreSetupPage() {
  const navigate = useNavigate();
  const { sellerProfile } = useSellerAuth();
  const addToast = useUIStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState('STORE_PROFILE'); // STORE_PROFILE | CATALOG_HUB | PREVIEW
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);
  const [bannerImgError, setBannerImgError] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  const logoFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  // Store Profile State
  const [storeData, setStoreData] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    minOrderValue: 0,
    serviceRadiusKm: 0,
    supportPhone: '',
    supportEmail: '',
    status: 'ACTIVE',
    businessType: 'DISTRIBUTOR',
    gstin: '',
    establishedYear: new Date().getFullYear(),
    city: '',
    state: '',
  });

  // Connected Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Load Store & Catalog data
  const loadStoreAndCatalog = async () => {
    setLoading(true);
    try {
      const seller = db.getSeller() || {};
      const profile = await sellerService.getStoreProfile();

      const storeName = profile?.name || profile?.storeName || seller?.companyName || seller?.businessName || seller?.name || 'Seller Store';
      const cleanSlug = profile?.slug || storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const storedLogo = typeof localStorage !== 'undefined' ? localStorage.getItem('hinchmart_seller_logo') : null;
      const storedBanner = typeof localStorage !== 'undefined' ? localStorage.getItem('hinchmart_seller_banner') : null;

      const resolvedLogo = storedLogo || profile?.logoUrl || profile?.logo || seller?.logoUrl || seller?.logo || '';
      const resolvedBanner = storedBanner || profile?.bannerUrl || profile?.banner || seller?.bannerUrl || seller?.banner || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80';

      setStoreData({
        name: storeName,
        slug: cleanSlug,
        description: profile?.description || seller?.description || `${storeName} is a registered building material and industrial supplier on HinchMart B2B marketplace.`,
        logoUrl: resolvedLogo,
        bannerUrl: resolvedBanner,
        minOrderValue: Number(profile?.minOrderValue ?? seller?.minOrderValue ?? 0),
        serviceRadiusKm: Number(profile?.serviceRadiusKm ?? seller?.serviceRadiusKm ?? 0),
        supportPhone: seller?.phone || seller?.mobile || '',
        supportEmail: seller?.email || '',
        status: seller?.status || 'ACTIVE',
        businessType: seller?.businessType || 'DISTRIBUTOR',
        gstin: seller?.gstin || seller?.gstNumber || '',
        establishedYear: seller?.establishedYear || new Date().getFullYear(),
        city: seller?.city || '',
        state: seller?.state || '',
      });

      // Load Connected Catalog
      const [prods, cats, subs, brs, whs] = await Promise.all([
        sellerProductService.getSellerProducts().catch(() => []),
        categoryService.getCategories().catch(() => []),
        categoryService.getAllSubcategories().catch(() => []),
        categoryService.getBrands().catch(() => []),
        inventoryService.getWarehouses().catch(() => []),
      ]);

      setProducts(prods || []);
      setCategories(cats || []);
      setSubcategories(subs || []);
      setBrands(brs || []);
      setWarehouses(whs || []);
    } catch (err) {
      console.warn('Store load notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreAndCatalog();
  }, []);

  // Handle Logo Upload (Auto-Saved & Persisted)
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadService.uploadFile(file, null, 'stores');
      const url = res?.imageUrl || res?.fileUrl || res?.url;
      if (url) {
        setStoreData((prev) => ({ ...prev, logoUrl: url }));
        setLogoImgError(false);

        // 1. Immediately persist to localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('hinchmart_seller_logo', url);
        }

        // 2. Immediately persist to local database
        db.updateSeller({ logo: url, logoUrl: url });

        // 3. Sync to seller store profile service in background
        sellerService.updateStoreProfile({
          name: storeData.name,
          logoUrl: url,
          bannerUrl: storeData.bannerUrl,
          description: storeData.description,
          minOrderValue: Number(storeData.minOrderValue),
          serviceRadiusKm: Number(storeData.serviceRadiusKm),
        }).catch(() => {});

        addToast({ title: 'Logo Saved', message: 'Store logo updated and saved automatically.', type: 'success' });
      }
    } catch (err) {
      addToast({ title: 'Upload Failed', message: err.message, type: 'error' });
    }
  };

  // Handle Banner Upload (Auto-Saved & Persisted)
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadService.uploadFile(file, null, 'stores');
      const url = res?.imageUrl || res?.fileUrl || res?.url;
      if (url) {
        setStoreData((prev) => ({ ...prev, bannerUrl: url }));
        setBannerImgError(false);

        // 1. Immediately persist to localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('hinchmart_seller_banner', url);
        }

        // 2. Immediately persist to local database
        db.updateSeller({ banner: url, bannerUrl: url });

        // 3. Sync to seller store profile service in background
        sellerService.updateStoreProfile({
          name: storeData.name,
          logoUrl: storeData.logoUrl,
          bannerUrl: url,
          description: storeData.description,
          minOrderValue: Number(storeData.minOrderValue),
          serviceRadiusKm: Number(storeData.serviceRadiusKm),
        }).catch(() => {});

        addToast({ title: 'Banner Saved', message: 'Store cover banner updated and saved automatically.', type: 'success' });
      }
    } catch (err) {
      addToast({ title: 'Upload Failed', message: err.message, type: 'error' });
    }
  };

  const handleCopyStoreUrl = () => {
    const fullUrl = `https://hinchmart.com/store/${storeData.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      addToast({ title: 'URL Copied', message: 'Public store link copied to clipboard.', type: 'info' });
    }
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (typeof localStorage !== 'undefined') {
        if (storeData.logoUrl) localStorage.setItem('hinchmart_seller_logo', storeData.logoUrl);
        if (storeData.bannerUrl) localStorage.setItem('hinchmart_seller_banner', storeData.bannerUrl);
      }

      await sellerService.updateStoreProfile({
        name: storeData.name,
        storeName: storeData.name,
        slug: storeData.slug,
        description: storeData.description,
        logoUrl: storeData.logoUrl,
        bannerUrl: storeData.bannerUrl,
        minOrderValue: Number(storeData.minOrderValue),
        serviceRadiusKm: Number(storeData.serviceRadiusKm),
      });

      db.updateSeller({
        storeName: storeData.name,
        companyName: storeData.name,
        businessName: storeData.name,
        description: storeData.description,
        logo: storeData.logoUrl,
        logoUrl: storeData.logoUrl,
        banner: storeData.bannerUrl,
        bannerUrl: storeData.bannerUrl,
        minOrderValue: Number(storeData.minOrderValue),
        serviceRadiusKm: Number(storeData.serviceRadiusKm),
        phone: storeData.supportPhone,
        email: storeData.supportEmail,
      });

      addToast({
        title: 'Storefront Saved',
        message: 'Your store profile and marketplace settings have been updated.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Save Failed',
        message: err.message || 'Could not save store settings.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Get Store Initials for Monogram fallback
  const getStoreInitials = (name) => {
    if (!name) return 'HM';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">Loading Store & Catalog Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Inputs for Logo and Banner */}
      <input
        type="file"
        ref={logoFileInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerFileInputRef}
        onChange={handleBannerUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* STORE HERO HEADER CARD */}
      {/* ========================================================================= */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* Banner Cover Image */}
        <div className="h-44 sm:h-52 w-full relative bg-slate-800 overflow-hidden group">
          {storeData.bannerUrl && !bannerImgError ? (
            <img
              src={storeData.bannerUrl}
              alt=""
              className="w-full h-full object-cover object-center opacity-90 transition-all duration-300 group-hover:scale-105"
              onError={() => setBannerImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center">
              <Store className="w-16 h-16 text-slate-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />

          {/* Change Banner Button */}
          <button
            type="button"
            onClick={() => bannerFileInputRef.current?.click()}
            className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Change Cover</span>
          </button>

          {/* Active Status Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>STORE ACTIVE</span>
            </span>
          </div>
        </div>

        {/* Store Info Bar (Below Banner - Generous Clearance) */}
        <div className="px-6 pb-6 pt-0 relative bg-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            {/* Logo + Store Name Block */}
            <div className="flex items-center sm:items-center gap-4 min-w-0">
              {/* Logo Box with Monogram Fallback (Floating over Banner Edge) */}
              <div
                onClick={() => logoFileInputRef.current?.click()}
                className="-mt-10 sm:-mt-14 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden relative shrink-0 cursor-pointer group flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 text-white z-10"
                title="Click to change logo"
              >
                {storeData.logoUrl && !logoImgError ? (
                  <img
                    src={storeData.logoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setLogoImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                    <span className="text-xl sm:text-2xl font-black tracking-wider">
                      {getStoreInitials(storeData.name)}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest mt-0.5">
                      STORE
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Metadata (Cleanly in the White Section) */}
              <div className="space-y-1 pt-2 sm:pt-3 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                    {storeData.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Seller</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{storeData.city}, {storeData.state}</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleCopyStoreUrl}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                  >
                    <span>hinchmart.com/store/{storeData.slug}</span>
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0 pt-2 sm:pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('PREVIEW')}
                className="gap-1.5 text-xs font-bold"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Preview Storefront</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => navigate('/seller/products/add')}
                className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-100 px-6 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('STORE_PROFILE')}
            className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'STORE_PROFILE'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store Profile & Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('CATALOG_HUB')}
            className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'CATALOG_HUB'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Connected Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'PREVIEW'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Buyer View Mockup</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STORE PROFILE & OPERATIONS CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'STORE_PROFILE' && (
        <form onSubmit={handleSaveStore} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): Identity & Policies */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Branding */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Store Branding & Identity</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">API: PUT /api/seller/store</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Store Display Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={storeData.name}
                      onChange={(e) => setStoreData({ ...storeData, name: e.target.value })}
                      placeholder="e.g. Sri Balaji Industrial Supplies Pvt Ltd"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Store URL Slug <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-stretch rounded-xl overflow-hidden bg-slate-50 border border-slate-200 focus-within:border-emerald-500">
                      <span className="px-3 py-2 bg-slate-100 text-xs font-bold text-slate-500 border-r border-slate-200 flex items-center">
                        /store/
                      </span>
                      <input
                        type="text"
                        value={storeData.slug}
                        onChange={(e) => setStoreData({ ...storeData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="sri-balaji-supplies"
                        required
                        className="w-full px-3 py-2 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Tagline & Description
                  </label>
                  <textarea
                    rows={3}
                    value={storeData.description}
                    onChange={(e) => setStoreData({ ...storeData, description: e.target.value })}
                    placeholder="Describe your products, bulk supply guarantees, and business capabilities."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Logo & Banner Direct URL & Upload Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Store Logo Image URL</label>
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={storeData.logoUrl}
                      onChange={(e) => {
                        setStoreData({ ...storeData, logoUrl: e.target.value });
                        setLogoImgError(false);
                      }}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Store Cover Banner URL</label>
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={storeData.bannerUrl}
                      onChange={(e) => {
                        setStoreData({ ...storeData, bannerUrl: e.target.value });
                        setBannerImgError(false);
                      }}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Fulfillment & Policies */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Fulfillment & Order Policies</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Minimum Order Value (MOV) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                        ₹
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={storeData.minOrderValue}
                        onChange={(e) => setStoreData({ ...storeData, minOrderValue: e.target.value })}
                        className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Minimum cart total required for B2B buyers to checkout.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Delivery Service Radius <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={storeData.serviceRadiusKm}
                        onChange={(e) => setStoreData({ ...storeData, serviceRadiusKm: e.target.value })}
                        className="w-full pr-12 pl-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                        KM
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Direct logistics transport dispatch radius from warehouse.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (1 Col): Contact & Save Box */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Store Contact & Support</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Support Phone Number</label>
                  <input
                    type="tel"
                    value={storeData.supportPhone}
                    onChange={(e) => setStoreData({ ...storeData, supportPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Support Business Email</label>
                  <input
                    type="email"
                    value={storeData.supportEmail}
                    onChange={(e) => setStoreData({ ...storeData, supportEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-1">
                    <p className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Verified B2B Store</span>
                    </p>
                    <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                      GSTIN <strong>{storeData.gstin}</strong> is linked to this storefront.
                    </p>
                  </div>
                </div>
              </div>

              {/* Save & Publish Action Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 font-extrabold text-sm gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Store Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Store Profile</span>
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-center text-slate-500 font-medium">
                  Changes take effect across your HinchMart public storefront immediately.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONNECTED CATALOG HUB */}
      {/* ========================================================================= */}
      {activeTab === 'CATALOG_HUB' && (
        <div className="space-y-6">
          {/* Catalog KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Store Products</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{products.length}</p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{products.filter(p => p.status === 'APPROVED' || p.status === 'Active' || p.active).length} Live on Store</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Categories</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{categories.length}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{subcategories.length} Active Subcategories</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Brands</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{brands.length}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Authorized Brand Partners</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Warehouses</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Warehouse className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{warehouses.length || 1}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Dispatch Logistics Hubs</p>
            </div>
          </div>

          {/* Catalog Management Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header & Quick Actions */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-slate-50/40 to-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Products in your Store Catalog</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                    {products.length} {products.length === 1 ? 'Product' : 'Products'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Items that B2B customers can browse, request bulk quotations for, and purchase from your storefront.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/seller/categories')}
                  className="gap-1.5 text-xs font-bold shadow-xs hover:bg-slate-50"
                >
                  <Tag className="w-3.5 h-3.5 text-slate-600" />
                  <span>Manage Categories</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/seller/brands')}
                  className="gap-1.5 text-xs font-bold shadow-xs hover:bg-slate-50"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Manage Brands</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/seller/products/add')}
                  className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product to Store</span>
                </Button>
              </div>
            </div>

            {/* Products Listing Table */}
            {products.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100/80 shadow-xs">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Your Store Catalog is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    You have not added any products to your store yet. Create and publish your catalog items to showcase them on your storefront.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => navigate('/seller/products/add')}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Product</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Product Details</th>
                      <th className="py-3 px-4">Category & Brand</th>
                      <th className="py-3 px-4">Price / Unit</th>
                      <th className="py-3 px-4">Stock Availability</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {products.map((p) => {
                      const prodId = p.id || p.productId;
                      const isApproved = p.status === 'APPROVED' || p.status === 'Active' || p.active;
                      return (
                        <tr key={prodId} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Product Details */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
                                {p.imageUrl || p.image ? (
                                  <img src={p.imageUrl || p.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 max-w-xs sm:max-w-md">
                                <p className="font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                                  {p.title || p.name}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
                                  <span>SKU: {p.sku || 'SKU-GEN'}</span>
                                  {p.hsnCode && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span>HSN: {p.hsnCode}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category & Brand */}
                          <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                            <div className="space-y-0.5">
                              <p className="text-slate-900 font-bold">{p.categoryName || p.category || 'General'}</p>
                              <p className="text-slate-400 font-medium">{p.brandName || p.brand || 'Store Brand'}</p>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <p className="text-sm font-black text-slate-900">
                                ₹{Number(p.price || p.sellingPrice || 0).toLocaleString('en-IN')}
                              </p>
                              {p.mrp && Number(p.mrp) > Number(p.price || p.sellingPrice || 0) && (
                                <p className="text-[11px] text-slate-400 line-through">
                                  ₹{Number(p.mrp).toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Stock */}
                          <td className="py-4 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                Number(p.stockQty ?? p.stock ?? 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                              }`} />
                              <span>{p.stockQty ?? p.stock ?? 0} {p.unit || 'Units'}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${
                              isApproved
                                ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100/80 text-amber-800 border border-amber-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                              <span>{p.status || (isApproved ? 'APPROVED' : 'PENDING')}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/seller/products/${prodId}/edit`)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Edit Product"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BUYER VIEW MOCKUP */}
      {/* ========================================================================= */}
      {activeTab === 'PREVIEW' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Marketplace Buyer Storefront Preview</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live B2B Mockup</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                This is a live interactive simulation of how verified enterprise buyers, contractors, and retailers discover your store on HinchMart.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyStoreUrl}
              className="gap-1.5 text-xs font-bold shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copy Store URL</span>
            </Button>
          </div>

          {/* Realistic Marketplace Storefront Card Component */}
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/60 transition-all">
            {/* Banner Section */}
            <div className="h-48 sm:h-56 w-full bg-slate-900 relative overflow-hidden">
              {storeData.bannerUrl && !bannerImgError ? (
                <img
                  src={storeData.bannerUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setBannerImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center">
                  <Store className="w-14 h-14 text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

              {/* Verified Ribbon */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-emerald-800 rounded-full text-xs font-black shadow-md flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified B2B Supplier</span>
                </span>
              </div>
            </div>

            {/* Storefront Identity & Body */}
            <div className="p-6 sm:p-8 relative bg-white">
              {/* Logo & Headline */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center sm:items-center gap-4 min-w-0">
                  {/* Store Avatar Logo (Floating over Banner Edge) */}
                  <div className="-mt-14 sm:-mt-18 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-2xl z-10">
                    {storeData.logoUrl && !logoImgError ? (
                      <img
                        src={storeData.logoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setLogoImgError(true)}
                      />
                    ) : (
                      <span>{getStoreInitials(storeData.name)}</span>
                    )}
                  </div>

                  <div className="space-y-1 pt-2 sm:pt-3 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {storeData.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1 text-amber-600">
                        <Sparkles className="w-3.5 h-3.5 fill-amber-500" />
                        <span>4.8 ★ (34 B2B Reviews)</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-700 font-bold">GST Verified ({storeData.gstin})</span>
                    </div>
                  </div>
                </div>

                {/* Min Order Badge */}
                <div className="shrink-0 sm:self-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Min Order: ₹{Number(storeData.minOrderValue).toLocaleString('en-IN')}</span>
                  </span>
                </div>
              </div>

              {/* Tagline / Description */}
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                {storeData.description}
              </p>

              {/* Key SLA & Operations Grid */}
              <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-100 text-center bg-slate-50/60 rounded-2xl mb-6">
                <div className="p-2">
                  <p className="text-base sm:text-lg font-black text-slate-900">{products.length}</p>
                  <p className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider mt-0.5">Catalog Items</p>
                </div>
                <div className="p-2 border-x border-slate-200/60">
                  <p className="text-base sm:text-lg font-black text-slate-900">{storeData.serviceRadiusKm} KM</p>
                  <p className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider mt-0.5">Service Radius</p>
                </div>
                <div className="p-2">
                  <p className="text-base sm:text-lg font-black text-slate-900">24-48 Hrs</p>
                  <p className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider mt-0.5">Dispatch SLA</p>
                </div>
              </div>

              {/* Store Location & Buyer Actions Mockup */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dispatches from: <strong>{storeData.city}, {storeData.state}</strong></span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContactModal(true)}
                    className="flex-1 sm:flex-initial gap-1.5 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span>Contact Supplier</span>
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActiveTab('CATALOG_HUB');
                      addToast({
                        title: 'Catalog Opened',
                        message: `Viewing all ${products.length} products available in your store.`,
                        type: 'info',
                      });
                    }}
                    className="flex-1 sm:flex-initial gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Browse Catalog ({products.length})</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Simulated Buyer Contact & RFQ Modal */}
          {showContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Contact Supplier / Send RFQ</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Buyer inquiry preview for {storeData.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowContactModal(false);
                      setInquirySent(false);
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Contact Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>Direct Phone</span>
                    </span>
                    <p className="text-xs font-bold text-slate-900 truncate">{storeData.supportPhone || '+91 9849123456'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Mail className="w-3 h-3 text-emerald-600" />
                      <span>Official Email</span>
                    </span>
                    <p className="text-xs font-bold text-slate-900 truncate">{storeData.supportEmail || 'support@hinchmart.com'}</p>
                  </div>
                </div>

                {/* Simulated RFQ Form */}
                {inquirySent ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/30">
                      <Check className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-emerald-900">RFQ Inquiry Sent Successfully!</p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Inquiries from verified enterprise buyers appear in your <strong>Seller Inquiries & Quotations</strong> portal.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inquiry Message / Quotation Request</label>
                      <textarea
                        rows={3}
                        defaultValue="Hello, we are interested in placing a bulk purchase order for our salon/enterprise. Please provide your latest wholesale tier pricing and dispatch timeline."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        setInquirySent(true);
                        addToast({
                          title: 'Inquiry Sent (Simulated)',
                          message: 'Test RFQ inquiry sent to store support team.',
                          type: 'success',
                        });
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send B2B Price Inquiry</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StoreSetupPage;
