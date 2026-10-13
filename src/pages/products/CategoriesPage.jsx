import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Layers,
  ChevronRight,
  Plus,
  Package,
  Search,
  CheckCircle2,
  Image as ImageIcon,
  UploadCloud,
  Upload,
  X,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Info,
  Edit2,
  Trash2,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories } from '../../hooks/useCategories';
import { categoryService } from '../../services/category.service';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ImageUploadField } from '../../components/common/ImageUploadField';

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { categories, isLoading } = useCategories();
  const addToast = useUIStore((state) => state.addToast);

  const [selectedCatId, setSelectedCatId] = useState(null);
  const [search, setSearch] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [urlSlug, setUrlSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [displaySortOrder, setDisplaySortOrder] = useState('0');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryArtwork, setCategoryArtwork] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSlugEdited, setEditSlugEdited] = useState(false);
  const [editSortOrder, setEditSortOrder] = useState('0');
  const [editDescription, setEditDescription] = useState('');
  const [editArtwork, setEditArtwork] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Delete Confirmation State
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Direct categories list from React Query / Backend API
  const allCategories = useMemo(() => {
    return categories || [];
  }, [categories]);

  const selectedCat = useMemo(() => {
    if (selectedCatId) {
      const found = allCategories.find((c) => String(c.id) === String(selectedCatId) || String(c.categoryId) === String(selectedCatId));
      if (found) return found;
    }
    return allCategories[0] || null;
  }, [selectedCatId, allCategories]);

  const filteredCategories = useMemo(() => {
    return allCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.subcategories?.some((s) => (typeof s === 'string' ? s : s.name).toLowerCase().includes(search.toLowerCase()))
    );
  }, [allCategories, search]);

  const duplicateCategory = useMemo(() => {
    const cleanTitle = categoryTitle.trim().toLowerCase();
    const cleanSlug = urlSlug.trim().toLowerCase();
    if (!cleanTitle && !cleanSlug) return null;
    return allCategories.find((c) => {
      const name = (c.name || c.title || '').trim().toLowerCase();
      const slug = (c.slug || '').trim().toLowerCase();
      return (cleanTitle && name === cleanTitle) || (cleanSlug && slug === cleanSlug);
    });
  }, [allCategories, categoryTitle, urlSlug]);

  const handleTitleChange = (val) => {
    setCategoryTitle(val);
    if (!slugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setUrlSlug(generated);
    }
  };

  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    if (!categoryTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: categoryTitle.trim(),
        name: categoryTitle.trim(),
        slug: urlSlug.trim() || categoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sortOrder: Number(displaySortOrder) || 0,
        displayOrder: Number(displaySortOrder) || 0,
        description: categoryDescription.trim(),
        imageUrl: categoryArtwork.trim() || null,
        active: true,
      };

      let newCat;
      if (duplicateCategory) {
        const catId = duplicateCategory.id || duplicateCategory.categoryId;
        newCat = await categoryService.updateCategory(catId, {
          ...duplicateCategory,
          ...payload,
        });
      } else {
        newCat = await categoryService.createCategory(payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedCatId(newCat.id || newCat.categoryId);

      addToast({
        title: duplicateCategory ? 'Category Details Updated' : 'Category Ready',
        message: `Category "${newCat.name}" is active in catalog.`,
        type: 'success',
      });

      // Reset form
      setCategoryTitle('');
      setUrlSlug('');
      setSlugManuallyEdited(false);
      setDisplaySortOrder('0');
      setCategoryDescription('');
      setCategoryArtwork('');
      setIsCreateModalOpen(false);
    } catch (err) {
      console.warn('Category creation notice:', err?.response?.data || err.message);
      let msg = err.response?.data?.message || 'Could not save category.';
      addToast({
        title: 'Category Notice',
        message: msg,
        type: 'warning',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setEditTitle(cat.name || cat.title || '');
    setEditSlug(cat.slug || '');
    setEditSlugEdited(false);
    setEditSortOrder(String(cat.sortOrder ?? cat.displayOrder ?? 0));
    setEditDescription(cat.description || '');
    setEditArtwork(cat.imageUrl || '');
    setEditActive(cat.active !== false);
  };

  const handleUpdateCategory = async (e) => {
    e?.preventDefault();
    if (!editingCategory || !editTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const catId = editingCategory.id || editingCategory.categoryId;
      const payload = {
        id: catId,
        categoryId: catId,
        name: editTitle.trim(),
        title: editTitle.trim(),
        slug: editSlug.trim() || editTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sortOrder: Number(editSortOrder) || 0,
        displayOrder: Number(editSortOrder) || 0,
        description: editDescription.trim(),
        imageUrl: editArtwork.trim() || null,
        active: editActive,
        subcategories: editingCategory.subcategories || [],
      };

      await categoryService.updateCategory(catId, payload);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      addToast({
        title: 'Category Updated',
        message: `Category "${payload.name}" updated successfully.`,
        type: 'success',
      });

      setEditingCategory(null);
    } catch (err) {
      console.error('Failed to update category:', err);
      let msg = err.response?.data?.message || 'Could not update category details.';
      addToast({
        title: 'Update Failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirmCategory) return;

    setIsDeleting(true);
    try {
      const catId = String(deleteConfirmCategory.id || deleteConfirmCategory.categoryId);
      await categoryService.deleteCategory(catId);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      const remaining = allCategories.filter((c) => String(c.id || c.categoryId) !== catId);
      if (remaining.length > 0) {
        setSelectedCatId(remaining[0].id || remaining[0].categoryId);
      } else {
        setSelectedCatId(null);
      }

      addToast({
        title: 'Category Deleted',
        message: `Category "${deleteConfirmCategory.name}" removed from catalog.`,
        type: 'info',
      });

      setDeleteConfirmCategory(null);
    } catch (err) {
      console.error('Failed to delete category:', err);
      const msg = err.response?.data?.message || 'Could not delete category.';
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
    <div className="space-y-6 w-full pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/25 text-amber-300 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Catalog Root • Tier 1 Verticals</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Categories Management</span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore <strong>{allCategories.length} primary industry categories</strong> that power all catalog classifications, navigation tabs, and instant seller search.
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
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-extrabold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Category</span>
            </button>
          </div>
        </div>

        {/* Compact Micro Stats */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Total Verticals</span>
            <span className="text-base sm:text-lg font-black text-white">{allCategories.length}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block">Active Status</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Live
            </span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Catalog Depth</span>
            <span className="text-base sm:text-lg font-black text-white">3 Tiers</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">Sync Status</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Live & Synced
            </span>
          </div>
        </div>
      </div>

      {/* 2. Category Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Category Selector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search category title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-xs"
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

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 max-h-[640px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading catalog categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No categories found matching your query.</div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = selectedCat && String(selectedCat.id || selectedCat.categoryId) === String(cat.id || cat.categoryId);

                return (
                  <div
                    key={cat.id || cat.categoryId}
                    onClick={() => setSelectedCatId(cat.id || cat.categoryId)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-all text-xs group ${
                      isSelected
                        ? 'bg-amber-500/10 border-l-4 border-amber-500 font-bold text-amber-950'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs group-hover:ring-2 group-hover:ring-amber-400/50 transition-all">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.cat-fallback-icon');
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Tag className={`w-5 h-5 text-amber-600 cat-fallback-icon ${cat.imageUrl ? 'hidden' : ''}`} />
                      </div>

                      <div className="truncate">
                        <span className="text-xs font-extrabold block truncate text-slate-900 group-hover:text-amber-600 transition-colors">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate mt-0.5">
                          /{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')} • {cat.subcategories?.length || 0} Subcategories
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(cat);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmCategory(cat);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? 'text-amber-600 translate-x-1' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 7 Cols: Selected Category Detail */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCat ? (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              {/* Category Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs overflow-hidden relative">
                    {selectedCat.imageUrl ? (
                      <img
                        src={selectedCat.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.cat-detail-fallback-icon');
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Tag className={`w-8 h-8 cat-detail-fallback-icon ${selectedCat.imageUrl ? 'hidden' : ''}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedCat.name}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        selectedCat.active !== false ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {selectedCat.active !== false ? 'Active Vertical' : 'Inactive'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 block mt-1">
                      URL Slug: <strong className="text-slate-700">/{selectedCat.slug}</strong>
                    </span>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedCat)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmCategory(selectedCat)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <Link
                    to="/seller/products/add"
                    state={{ defaultCategory: selectedCat.id || selectedCat.categoryId }}
                  >
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Product</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Category Hierarchy & Fields Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Title</span>
                  <span className="text-xs font-extrabold text-slate-900 mt-1 block truncate">{selectedCat.name}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SEO URL Slug</span>
                  <span className="text-xs font-mono font-bold text-slate-700 mt-1 block truncate">/{selectedCat.slug}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Display Sort Order</span>
                  <span className="text-xs font-mono font-bold text-slate-900 mt-1 block">
                    {selectedCat.sortOrder ?? selectedCat.displayOrder ?? 0}
                  </span>
                </div>
              </div>

              {/* Category Description */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Description</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedCat.description ||
                    'Comprehensive procurement category for fast-moving products and verified vendors.'}
                </p>
              </div>

              {/* Subcategories linked */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Linked Subcategories ({selectedCat.subcategories?.length || 0})
                  </h3>

                  <Link
                    to={`/seller/subcategories?category=${encodeURIComponent(selectedCat.name)}`}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    View in Subcategories <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedCat.subcategories?.length > 0 ? (
                    selectedCat.subcategories.map((sub, i) => {
                      const subName = typeof sub === 'string' ? sub : (sub.name || sub.title || `Subcategory ${i + 1}`);
                      return (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-900 transition-colors"
                        >
                          {subName}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 italic">No subcategories linked yet.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
              Select a category on the left to inspect its fields and hierarchy.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. "CREATE NEW CATALOG CATEGORY" MODAL                                     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm font-bold">
                  <Tag className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">Create New Catalog Category</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Add a category taxonomy to classify products</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>Category Identity & Details</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Category Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electrical, Stationery, Paints"
                    value={categoryTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      URL Slug <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. electrical"
                      value={urlSlug}
                      onChange={(e) => {
                        setUrlSlug(e.target.value);
                        setSlugManuallyEdited(true);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Display Sort Order
                    </label>
                    <input
                      type="number"
                      value={displaySortOrder}
                      onChange={(e) => setDisplaySortOrder(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Category Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the product lines classified under this category..."
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs resize-none"
                  />
                </div>
              </div>

              {/* Artwork */}
              <ImageUploadField
                label="Artwork / Thumbnail Image"
                helperText="Upload category artwork or icon from computer, or paste a URL"
                value={categoryArtwork}
                onChange={setCategoryArtwork}
                uploadType="categories"
              />

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
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
                  disabled={isSubmitting || !categoryTitle.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {isSubmitting ? 'Creating Category...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. "EDIT CATEGORY" MODAL                                                   */}
      {/* ========================================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm font-bold">
                  <Edit2 className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">Edit Category Details</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Update category title, slug, and artwork</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>Category Identity & Details</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Category Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => {
                      setEditTitle(e.target.value);
                      if (!editSlugEdited) {
                        setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      URL Slug <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editSlug}
                      onChange={(e) => {
                        setEditSlug(e.target.value);
                        setEditSlugEdited(true);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Display Sort Order
                    </label>
                    <input
                      type="number"
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Category Description
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs resize-none"
                  />
                </div>
              </div>

              {/* Artwork */}
              <ImageUploadField
                label="Artwork / Thumbnail Image"
                helperText="Upload category artwork or icon from computer, or paste a URL"
                value={editArtwork}
                onChange={setEditArtwork}
                uploadType="categories"
              />

              {/* Status Toggle */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Category Status</span>
                </div>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-amber-50/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Active in Marketplace</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Enable to make this category visible across all seller navigation and buyer storefronts.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !editTitle.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Category Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE CONFIRMATION DIALOG                                             */}
      {/* ========================================================================= */}
      {deleteConfirmCategory && (
        <ConfirmationDialog
          isOpen={Boolean(deleteConfirmCategory)}
          onClose={() => setDeleteConfirmCategory(null)}
          onConfirm={handleDeleteCategory}
          isLoading={isDeleting}
          title="Delete Category"
          message={`Are you sure you want to delete Category "${deleteConfirmCategory.name}"? Subcategories and products linked to this category may be affected.`}
          confirmText="Yes, Delete Category"
          variant="danger"
        />
      )}
    </div>
  );
}
