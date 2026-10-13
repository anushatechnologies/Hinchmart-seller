import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  Package,
  Building2,
  Plus,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Tag,
  ShieldCheck,
  X,
  Edit2,
  Trash2,
  Sparkles,
  LayoutGrid,
  Grid3X3,
  List as ListIcon,
  Eye,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories, useAllSubcategories } from '../../hooks/useCategories';
import { categoryService } from '../../services/category.service';
import { useUIStore } from '../../store/uiStore';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ImageUploadField } from '../../components/common/ImageUploadField';

export function SubcategoriesPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'ALL';

  const { categories } = useCategories();
  const { subcategories: rawSubcategories, isLoading } = useAllSubcategories();
  const addToast = useUIStore((state) => state.addToast);

  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(categoryParam);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact' | 'list'

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [urlSlug, setUrlSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');
  const [artworkUrl, setArtworkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editParentCategoryId, setEditParentCategoryId] = useState('');
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSlugEdited, setEditSlugEdited] = useState(false);
  const [editSortOrder, setEditSortOrder] = useState('0');
  const [editArtworkUrl, setEditArtworkUrl] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete Confirmation State
  const [deleteConfirmSubcategory, setDeleteConfirmSubcategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Flatten all subcategories with parent category details directly from backend
  const allSubcategories = useMemo(() => {
    const catLookup = {};
    for (const c of categories) {
      catLookup[String(c.id || c.categoryId)] = c.name;
    }

    return (rawSubcategories || []).map((sub) => {
      const pCatName = catLookup[String(sub.categoryId)] || sub.categoryName || 'Category';
      return {
        ...sub,
        categoryName: pCatName,
      };
    });
  }, [categories, rawSubcategories]);

  // Category counts for quick-filter tabs
  const categoryCounts = useMemo(() => {
    const counts = { ALL: allSubcategories.length };
    for (const s of allSubcategories) {
      const cId = String(s.categoryId || 'UNASSIGNED');
      counts[cId] = (counts[cId] || 0) + 1;
    }
    return counts;
  }, [allSubcategories]);

  // Filtered subcategories
  const filteredSubcategories = useMemo(() => {
    return allSubcategories.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
        s.slug?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategoryFilter === 'ALL' ||
        String(s.categoryId) === String(selectedCategoryFilter) ||
        s.categoryName === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allSubcategories, search, selectedCategoryFilter]);

  const duplicateSubcategory = useMemo(() => {
    const cleanName = subcategoryName.trim().toLowerCase();
    const cleanSlug = urlSlug.trim().toLowerCase();
    if (!cleanName && !cleanSlug) return null;
    return allSubcategories.find((s) => {
      const name = (s.name || s.title || '').trim().toLowerCase();
      const slug = (s.slug || '').trim().toLowerCase();
      const catMatch = !parentCategoryId || String(s.categoryId) === String(parentCategoryId);
      return catMatch && ((cleanName && name === cleanName) || (cleanSlug && slug === cleanSlug));
    });
  }, [allSubcategories, subcategoryName, urlSlug, parentCategoryId]);

  const handleNameChange = (val) => {
    setSubcategoryName(val);
    if (!slugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setUrlSlug(generated);
    }
  };

  const handleCreateSubcategory = async (e) => {
    e?.preventDefault();
    if (!parentCategoryId || !subcategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const parentCat = categories.find((c) => String(c.id) === String(parentCategoryId) || String(c.categoryId) === String(parentCategoryId));
      const payload = {
        categoryId: parentCategoryId,
        categoryName: parentCat?.name || 'Category',
        name: subcategoryName.trim(),
        title: subcategoryName.trim(),
        slug: urlSlug.trim() || subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sortOrder: Number(sortOrder) || 0,
        imageUrl: artworkUrl.trim() || null,
        active: isActive,
      };

      let newSub;
      if (duplicateSubcategory) {
        const subId = duplicateSubcategory.id || duplicateSubcategory.subcategoryId;
        newSub = await categoryService.updateSubcategory(subId, {
          ...duplicateSubcategory,
          ...payload,
        });
      } else {
        newSub = await categoryService.createSubcategory(payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['allSubcategories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      addToast({
        title: duplicateSubcategory ? 'Subcategory Updated' : 'Subcategory Ready',
        message: `Subcategory "${newSub.name}" is active under ${parentCat?.name || 'Category'}.`,
        type: 'success',
      });

      // Reset form
      setParentCategoryId('');
      setSubcategoryName('');
      setUrlSlug('');
      setSlugManuallyEdited(false);
      setSortOrder('0');
      setArtworkUrl('');
      setIsActive(true);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.warn('Subcategory creation notice:', err?.response?.data || err.message);
      let msg = err.response?.data?.message || 'Could not save subcategory. Please try again.';
      addToast({
        title: 'Subcategory Notice',
        message: msg,
        type: 'warning',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (sub) => {
    setEditingSubcategory(sub);
    setEditParentCategoryId(String(sub.categoryId || ''));
    setEditName(sub.name || sub.title || '');
    setEditSlug(sub.slug || '');
    setEditSlugEdited(false);
    setEditSortOrder(String(sub.sortOrder || 0));
    setEditArtworkUrl(sub.imageUrl || '');
    setEditIsActive(sub.active !== false);
  };

  const handleUpdateSubcategory = async (e) => {
    e?.preventDefault();
    if (!editingSubcategory || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      const subId = String(editingSubcategory.id || editingSubcategory.subcategoryId);
      const parentCat = categories.find((c) => String(c.id) === String(editParentCategoryId) || String(c.categoryId) === String(editParentCategoryId));

      const payload = {
        id: subId,
        subcategoryId: editingSubcategory.subcategoryId || subId,
        categoryId: editParentCategoryId,
        categoryName: parentCat?.name || editingSubcategory.categoryName || 'Category',
        name: editName.trim(),
        title: editName.trim(),
        slug: editSlug.trim() || editName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sortOrder: Number(editSortOrder) || 0,
        imageUrl: editArtworkUrl.trim() || null,
        active: editIsActive,
        brands: editingSubcategory.brands || [],
        brandsCount: editingSubcategory.brandsCount || 0,
      };

      await categoryService.updateSubcategory(subId, payload);
      await queryClient.invalidateQueries({ queryKey: ['allSubcategories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      addToast({
        title: 'Subcategory Updated',
        message: `Subcategory "${payload.name}" updated successfully.`,
        type: 'success',
      });

      setEditingSubcategory(null);
    } catch (err) {
      console.error('Failed to update subcategory:', err);
      let msg = err.response?.data?.message || 'Could not update subcategory details.';
      addToast({
        title: 'Update Failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubcategory = async () => {
    if (!deleteConfirmSubcategory) return;

    setIsDeleting(true);
    try {
      const subId = String(deleteConfirmSubcategory.id || deleteConfirmSubcategory.subcategoryId);
      await categoryService.deleteSubcategory(subId);
      await queryClient.invalidateQueries({ queryKey: ['allSubcategories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      addToast({
        title: 'Subcategory Deleted',
        message: `Subcategory "${deleteConfirmSubcategory.name}" removed from catalog.`,
        type: 'info',
      });

      setDeleteConfirmSubcategory(null);
    } catch (err) {
      console.error('Failed to delete subcategory:', err);
      const msg = err.response?.data?.message || 'Could not delete subcategory.';
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
              <span>Catalog Structure • Tier 2 Families</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Subcategories Management</span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manage <strong>{allSubcategories.length} product families</strong> organized across {categories.length} categories. Create custom subcategories with high-resolution artwork and instant seller search mapping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/seller/categories">
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Categories</span>
              </button>
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-extrabold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Subcategory</span>
            </button>
          </div>
        </div>

        {/* Compact Micro Stats */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Total Subcategories</span>
            <span className="text-base sm:text-lg font-black text-white">{allSubcategories.length}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Parent Categories</span>
            <span className="text-base sm:text-lg font-black text-white">{categories.length} Active</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block">Catalog Status</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Live
            </span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">Hierarchy Structure</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Tier 2 Mapped
            </span>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span>Filter By Category</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            Showing {filteredSubcategories.length} of {allSubcategories.length} Subcategories
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            <span>All Categories</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              selectedCategoryFilter === 'ALL' ? 'bg-slate-950 text-amber-300' : 'bg-slate-100 text-slate-600'
            }`}>
              {categoryCounts.ALL || 0}
            </span>
          </button>

          {categories.map((c) => {
            const cId = String(c.id || c.categoryId);
            const isSelected = selectedCategoryFilter === cId || selectedCategoryFilter === c.name;
            const count = categoryCounts[cId] || 0;
            return (
              <button
                key={cId}
                type="button"
                onClick={() => setSelectedCategoryFilter(cId)}
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

      {/* 3. Search & View Mode Switcher */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search subcategory title, category, or slug..."
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

      {/* 4. Subcategories Rendering */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading subcategories...</p>
        </div>
      ) : filteredSubcategories.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">No Subcategories Found</h3>
            <p className="text-xs text-slate-500">
              {search
                ? `No subcategories matched "${search}". Try another keyword or create this subcategory now.`
                : 'No subcategories exist under the selected category. You can add one below.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            Add Subcategory
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Subcategory</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Parent Category</th>
                  <th className="py-3 px-4">Brands Linked</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredSubcategories.map((sub) => (
                  <tr key={sub.id || sub.subcategoryId} className="hover:bg-amber-50/30 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-800 overflow-hidden shrink-0">
                          {sub.imageUrl ? (
                            <img
                              src={sub.imageUrl}
                              alt={sub.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Layers className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block group-hover:text-amber-600 transition-colors">
                            {sub.name || sub.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {sub.id || sub.subcategoryId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      /{sub.slug}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {sub.categoryName}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/seller/brands?subcategoryId=${sub.id || sub.subcategoryId}`}
                        className="text-amber-600 hover:underline font-bold text-xs"
                      >
                        {sub.brandsCount || sub.brands?.length || 0} Brands
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/seller/products?search=${encodeURIComponent(sub.name || sub.title)}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs font-bold transition-colors"
                        >
                          Products
                        </Link>
                        <Link
                          to="/seller/products/add"
                          state={{ defaultCategory: sub.categoryId, defaultSubcategory: sub.id || sub.subcategoryId }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition-colors"
                        >
                          + Add
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sub)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmSubcategory(sub)}
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
          {filteredSubcategories.map((sub) => (
            <div
              key={sub.id || sub.subcategoryId}
              className="qc-card bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400/80 p-4 shadow-xs flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Card Top Glow Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 text-amber-900 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-xs overflow-hidden relative group-hover:ring-2 group-hover:ring-amber-400/50 transition-all">
                      {sub.imageUrl ? (
                        <img
                          src={sub.imageUrl}
                          alt={sub.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.sub-fallback-icon');
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Layers className={`w-5 h-5 text-amber-600 sub-fallback-icon ${sub.imageUrl ? 'hidden' : ''}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                        {sub.name || sub.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono block truncate mt-0.5">
                        /{sub.slug}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(sub)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Edit Subcategory"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmSubcategory(sub)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Subcategory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-bold ring-1 ring-amber-500/20">
                    <Tag className="w-2.5 h-2.5 text-amber-600" />
                    <span className="truncate max-w-[120px]">{sub.categoryName}</span>
                  </span>
                  <Link
                    to={`/seller/brands?subcategoryId=${sub.id || sub.subcategoryId}`}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 text-[10px] font-medium transition-colors"
                  >
                    <Building2 className="w-2.5 h-2.5 text-slate-400" />
                    <span>{sub.brandsCount || sub.brands?.length || 0} Brands</span>
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to={`/seller/products?search=${encodeURIComponent(sub.name || sub.title)}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-amber-600 transition-colors py-1"
                >
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span>Products</span>
                </Link>

                <Link
                  to="/seller/products/add"
                  state={{ defaultCategory: sub.categoryId, defaultSubcategory: sub.id || sub.subcategoryId }}
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
      {/* 1. "ADD SUBCATEGORY" MODAL                                                */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-600 uppercase tracking-wider mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tier 2 Classification</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Add Subcategory</h2>
                <p className="text-xs text-slate-500 mt-0.5">Define a specific product family under a Category</p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubcategory} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Parent Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
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
                  Subcategory Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper Armoured Cables, Color Pencils"
                  value={subcategoryName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. copper-armoured-cables"
                  value={urlSlug}
                  onChange={(e) => {
                    setUrlSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              <ImageUploadField
                label="Subcategory Thumbnail / Artwork"
                helperText="Upload official artwork or pick from popular industry presets"
                value={artworkUrl}
                onChange={setArtworkUrl}
                uploadType="categories"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
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
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !subcategoryName.trim() || !parentCategoryId}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {isSubmitting ? 'Creating Subcategory...' : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. "EDIT SUBCATEGORY" MODAL                                               */}
      {/* ========================================================================= */}
      {editingSubcategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-600 uppercase tracking-wider mb-1">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Subcategory</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Edit Subcategory Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Update category classification, title, and artwork</p>
              </div>

              <button
                type="button"
                onClick={() => setEditingSubcategory(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubcategory} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Parent Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editParentCategoryId}
                  onChange={(e) => setEditParentCategoryId(e.target.value)}
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
                  Subcategory Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (!editSlugEdited) {
                      setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => {
                    setEditSlug(e.target.value);
                    setEditSlugEdited(true);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              <ImageUploadField
                label="Subcategory Thumbnail / Artwork"
                helperText="Upload official artwork or pick from popular presets"
                value={editArtworkUrl}
                onChange={setEditArtworkUrl}
                uploadType="categories"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(e.target.value)}
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
                  onClick={() => setEditingSubcategory(null)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !editName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE SUBCATEGORY CONFIRMATION DIALOG                                 */}
      {/* ========================================================================= */}
      {deleteConfirmSubcategory && (
        <ConfirmationDialog
          isOpen={Boolean(deleteConfirmSubcategory)}
          onClose={() => setDeleteConfirmSubcategory(null)}
          onConfirm={handleDeleteSubcategory}
          isLoading={isDeleting}
          title="Delete Subcategory"
          message={`Are you sure you want to delete Subcategory "${deleteConfirmSubcategory.name}"? Products and brands mapped to this subcategory may be affected.`}
          confirmText="Yes, Delete Subcategory"
          variant="danger"
        />
      )}
    </div>
  );
}
