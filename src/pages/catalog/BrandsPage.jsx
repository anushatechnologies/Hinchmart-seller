import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  X,
  Edit2,
  Trash2,
  Tag,
  LayoutGrid,
  Grid3X3,
  List as ListIcon,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories, useAllBrands } from '../../hooks/useCategories';
import { categoryService } from '../../services/category.service';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ImageUploadField } from '../../components/common/ImageUploadField';

const BRAND_PRESETS = [
  { name: 'Tata', slug: 'tata-tiscon', logo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&auto=format&fit=crop&q=80' },
  { name: 'JSW', slug: 'jsw-neosteel', logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80' },
  { name: 'Jindal', slug: 'jindal-panther', logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80' },
  { name: 'UltraTech', slug: 'ultratech-cement', logo: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=200&auto=format&fit=crop&q=80' },
  { name: 'ACC', slug: 'acc-cement', logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80' },
  { name: 'Polycab', slug: 'polycab-wires', logo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&auto=format&fit=crop&q=80' },
  { name: 'Havells', slug: 'havells-cables', logo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&auto=format&fit=crop&q=80' },
  { name: 'Supreme', slug: 'supreme-pipes', logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80' },
  { name: 'Astral', slug: 'astral-pipes', logo: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=80' },
  { name: 'Bosch', slug: 'bosch-tools', logo: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=200&auto=format&fit=crop&q=80' },
  { name: 'DeWalt', slug: 'dewalt-powertools', logo: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&auto=format&fit=crop&q=80' },
  { name: 'Asian Paints', slug: 'asian-paints', logo: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=200&auto=format&fit=crop&q=80' },
];

export function BrandsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialSubcat = searchParams.get('subcategoryId') || 'ALL';

  const { categories } = useCategories();
  const { brands: rawBrands, isLoading } = useAllBrands();
  const addToast = useUIStore((state) => state.addToast);

  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState(initialSubcat);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact' | 'list'

  // Add Brand Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [parentCategory, setParentCategory] = useState('');
  const [parentSubcategory, setParentSubcategory] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [brandLogo, setBrandLogo] = useState('');
  const [displaySortOrder, setDisplaySortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edit Brand Modal State
  const [editingBrand, setEditingBrand] = useState(null);
  const [editParentCategory, setEditParentCategory] = useState('');
  const [editParentSubcategory, setEditParentSubcategory] = useState('');
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandSlug, setEditBrandSlug] = useState('');
  const [editSlugEdited, setEditSlugEdited] = useState(false);
  const [editBrandLogo, setEditBrandLogo] = useState('');
  const [editDisplaySortOrder, setEditDisplaySortOrder] = useState('0');
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete Confirmation State
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Direct verified brands from backend database
  const allBrands = useMemo(() => {
    return rawBrands || [];
  }, [rawBrands]);

  // Subcategory options for create modal dropdown
  const modalSubcategoryOptions = useMemo(() => {
    if (!parentCategory) return [];
    const cat = categories.find((c) => String(c.id) === String(parentCategory) || String(c.categoryId) === String(parentCategory));
    return cat?.subcategories || [];
  }, [parentCategory, categories]);

  // Subcategory options for edit modal dropdown
  const editModalSubcategoryOptions = useMemo(() => {
    if (!editParentCategory) return [];
    const cat = categories.find((c) => String(c.id) === String(editParentCategory) || String(c.categoryId) === String(editParentCategory));
    return cat?.subcategories || [];
  }, [editParentCategory, categories]);

  // Category counts for quick-filter tabs
  const categoryCounts = useMemo(() => {
    const counts = { ALL: allBrands.length };
    for (const b of allBrands) {
      const cId = String(b.categoryId || 'UNASSIGNED');
      counts[cId] = (counts[cId] || 0) + 1;
    }
    return counts;
  }, [allBrands]);

  // Filtered list
  const filteredBrands = useMemo(() => {
    return allBrands.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
        b.subcategoryName?.toLowerCase().includes(search.toLowerCase()) ||
        b.slug?.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        selectedCategoryFilter === 'ALL' ||
        String(b.categoryId || '').replace(/^cat_/, '') === String(selectedCategoryFilter || '').replace(/^cat_/, '') ||
        String(b.categoryName || '').toLowerCase() === String(selectedCategoryFilter || '').toLowerCase();

      const matchesSubcat =
        selectedSubcategoryFilter === 'ALL' ||
        String(b.subcategoryId || '').replace(/^sub_/, '') === String(selectedSubcategoryFilter || '').replace(/^sub_/, '') ||
        String(b.subcategoryName || '').toLowerCase() === String(selectedSubcategoryFilter || '').toLowerCase();

      return matchesSearch && matchesCat && matchesSubcat;
    });
  }, [allBrands, search, selectedCategoryFilter, selectedSubcategoryFilter]);

  const handleBrandNameChange = (val) => {
    setBrandName(val);
    if (!slugManuallyEdited) {
      setBrandSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.name);
    setBrandLogo(preset.logo);
    if (!brandName.trim() || brandName === selectedPreset) {
      setBrandName(preset.name);
      setBrandSlug(preset.slug);
    }
  };

  const duplicateBrand = useMemo(() => {
    const cleanName = brandName.trim().toLowerCase();
    const cleanSlug = brandSlug.trim().toLowerCase();
    if (!cleanName && !cleanSlug) return null;
    return allBrands.find((b) => {
      const name = (b.name || '').trim().toLowerCase();
      const slug = (b.slug || '').trim().toLowerCase();
      return (cleanName && name === cleanName) || (cleanSlug && slug === cleanSlug);
    });
  }, [allBrands, brandName, brandSlug]);

  const handleCreateBrand = async (e) => {
    e?.preventDefault();
    if (!brandName.trim()) return;

    setIsSaving(true);
    try {
      const selectedCatObj = categories.find((c) => String(c.id) === String(parentCategory) || String(c.categoryId) === String(parentCategory));
      const payload = {
        name: brandName.trim(),
        slug: brandSlug.trim() || brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        categoryId: parentCategory || null,
        subcategoryId: parentSubcategory || null,
        imageUrl: brandLogo.trim() || null,
        sortOrder: Number(displaySortOrder) || 0,
        active: isActive,
      };

      let newBrand;
      if (duplicateBrand) {
        const brandId = duplicateBrand.id || duplicateBrand.brandId;
        newBrand = await categoryService.updateBrand(brandId, {
          ...duplicateBrand,
          ...payload,
        });
      } else {
        newBrand = await categoryService.createBrand(payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['allBrands'] });
      await queryClient.invalidateQueries({ queryKey: ['brands'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      addToast({
        title: duplicateBrand ? 'Brand Details Updated' : 'Brand Registered',
        message: `Brand "${newBrand.name}" registered successfully.`,
        type: 'success',
      });

      // Reset form
      setBrandName('');
      setBrandSlug('');
      setSlugManuallyEdited(false);
      setParentCategory('');
      setParentSubcategory('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.warn('Brand creation notice:', err?.response?.data || err.message);
      let msg = err.response?.data?.message || 'Could not save brand. Please try again.';
      addToast({
        title: 'Brand Notice',
        message: msg,
        type: 'warning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (brand) => {
    setEditingBrand(brand);
    setEditParentCategory(String(brand.categoryId || ''));
    setEditParentSubcategory(String(brand.subcategoryId || ''));
    setEditBrandName(brand.name || '');
    setEditBrandSlug(brand.slug || '');
    setEditSlugEdited(false);
    setEditBrandLogo(brand.imageUrl || '');
    setEditDisplaySortOrder(String(brand.sortOrder || 0));
    setEditIsActive(brand.active !== false);
  };

  const handleUpdateBrand = async (e) => {
    e?.preventDefault();
    if (!editingBrand || !editBrandName.trim()) return;

    setIsSaving(true);
    try {
      const brandId = String(editingBrand.id || editingBrand.brandId);
      const catObj = categories.find((c) => String(c.id) === String(editParentCategory) || String(c.categoryId) === String(editParentCategory));
      const subObj = catObj?.subcategories?.find((s) => String(s.id || s.subcategoryId) === String(editParentSubcategory) || s.name === editParentSubcategory);

      const payload = {
        id: brandId,
        brandId: editingBrand.brandId || brandId,
        name: editBrandName.trim(),
        slug: editBrandSlug.trim() || editBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        categoryId: editParentCategory || editingBrand.categoryId,
        categoryName: catObj?.name || editingBrand.categoryName || 'General',
        subcategoryId: editParentSubcategory || editingBrand.subcategoryId,
        subcategoryName: typeof subObj === 'string' ? subObj : (subObj?.name || editingBrand.subcategoryName || 'Subcategory'),
        imageUrl: editBrandLogo.trim() || null,
        sortOrder: Number(editDisplaySortOrder) || 0,
        active: editIsActive,
        verified: true,
      };

      await categoryService.updateBrand(brandId, payload);

      await queryClient.invalidateQueries({ queryKey: ['allBrands'] });
      await queryClient.invalidateQueries({ queryKey: ['brands'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      addToast({
        title: 'Brand Updated',
        message: `Brand "${payload.name}" updated successfully.`,
        type: 'success',
      });

      setEditingBrand(null);
    } catch (err) {
      console.error('Failed to update brand:', err);
      let msg = err.response?.data?.message || 'Could not update brand details.';
      addToast({
        title: 'Update Failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!deleteConfirmBrand) return;

    setIsDeleting(true);
    try {
      const brandId = String(deleteConfirmBrand.id || deleteConfirmBrand.brandId);
      await categoryService.deleteBrand(brandId);

      await queryClient.invalidateQueries({ queryKey: ['allBrands'] });
      await queryClient.invalidateQueries({ queryKey: ['brands'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      addToast({
        title: 'Brand Removed',
        message: `Brand "${deleteConfirmBrand.name}" removed from registry.`,
        type: 'info',
      });

      setDeleteConfirmBrand(null);
    } catch (err) {
      console.error('Failed to delete brand:', err);
      const msg = err.response?.data?.message || 'Could not delete brand.';
      addToast({
        title: 'Delete Failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/25 text-amber-300 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Brand Registry • Tier 3 Entities</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Brand Registry & Management</span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manage <strong>{allBrands.length} verified manufacturer brands</strong> linked across {categories.length} categories. Create, organize, and map products directly into your catalog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/seller/subcategories">
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Subcategories</span>
              </button>
            </Link>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-extrabold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add New Brand</span>
            </button>
          </div>
        </div>

        {/* Compact Micro Stats */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Total Brands</span>
            <span className="text-base sm:text-lg font-black text-white">{allBrands.length}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block">Verification</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Verified
            </span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Categories</span>
            <span className="text-base sm:text-lg font-black text-white">{categories.length} Active</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">Catalog Status</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Live & Synced
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Category Pills Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span>Filter By Category</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            Showing {filteredBrands.length} of {allBrands.length} Brands
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryFilter('ALL');
              setSelectedSubcategoryFilter('ALL');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            <span>All Brands</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              selectedCategoryFilter === 'ALL' ? 'bg-slate-950 text-amber-300' : 'bg-slate-100 text-slate-600'
            }`}>
              {categoryCounts.ALL || 0}
            </span>
          </button>

          {categories.map((c) => {
            const cId = String(c.id || c.categoryId);
            const isSelected = selectedCategoryFilter === cId;
            const count = categoryCounts[cId] || 0;
            return (
              <button
                key={cId}
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter(cId);
                  setSelectedSubcategoryFilter('ALL');
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <span>{c.name}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & View Controls Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search manufacturer, brand name, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right View Switchers */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Comfortable Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Compact Quick Grid"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden md:inline">Compact</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Detailed Table View"
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Brands Rendering */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading verified brand catalog...</p>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">No Brands Found</h3>
            <p className="text-xs text-slate-500">
              {search
                ? `No brands matched your search "${search}". Try searching another keyword or register this new brand directly.`
                : 'No brands exist under this category filter. You can register a brand in seconds.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            Add New Brand
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Brand / Manufacturer</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Parent Category</th>
                  <th className="py-3 px-4">Subcategory</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredBrands.map((brand) => (
                  <tr key={brand.id || brand.brandId} className="hover:bg-amber-50/30 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-800 overflow-hidden shrink-0">
                          {brand.imageUrl ? (
                            <img
                              src={brand.imageUrl}
                              alt={brand.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            brand.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block group-hover:text-amber-600 transition-colors">
                            {brand.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {brand.id || brand.brandId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      /{brand.slug}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {brand.categoryName || 'General'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {brand.subcategoryName || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/seller/products?search=${encodeURIComponent(brand.name)}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs font-bold transition-colors"
                          title="View Products"
                        >
                          Products
                        </Link>
                        <Link
                          to="/seller/products/add"
                          state={{ defaultBrand: brand.name, defaultCategory: brand.categoryId, defaultSubcategory: brand.subcategoryId }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition-colors"
                          title="Add Product"
                        >
                          + Add
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(brand)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmBrand(brand)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID & COMPACT GRID VIEW */
        <div
          className={`grid gap-4 ${
            viewMode === 'compact'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {filteredBrands.map((brand) => (
            <div
              key={brand.id || brand.brandId}
              className="qc-card bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400/80 p-4 shadow-xs flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Card Top Glow Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3">
                {/* Brand Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Brand Logo Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 text-amber-900 border border-amber-200/80 font-black text-sm flex items-center justify-center shrink-0 shadow-xs overflow-hidden relative group-hover:ring-2 group-hover:ring-amber-400/50 transition-all">
                      {brand.imageUrl ? (
                        <img
                          src={brand.imageUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.brand-fallback-text');
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <span className={`brand-fallback-text font-black text-amber-800 ${brand.imageUrl ? 'hidden' : ''}`}>
                        {(brand.name || 'B').slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                          {brand.name}
                        </h3>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Verified Trademark Brand" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block truncate mt-0.5">
                        /{brand.slug}
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown / Icons */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(brand)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Edit Brand"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmBrand(brand)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Taxonomy Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-bold ring-1 ring-amber-500/20">
                    <Tag className="w-2.5 h-2.5 text-amber-600" />
                    <span className="truncate max-w-[120px]">{brand.categoryName || 'General'}</span>
                  </span>
                  {brand.subcategoryName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                      <Layers className="w-2.5 h-2.5 text-slate-400" />
                      <span className="truncate max-w-[110px]">{brand.subcategoryName}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer with Quick Commerce Add Button */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to={`/seller/products?search=${encodeURIComponent(brand.name)}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-amber-600 transition-colors py-1"
                >
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span>Products</span>
                </Link>

                <Link
                  to="/seller/products/add"
                  state={{ defaultBrand: brand.name, defaultCategory: brand.categoryId, defaultSubcategory: brand.subcategoryId }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 text-xs font-extrabold transition-all duration-200 shadow-2xs hover:shadow-md active:scale-95 cursor-pointer group/btn"
                >
                  <span>Add Product</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. "ADD NEW BRAND" MODAL                                                   */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-600 uppercase tracking-wider mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Tier 3 Classification</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Add New Brand</h2>
                <p className="text-xs text-slate-500 mt-0.5">Map this brand under a Category and Subcategory</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Parent Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={parentCategory}
                  onChange={(e) => {
                    setParentCategory(e.target.value);
                    setParentSubcategory('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-2xs"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id || c.categoryId} value={c.id || c.categoryId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Parent Subcategory <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={parentSubcategory}
                  onChange={(e) => setParentSubcategory(e.target.value)}
                  disabled={!parentCategory}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <option value="">
                    {!parentCategory ? 'Select category first' : 'Select Subcategory'}
                  </option>
                  {modalSubcategoryOptions.map((s, idx) => {
                    const sName = typeof s === 'string' ? s : (s.name || s.title);
                    const sId = typeof s === 'object' ? (s.id || s.subcategoryId) : (idx + 1);
                    return (
                      <option key={sId} value={sId}>
                        {sName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Tiscon, UltraTech, Polycab"
                  value={brandName}
                  onChange={(e) => handleBrandNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Brand Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. tata-tiscon"
                  value={brandSlug}
                  onChange={(e) => {
                    setBrandSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              <ImageUploadField
                label="Brand Logo / Thumbnail"
                helperText="Upload official brand logo or pick from popular industry presets"
                value={brandLogo}
                onChange={setBrandLogo}
                uploadType="brands"
                presets={BRAND_PRESETS}
                selectedPreset={selectedPreset}
                onSelectPreset={handleSelectPreset}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={displaySortOrder}
                    onChange={(e) => setDisplaySortOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Active Status
                  </label>
                  <label className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">Active in marketplace</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !brandName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {isSaving ? 'Creating Brand...' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. "EDIT BRAND" MODAL                                                      */}
      {/* ========================================================================= */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-600 uppercase tracking-wider mb-1">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Brand Registry</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Edit Brand Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Update category hierarchy, brand title, slug, and logo</p>
              </div>

              <button
                type="button"
                onClick={() => setEditingBrand(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBrand} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Parent Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editParentCategory}
                  onChange={(e) => {
                    setEditParentCategory(e.target.value);
                    setEditParentSubcategory('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-2xs"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id || c.categoryId} value={c.id || c.categoryId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Parent Subcategory <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editParentSubcategory}
                  onChange={(e) => setEditParentSubcategory(e.target.value)}
                  disabled={!editParentCategory}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <option value="">
                    {!editParentCategory ? 'Select category first' : 'Select Subcategory'}
                  </option>
                  {editModalSubcategoryOptions.map((s, idx) => {
                    const sName = typeof s === 'string' ? s : (s.name || s.title);
                    const sId = typeof s === 'object' ? (s.id || s.subcategoryId) : (idx + 1);
                    return (
                      <option key={sId} value={sId}>
                        {sName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Tiscon, UltraTech, Polycab"
                  value={editBrandName}
                  onChange={(e) => {
                    setEditBrandName(e.target.value);
                    if (!editSlugEdited) {
                      setEditBrandSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Brand Slug
                </label>
                <input
                  type="text"
                  value={editBrandSlug}
                  onChange={(e) => {
                    setEditBrandSlug(e.target.value);
                    setEditSlugEdited(true);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              <ImageUploadField
                label="Brand Logo / Thumbnail"
                helperText="Upload official brand logo or pick from popular industry presets"
                value={editBrandLogo}
                onChange={setEditBrandLogo}
                uploadType="brands"
                presets={BRAND_PRESETS}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={editDisplaySortOrder}
                    onChange={(e) => setEditDisplaySortOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Active Status
                  </label>
                  <label className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">Active in marketplace</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !editBrandName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Brand Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE BRAND CONFIRMATION DIALOG                                       */}
      {/* ========================================================================= */}
      {deleteConfirmBrand && (
        <ConfirmationDialog
          isOpen={Boolean(deleteConfirmBrand)}
          onClose={() => setDeleteConfirmBrand(null)}
          onConfirm={handleDeleteBrand}
          isLoading={isDeleting}
          title="Delete Brand"
          message={`Are you sure you want to delete Brand "${deleteConfirmBrand.name}"? Products mapped to this brand may be affected.`}
          confirmText="Yes, Delete Brand"
          variant="danger"
        />
      )}
    </div>
  );
}
