import { apiClient, delay, USE_MOCK_API, hasValidLiveAuth, canAccessSellerApi } from './api.js';
import { db } from '../mock/db.js';
import { getCategoryImage, getSubcategoryImage, getBrandLogo } from '../utils/productImages.js';

/**
 * Normalizes a category from backend or seller repository
 */
export function normalizeCategory(cat) {
  if (!cat) return null;
  const categoryId = Number(cat.categoryId ?? cat.category_id ?? cat.id) || cat.categoryId || cat.category_id || cat.id;
  const imageUrl = getCategoryImage(cat);
  const rawSubs = Array.isArray(cat.subcategories)
    ? cat.subcategories
    : Array.isArray(cat.sub_categories)
    ? cat.sub_categories
    : Array.isArray(cat.subCategories)
    ? cat.subCategories
    : Array.isArray(cat.children)
    ? cat.children
    : [];

  const subcategories = rawSubs.map((sub, idx) => {
    if (typeof sub === 'string') {
      return {
        id: `sub_${categoryId}_${idx + 1}`,
        subcategoryId: idx + 1,
        categoryId,
        name: sub,
        title: sub,
        slug: sub.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        imageUrl: getSubcategoryImage({ name: sub, categoryId }, cat),
        brands: [],
      };
    }
    const subId = Number(sub.subcategoryId ?? sub.subcategory_id ?? sub.id ?? sub.sub_id) || sub.subcategoryId || sub.subcategory_id || sub.id || idx + 1;
    const subCatId = Number(sub.categoryId ?? sub.category_id ?? categoryId) || categoryId;
    const subName = sub.name || sub.subcategory_name || sub.subCategoryName || sub.title || `Subcategory ${idx + 1}`;
    return {
      ...sub,
      id: subId,
      subcategoryId: subId,
      categoryId: subCatId,
      name: subName,
      title: subName,
      slug: sub.slug || String(subName).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      imageUrl: getSubcategoryImage(sub, cat),
      brands: sub.eligibleBrands || sub.eligible_brands || sub.brands || [],
    };
  });

  return {
    ...cat,
    id: categoryId,
    categoryId,
    name: cat.name || cat.category_name || cat.title || 'Category',
    title: cat.title || cat.category_name || cat.name || 'Category',
    slug: cat.slug || String(categoryId),
    imageUrl,
    sortOrder: cat.sortOrder ?? cat.sort_order ?? 0,
    active: cat.active ?? (cat.status === 'Active' || cat.status === 1 || cat.is_active === 1 || true),
    status: cat.status || (cat.active ? 'Active' : 'Pending Approval'),
    productCount: cat.productCount ?? cat.product_count ?? 0,
    subcategories,
    specFields: cat.specFields || cat.spec_fields || [],
  };
}

/**
 * Normalizes a subcategory from backend or seller repository
 */
export function normalizeSubcategory(sub, parentCategory = null) {
  if (!sub) return null;
  const subcategoryId = Number(sub.subcategoryId ?? sub.subcategory_id ?? sub.id ?? sub.sub_id) || sub.subcategoryId || sub.subcategory_id || sub.id;
  const categoryId = Number(sub.categoryId ?? sub.category_id ?? sub.cat_id ?? sub.parent_id ?? parentCategory?.id ?? parentCategory?.categoryId) || sub.categoryId || sub.category_id || parentCategory?.id;
  const subName = sub.name || sub.subcategory_name || sub.subCategoryName || sub.title || 'Subcategory';
  const categoryName = sub.categoryName || sub.category_name || parentCategory?.name || parentCategory?.title || '';
  const imageUrl = getSubcategoryImage(sub, parentCategory);
  return {
    ...sub,
    id: subcategoryId,
    subcategoryId,
    categoryId,
    categoryName,
    name: subName,
    title: subName,
    slug: sub.slug || String(subName).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    imageUrl,
    sortOrder: sub.sortOrder ?? sub.sort_order ?? 0,
    active: sub.active ?? (sub.status === 'Active' || sub.status === 1 || sub.is_active === 1 || true),
    status: sub.status || (sub.active ? 'Active' : 'Pending Approval'),
    productCount: sub.productCount ?? sub.product_count ?? 0,
    brandsCount: Array.isArray(sub.brands) ? sub.brands.length : (sub.brandsCount ?? sub.brands_count ?? 0),
    brands: sub.eligibleBrands || sub.eligible_brands || sub.brands || [],
  };
}

/**
 * Normalizes a brand from backend or seller repository
 */
export function normalizeBrand(b) {
  if (!b) return null;
  const brandId = Number(b.brandId ?? b.brand_id ?? b.id) || b.brandId || b.id;
  const imageUrl = getBrandLogo(b);
  const brandName = b.name || b.brandName || b.brand_name || b.title || 'Brand';
  return {
    ...b,
    id: brandId,
    brandId,
    name: brandName,
    brandName,
    slug: b.slug || String(brandName).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    subcategoryId: Number(b.subcategoryId ?? b.subcategory_id) || b.subcategoryId || b.subcategory_id,
    subcategoryName: b.subcategoryName || b.subcategory_name,
    categoryId: Number(b.categoryId ?? b.category_id) || b.categoryId || b.category_id,
    categoryName: b.categoryName || b.category_name,
    imageUrl,
    sortOrder: b.sortOrder ?? b.sort_order ?? 0,
    active: b.active ?? (b.status === 'Active' || b.status === 1 || b.is_active === 1 || true),
    status: b.status || (b.active ? 'Active' : 'Pending Approval'),
    verified: b.verified ?? false,
    productCount: b.productCount ?? b.product_count ?? 0,
  };
}

/**
 * Helper to fetch all products for the seller across local storage and live backend
 */
async function getSellerProductsForCatalog(cleanId) {
  const sellerId = `seller_${cleanId}`;
  const numSellerId = Number(cleanId);

  const localList = db.getSellerProducts(cleanId) || [];
  const generalList = (db.getProducts() || []).filter((p) => {
    if (!p) return false;
    if (typeof p.id === 'string' && /^prod_\d+$/i.test(p.id)) return false;
    const pSellerId = String(p.sellerId || p.vendorId || '').toLowerCase().trim();
    const pClean = pSellerId.replace(/^seller_/, '');
    const pNum = Number(pClean) || Number(p.vendorId || 0);
    return (
      pSellerId === sellerId.toLowerCase() ||
      pSellerId === cleanId.toLowerCase() ||
      pClean === cleanId.toLowerCase() ||
      (numSellerId > 0 && pNum === numSellerId)
    );
  });

  let backendList = [];
  if (!USE_MOCK_API && canAccessSellerApi('/api/seller/products')) {
    try {
      const response = await apiClient.get('/api/seller/products', { timeout: 6000 });
      const rawData = response?.data?.data || response?.data;
      const prods = Array.isArray(rawData) ? rawData : (rawData?.products || []);
      backendList = prods.filter((p) => {
        if (!p) return false;
        if (typeof p.id === 'string' && /^prod_\d+$/i.test(p.id)) return false;
        const pSellerId = String(p.sellerId || p.vendorId || '').toLowerCase().trim();
        const pClean = pSellerId.replace(/^seller_/, '');
        const pNum = Number(pClean) || Number(p.vendorId || 0);
        return (
          pSellerId === sellerId.toLowerCase() ||
          pSellerId === cleanId.toLowerCase() ||
          pClean === cleanId.toLowerCase() ||
          (numSellerId > 0 && pNum === numSellerId)
        );
      });
    } catch (_) {}
  }

  const allMap = new Map();
  generalList.forEach((p) => allMap.set(String(p.id || p.productId || p.title), p));
  localList.forEach((p) => allMap.set(String(p.id || p.productId || p.title), p));
  backendList.forEach((p) => allMap.set(String(p.id || p.productId || p.title), p));
  return Array.from(allMap.values());
}

export const categoryService = {
  /**
   * 1. GET /api/categories (Global Marketplace + Seller Categories)
   * Returns Admin-created global marketplace categories merged with seller-specific categories.
   */
  async getCategories(options = { includeSubcategories: true }) {
    const currentSeller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = rawSellerId ? String(rawSellerId).replace(/^seller_/, '').trim() : '';
    const sellerId = cleanId ? `seller_${cleanId}` : '';
    const numSellerId = cleanId ? Number(cleanId) : 0;

    // 1. Fetch seller-isolated local repository
    const localCats = cleanId ? (db.getSellerCategories(cleanId) || []) : [];
    const localSubs = cleanId ? (db.getSellerSubcategories(cleanId) || []) : [];

    // 2. Fetch seller's products (live backend + local storage)
    const sellerProducts = cleanId ? await getSellerProductsForCatalog(cleanId) : [];

    // 3. Fetch backend categories (Admin marketplace categories + seller-owned categories)
    let backendCats = [];
    let allBackendSubs = [];

    if (!USE_MOCK_API) {
      try {
        const catResponse = await apiClient.get('/api/categories', {
          params: { includeSubcategories: options.includeSubcategories ?? true, page: 1, limit: 250 },
          timeout: 8000,
        });

        const rawCats = Array.isArray(catResponse.data)
          ? catResponse.data
          : Array.isArray(catResponse.data?.data)
          ? catResponse.data.data
          : Array.isArray(catResponse.data?.categories)
          ? catResponse.data.categories
          : Array.isArray(catResponse.data?.data?.categories)
          ? catResponse.data.data.categories
          : (catResponse.data?.data || catResponse.data?.categories || []);

        backendCats = (rawCats || [])
          .filter((c) => {
            if (!c) return false;
            const cSellerId = String(c.sellerId || c.seller_id || c.vendorId || c.vendor_id || '').toLowerCase().trim();
            // Admin categories have no sellerId, or are marked global, admin, system, 0
            const isGlobalOrAdmin = !cSellerId || cSellerId === 'admin' || cSellerId === 'system' || cSellerId === '0' || cSellerId === 'null' || cSellerId === 'undefined' || Boolean(c.isGlobal) || Boolean(c.is_global);
            if (isGlobalOrAdmin) return true;
            if (!sellerId && !cleanId) return false;
            const cClean = cSellerId.replace(/^seller_/, '');
            const cNum = Number(cClean);
            return (
              cSellerId === sellerId.toLowerCase() ||
              cSellerId === cleanId.toLowerCase() ||
              cClean === cleanId.toLowerCase() ||
              (numSellerId > 0 && cNum === numSellerId)
            );
          })
          .map((c) => normalizeCategory(c));
      } catch (apiError) {
        console.warn('API getCategories error, using seller store:', apiError?.message);
      }

      // Also fetch live subcategories to populate category.subcategories if not already joined by backend
      if (options.includeSubcategories) {
        try {
          const subResponse = await apiClient.get('/api/subcategories', { params: { limit: 500 }, timeout: 8000 });
          const rawSubList = Array.isArray(subResponse.data)
            ? subResponse.data
            : Array.isArray(subResponse.data?.data)
            ? subResponse.data.data
            : Array.isArray(subResponse.data?.subcategories)
            ? subResponse.data.subcategories
            : Array.isArray(subResponse.data?.data?.subcategories)
            ? subResponse.data.data.subcategories
            : [];
          allBackendSubs = rawSubList.map((s) => normalizeSubcategory(s)).filter(Boolean);
        } catch (_) {}
      }
    }

    // Build subcategory map for categories
    const subMap = {};
    for (const sub of localSubs) {
      const pId = String(sub.categoryId ?? sub.category_id ?? '');
      if (pId) {
        if (!subMap[pId]) subMap[pId] = [];
        subMap[pId].push(sub);
      }
    }
    for (const sub of allBackendSubs) {
      const pId = String(sub.categoryId ?? sub.category_id ?? '');
      if (pId) {
        if (!subMap[pId]) subMap[pId] = [];
        const subIdStr = String(sub.id || sub.subcategoryId);
        if (!subMap[pId].some((es) => String(es.id || es.subcategoryId) === subIdStr)) {
          subMap[pId].push(sub);
        }
      }
    }

    const mergedMap = new Map();

    // 1. Backend categories (Admin marketplace categories + backend seller categories)
    backendCats.forEach((c) => {
      const catIdStr = String(c.categoryId ?? c.id);
      const existingSubs = Array.isArray(c.subcategories) ? c.subcategories : [];
      const extraSubs = subMap[catIdStr] || [];
      const combinedSubs = [...existingSubs];
      extraSubs.forEach((es) => {
        const esId = String(es.id || es.subcategoryId);
        if (!combinedSubs.some((s) => String(s.id || s.subcategoryId) === esId)) {
          combinedSubs.push(es);
        }
      });
      const norm = normalizeCategory({ ...c, subcategories: combinedSubs });
      mergedMap.set(catIdStr, norm);
    });

    // 2. Local seller categories
    localCats.forEach((c) => {
      const catIdStr = String(c.id || c.categoryId);
      const attachedSubs = subMap[catIdStr] || c.subcategories || [];
      const norm = normalizeCategory({ ...c, subcategories: attachedSubs, sellerId });
      mergedMap.set(catIdStr, norm);
    });

    // Auto-populate from seller's products & persist in seller store
    sellerProducts.forEach((p, idx) => {
      const catName = p.categoryName || p.category;
      if (catName && catName !== 'Category') {
        const catId = p.categoryId || `cat_s_${catName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        const catIdStr = String(catId);
        const existingByName = Array.from(mergedMap.values()).find(
          (c) => c.name.toLowerCase() === catName.toLowerCase()
        );
        if (!existingByName && !mergedMap.has(catIdStr)) {
          const subs = [];
          const subName = p.subcategoryName || p.subcategory;
          if (subName && subName !== 'Subcategory') {
            subs.push({
              id: p.subcategoryId || `sub_s_${idx + 1}`,
              subcategoryId: p.subcategoryId || idx + 1,
              name: subName,
              slug: subName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              categoryId: catId,
              brands: p.brandName || p.brand ? [p.brandName || p.brand] : [],
            });
          }
          const norm = normalizeCategory({
            id: catId,
            categoryId: catId,
            name: catName,
            title: catName,
            slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            imageUrl: null,
            active: true,
            status: 'Active',
            productCount: 1,
            subcategories: subs,
            sellerId,
          });
          mergedMap.set(catIdStr, norm);
          db.createSellerCategory(cleanId, norm);
        } else if (existingByName) {
          // Increment product count
          existingByName.productCount = (existingByName.productCount || 0) + 1;
        }
      }
    });

    await delay(30);
    return Array.from(mergedMap.values());
  },

  /**
   * 2. GET /api/subcategories (Global Marketplace + Seller Subcategories)
   */
  async getSubcategories(categoryId = null) {
    const currentSeller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = rawSellerId ? String(rawSellerId).replace(/^seller_/, '').trim() : '';
    const sellerId = cleanId ? `seller_${cleanId}` : '';
    const numSellerId = cleanId ? Number(cleanId) : 0;

    const localSubs = cleanId ? (db.getSellerSubcategories(cleanId, categoryId) || []) : [];
    const sellerProducts = cleanId ? await getSellerProductsForCatalog(cleanId) : [];

    let backendSubs = [];
    if (!USE_MOCK_API) {
      try {
        const catParam = categoryId && categoryId !== 'ALL' ? String(categoryId).replace(/^cat_/, '') : null;
        const params = { 
          page: 1, 
          limit: 500, 
          ...(catParam ? { categoryId: catParam, category_id: catParam } : {}) 
        };
        const response = await apiClient.get('/api/subcategories', { params, timeout: 8000 });
        const rawList = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data?.subcategories)
          ? response.data.subcategories
          : Array.isArray(response.data?.data?.subcategories)
          ? response.data.data.subcategories
          : Array.isArray(response.data?.items)
          ? response.data.items
          : (response.data?.data || response.data?.subcategories || []);

        backendSubs = (rawList || [])
          .filter((s) => {
            if (!s) return false;
            const sSellerId = String(s.sellerId || s.seller_id || s.vendorId || s.vendor_id || '').toLowerCase().trim();
            const isGlobalOrAdmin = !sSellerId || sSellerId === 'admin' || sSellerId === 'system' || sSellerId === '0' || sSellerId === 'null' || sSellerId === 'undefined' || Boolean(s.isGlobal) || Boolean(s.is_global);
            if (isGlobalOrAdmin) return true;
            if (!sellerId && !cleanId) return false;
            const sClean = sSellerId.replace(/^seller_/, '');
            const sNum = Number(sClean);
            return (
              sSellerId === sellerId.toLowerCase() ||
              sSellerId === cleanId.toLowerCase() ||
              sClean === cleanId.toLowerCase() ||
              (numSellerId > 0 && sNum === numSellerId)
            );
          })
          .map((s) => normalizeSubcategory(s))
          .filter(Boolean);
      } catch (apiError) {
        console.warn('API getSubcategories notice:', apiError?.message);
      }
    }

    const mergedMap = new Map();

    backendSubs.forEach((s) => {
      const norm = normalizeSubcategory(s);
      mergedMap.set(String(norm.id), norm);
    });

    localSubs.forEach((s) => {
      const subIdStr = String(s.id || s.subcategoryId);
      mergedMap.set(subIdStr, normalizeSubcategory({ ...s, sellerId }));
    });

    // Auto-populate from seller's products & persist in seller store
    sellerProducts.forEach((p, idx) => {
      const subName = p.subcategoryName || p.subcategory;
      if (subName && subName !== 'Subcategory') {
        const subId = p.subcategoryId || `sub_s_${subName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        const subIdStr = String(subId);
        const existingByName = Array.from(mergedMap.values()).find(
          (s) => s.name.toLowerCase() === subName.toLowerCase()
        );
        if (!existingByName && !mergedMap.has(subIdStr)) {
          const norm = normalizeSubcategory({
            id: subId,
            subcategoryId: subId,
            categoryId: p.categoryId || null,
            categoryName: p.categoryName || p.category || '',
            name: subName,
            title: subName,
            slug: subName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            imageUrl: null,
            active: true,
            status: 'Active',
            productCount: 1,
            sellerId,
          });
          mergedMap.set(subIdStr, norm);
          db.createSellerSubcategory(cleanId, norm);
        } else if (existingByName) {
          existingByName.productCount = (existingByName.productCount || 0) + 1;
        }
      }
    });

    await delay(30);
    let result = Array.from(mergedMap.values());
    if (categoryId && categoryId !== 'ALL') {
      const cleanTargetId = String(categoryId).replace(/^cat_/, '').trim().toLowerCase();
      result = result.filter((s) => {
        const sCatId = String(s.categoryId ?? s.category_id ?? '').replace(/^cat_/, '').trim().toLowerCase();
        const sCatName = String(s.categoryName || s.category_name || '').trim().toLowerCase();
        return sCatId === cleanTargetId || (sCatName && sCatName === cleanTargetId);
      });
    }
    return result;
  },

  /**
   * 2b. Fetch ALL seller subcategories
   */
  async getAllSubcategories() {
    return this.getSubcategories(null);
  },

  /**
   * 3. GET /api/brands (Global Marketplace + Seller Brands)
   */
  async getBrands(options = {}) {
    const { subcategoryId, categoryId, active } = typeof options === 'object' && options !== null
      ? options
      : { subcategoryId: options };

    const currentSeller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = rawSellerId ? String(rawSellerId).replace(/^seller_/, '').trim() : '';
    const sellerId = cleanId ? `seller_${cleanId}` : '';
    const numSellerId = cleanId ? Number(cleanId) : 0;

    const localBrands = cleanId ? (db.getSellerBrands(cleanId, { subcategoryId, categoryId }) || []) : [];
    const sellerProducts = cleanId ? await getSellerProductsForCatalog(cleanId) : [];

    let backendBrands = [];
    if (!USE_MOCK_API) {
      try {
        const cleanSubId = subcategoryId && subcategoryId !== 'ALL' ? String(subcategoryId).replace(/^sub_/, '') : null;
        const cleanCatId = categoryId && categoryId !== 'ALL' ? String(categoryId).replace(/^cat_/, '') : null;
        const params = { 
          page: 1, 
          limit: 500,
          ...(cleanSubId ? { subcategoryId: cleanSubId, subcategory_id: cleanSubId } : {}),
          ...(cleanCatId ? { categoryId: cleanCatId, category_id: cleanCatId } : {}),
          ...(active !== undefined ? { active } : {}),
        };

        const response = await apiClient.get('/api/brands', { params, timeout: 8000 });
        const rawList = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data?.brands)
          ? response.data.brands
          : Array.isArray(response.data?.data?.brands)
          ? response.data.data.brands
          : Array.isArray(response.data?.items)
          ? response.data.items
          : (response.data?.data || response.data?.brands || []);

        backendBrands = (rawList || [])
          .filter((b) => {
            if (!b) return false;
            const bSellerId = String(b.sellerId || b.seller_id || b.vendorId || b.vendor_id || '').toLowerCase().trim();
            const isGlobalOrAdmin = !bSellerId || bSellerId === 'admin' || bSellerId === 'system' || bSellerId === '0' || bSellerId === 'null' || bSellerId === 'undefined' || Boolean(b.isGlobal) || Boolean(b.is_global);
            if (isGlobalOrAdmin) return true;
            if (!sellerId && !cleanId) return false;
            const bClean = bSellerId.replace(/^seller_/, '');
            const bNum = Number(bClean);
            return (
              bSellerId === sellerId.toLowerCase() ||
              bSellerId === cleanId.toLowerCase() ||
              bClean === cleanId.toLowerCase() ||
              (numSellerId > 0 && bNum === numSellerId)
            );
          })
          .map((b) => normalizeBrand(b))
          .filter(Boolean);
      } catch (apiError) {
        console.warn('API getBrands notice:', apiError?.message);
      }
    }

    const mergedMap = new Map();

    backendBrands.forEach((b) => {
      const norm = normalizeBrand(b);
      mergedMap.set(String(norm.id), norm);
    });

    localBrands.forEach((b) => {
      const brandIdStr = String(b.id || b.brandId);
      mergedMap.set(brandIdStr, normalizeBrand({ ...b, sellerId }));
    });

    // Auto-populate from seller's products & persist in seller store
    sellerProducts.forEach((p, idx) => {
      const bName = p.brandName || p.brand;
      if (bName && bName !== 'Brand') {
        const brandId = p.brandId || `brand_s_${bName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        const brandIdStr = String(brandId);
        const existingByName = Array.from(mergedMap.values()).find(
          (b) => b.name.toLowerCase() === bName.toLowerCase()
        );
        if (!existingByName && !mergedMap.has(brandIdStr)) {
          const norm = normalizeBrand({
            id: brandId,
            brandId: brandId,
            name: bName,
            brandName: bName,
            slug: bName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            categoryId: p.categoryId || null,
            categoryName: p.categoryName || p.category || '',
            subcategoryId: p.subcategoryId || null,
            subcategoryName: p.subcategoryName || p.subcategory || '',
            imageUrl: null,
            active: true,
            status: 'Active',
            productCount: 1,
            sellerId,
          });
          mergedMap.set(brandIdStr, norm);
          db.createSellerBrand(cleanId, norm);
        } else if (existingByName) {
          existingByName.productCount = (existingByName.productCount || 0) + 1;
        }
      }
    });

    await delay(30);
    let result = Array.from(mergedMap.values());
    if (subcategoryId && subcategoryId !== 'ALL') {
      const targetSub = String(subcategoryId).replace(/^sub_/, '').trim().toLowerCase();
      result = result.filter((b) => {
        const itemSubId = String(b.subcategoryId ?? b.subcategory_id ?? '').replace(/^sub_/, '').trim().toLowerCase();
        const itemSubName = String(b.subcategoryName || b.subcategory_name || '').trim().toLowerCase();
        return itemSubId === targetSub || (itemSubName && itemSubName === targetSub);
      });
    }
    if (categoryId && categoryId !== 'ALL') {
      const targetCat = String(categoryId).replace(/^cat_/, '').trim().toLowerCase();
      result = result.filter((b) => {
        const itemCatId = String(b.categoryId ?? b.category_id ?? '').replace(/^cat_/, '').trim().toLowerCase();
        const itemCatName = String(b.categoryName || b.category_name || '').trim().toLowerCase();
        return itemCatId === targetCat || (itemCatName && itemCatName === targetCat);
      });
    }
    return result;
  },

  /**
   * 3b. Fetch ALL seller brands
   */
  async getAllBrands() {
    return this.getBrands({ subcategoryId: null, active: undefined });
  },

  /**
   * 4. Get category by ID / Slug
   */
  async getCategoryById(id) {
    if (!id) return null;
    const cats = await this.getCategories();
    return cats.find(c => String(c.id) === String(id) || String(c.categoryId) === String(id) || c.slug === String(id)) || null;
  },

  /**
   * 5. Get dynamic spec schema
   */
  async getCategorySpecSchema(id) {
    const cat = await this.getCategoryById(id);
    return cat?.specFields || [];
  },

  /**
   * 6. POST /api/brands (Inline Brand Creation / Quick-Add)
   * Dispatches to Backend API with automatic 409 conflict ID resolution and seller store sync
   */
  async createBrand(brandData) {
    const currentSeller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = String(rawSellerId).replace(/^seller_/, '');
    const sellerId = cleanId ? `seller_${cleanId}` : '';
    const name = brandData.name?.trim() || brandData.brandName?.trim() || '';

    let catId = Number(brandData.categoryId);
    let subId = Number(brandData.subcategoryId);

    // Auto-resolve missing categoryId or subcategoryId from seller store
    if (!catId || isNaN(catId)) {
      const sellerCats = db.getSellerCategories(cleanId);
      catId = Number(sellerCats[0]?.id || sellerCats[0]?.categoryId || 61);
    }
    if (!subId || isNaN(subId)) {
      const sellerSubs = db.getSellerSubcategories(cleanId, catId);
      subId = Number(sellerSubs[0]?.id || sellerSubs[0]?.subcategoryId || 110);
    }

    const payload = {
      name,
      brandName: name,
      slug: brandData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      subcategoryId: subId,
      subcategoryName: brandData.subcategoryName || '',
      categoryId: catId,
      categoryName: brandData.categoryName || '',
      logoUrl: brandData.logoUrl || brandData.imageUrl || null,
      imageUrl: brandData.imageUrl || brandData.logoUrl || null,
      website: brandData.website || '',
      sortOrder: Number(brandData.sortOrder || 1),
      active: brandData.active !== undefined ? brandData.active : true,
      sellerId,
      vendorId: sellerId,
      status: 'Pending Approval',
    };

    let realBrandId = null;
    let createdItem = null;

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.post('/api/brands', payload);
        createdItem = response.data?.data || response.data;
        realBrandId = Number(createdItem?.id || createdItem?.brandId);
      } catch (apiError) {
        if (apiError.response?.status === 409) {
          try {
            // Conflict resolution: Look up real existing brand ID from backend
            const allBrandsRes = await apiClient.get('/api/brands', {
              params: { search: payload.name, limit: 100 },
              timeout: 4000,
            });
            const allBrands = Array.isArray(allBrandsRes.data)
              ? allBrandsRes.data
              : (allBrandsRes.data?.data || allBrandsRes.data?.brands || []);
            const existing = allBrands.find(
              b => (b.name || b.brandName || '').toLowerCase() === payload.name.toLowerCase() ||
                   (b.slug || '').toLowerCase() === payload.slug.toLowerCase()
            );
            if (existing) {
              realBrandId = Number(existing.id || existing.brandId);
              createdItem = existing;
            }
          } catch (_) {}
        }
      }
    }

    const finalId = realBrandId || Number(createdItem?.id || createdItem?.brandId) || (Math.floor(Date.now() % 1000000) + 3000);
    const localSaved = db.createSellerBrand(cleanId, {
      ...payload,
      id: finalId,
      brandId: finalId,
    });

    return normalizeBrand(localSaved);
  },

  /**
   * 7. POST /api/categories (Create New Catalog Category)
   * Dispatches to Backend API with automatic 409 conflict ID resolution and seller store sync
   */
  async createCategory(categoryData) {
    const currentSeller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = String(rawSellerId).replace(/^seller_/, '');
    const sellerId = cleanId ? `seller_${cleanId}` : '';
    const title = categoryData.name?.trim() || categoryData.title?.trim() || '';

    const payload = {
      name: title,
      title: title,
      slug: categoryData.slug?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sortOrder: Number(categoryData.sortOrder ?? categoryData.displayOrder ?? 0),
      displayOrder: Number(categoryData.displayOrder ?? categoryData.sortOrder ?? 0),
      description: categoryData.description?.trim() || '',
      imageUrl: categoryData.imageUrl?.trim() || null,
      active: categoryData.active !== undefined ? categoryData.active : true,
      sellerId,
      vendorId: sellerId,
      status: 'Pending Approval',
    };

    let realCatId = null;
    let createdItem = null;

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.post('/api/categories', payload);
        createdItem = response.data?.data || response.data;
        realCatId = Number(createdItem?.id || createdItem?.categoryId);
      } catch (apiError) {
        if (apiError.response?.status === 409) {
          try {
            // Conflict resolution: Look up real existing category ID from backend
            const allCatsRes = await apiClient.get('/api/categories', { params: { limit: 1000 } });
            const allCats = Array.isArray(allCatsRes.data)
              ? allCatsRes.data
              : (allCatsRes.data?.data || allCatsRes.data?.categories || []);
            const existing = allCats.find(
              c => (c.name || c.title || '').toLowerCase() === payload.name.toLowerCase() ||
                   (c.slug || '').toLowerCase() === payload.slug.toLowerCase()
            );
            if (existing) {
              realCatId = Number(existing.id || existing.categoryId);
              createdItem = existing;
            }
          } catch (_) {}
        }
      }
    }

    const finalId = realCatId || Number(createdItem?.id || createdItem?.categoryId) || (Math.floor(Date.now() % 1000000) + 1000);
    const localSaved = db.createSellerCategory(cleanId, {
      ...payload,
      id: finalId,
      categoryId: finalId,
    });

    return normalizeCategory(localSaved);
  },

  /**
   * 8. POST /api/subcategories (Create New Subcategory)
   * Dispatches to Backend API with automatic 409 conflict ID resolution and seller store sync
   */
  async createSubcategory(subData) {
    const currentSeller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = String(rawSellerId).replace(/^seller_/, '');
    const sellerId = cleanId ? `seller_${cleanId}` : '';
    const name = subData.name?.trim() || subData.title?.trim() || '';

    let catId = Number(subData.categoryId);
    if (!catId || isNaN(catId)) {
      const sellerCats = db.getSellerCategories(cleanId);
      catId = Number(sellerCats[0]?.id || sellerCats[0]?.categoryId || 61);
    }

    const payload = {
      name,
      title: name,
      categoryId: catId,
      categoryName: subData.categoryName || '',
      slug: subData.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sortOrder: Number(subData.sortOrder || 0),
      imageUrl: subData.imageUrl?.trim() || null,
      active: subData.active !== false,
      sellerId,
      vendorId: sellerId,
      status: 'Pending Approval',
    };

    let realSubId = null;
    let createdItem = null;

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.post('/api/subcategories', payload);
        createdItem = response.data?.data || response.data;
        realSubId = Number(createdItem?.id || createdItem?.subcategoryId);
      } catch (apiError) {
        if (apiError.response?.status === 409) {
          try {
            // Conflict resolution: Look up real existing subcategory ID from backend
            const allSubsRes = await apiClient.get('/api/subcategories', { params: { limit: 1000 } });
            const allSubs = Array.isArray(allSubsRes.data)
              ? allSubsRes.data
              : (allSubsRes.data?.data || allSubsRes.data?.subcategories || []);
            const existing = allSubs.find(
              s => (s.name || s.title || '').toLowerCase() === payload.name.toLowerCase() ||
                   (s.slug || '').toLowerCase() === payload.slug.toLowerCase()
            );
            if (existing) {
              realSubId = Number(existing.id || existing.subcategoryId);
              createdItem = existing;
            }
          } catch (_) {}
        }
      }
    }

    const finalId = realSubId || Number(createdItem?.id || createdItem?.subcategoryId) || (Math.floor(Date.now() % 1000000) + 2000);
    const localSaved = db.createSellerSubcategory(cleanId, {
      ...payload,
      id: finalId,
      subcategoryId: finalId,
    });

    return normalizeSubcategory(localSaved);
  },

  /**
   * 9. PUT /api/categories/:id (Update Category)
   */
  async updateCategory(id, categoryData) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const sellerId = String(rawSellerId);
    const title = categoryData.name?.trim() || categoryData.title?.trim() || '';

    const payload = {
      name: title,
      title: title,
      slug: categoryData.slug?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sortOrder: Number(categoryData.sortOrder ?? categoryData.displayOrder ?? 0),
      displayOrder: Number(categoryData.displayOrder ?? categoryData.sortOrder ?? 0),
      description: categoryData.description?.trim() || '',
      imageUrl: categoryData.imageUrl?.trim() || null,
      active: categoryData.active !== undefined ? categoryData.active : true,
    };

    if (!USE_MOCK_API) {
      try {
        await apiClient.put(`/api/categories/${id}`, payload);
      } catch (apiError) {
        console.warn('API updateCategory notice:', apiError?.response?.data || apiError.message);
      }
    }

    const localUpdated = db.updateSellerCategory(sellerId, id, payload);
    return normalizeCategory(localUpdated);
  },

  /**
   * 10. DELETE /api/categories/:id (Delete Category)
   */
  async deleteCategory(id) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = String(rawSellerId).replace(/^seller_/, '');

    if (!USE_MOCK_API) {
      try {
        await apiClient.delete(`/api/categories/${id}`);
      } catch (apiError) {
        console.warn('API deleteCategory notice:', apiError?.response?.data || apiError.message);
      }
    }

    db.deleteSellerCategory(cleanId, id);
    return true;
  },

  /**
   * 11. PUT /api/subcategories/:id (Update Subcategory)
   */
  async updateSubcategory(id, subData) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = String(rawSellerId).replace(/^seller_/, '');
    const name = subData.name?.trim() || subData.title?.trim() || '';

    const payload = {
      name,
      title: name,
      categoryId: Number(subData.categoryId) || null,
      categoryName: subData.categoryName || '',
      slug: subData.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sortOrder: Number(subData.sortOrder || 0),
      imageUrl: subData.imageUrl?.trim() || null,
      active: subData.active !== false,
    };

    if (!USE_MOCK_API) {
      try {
        await apiClient.put(`/api/subcategories/${id}`, payload);
      } catch (apiError) {
        console.warn('API updateSubcategory notice:', apiError?.response?.data || apiError.message);
      }
    }

    const localUpdated = db.updateSellerSubcategory(cleanId, id, payload);
    return normalizeSubcategory(localUpdated);
  },

  /**
   * 12. DELETE /api/subcategories/:id (Delete Subcategory)
   */
  async deleteSubcategory(id) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = String(rawSellerId).replace(/^seller_/, '');

    if (!USE_MOCK_API) {
      try {
        await apiClient.delete(`/api/subcategories/${id}`);
      } catch (apiError) {
        console.warn('API deleteSubcategory notice:', apiError?.response?.data || apiError.message);
      }
    }

    db.deleteSellerSubcategory(cleanId, id);
    return true;
  },

  /**
   * 13. PUT /api/brands/:id (Update Brand)
   */
  async updateBrand(id, brandData) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = String(rawSellerId).replace(/^seller_/, '');
    const name = brandData.name?.trim() || brandData.brandName?.trim() || '';

    const payload = {
      name,
      brandName: name,
      slug: brandData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      categoryId: Number(brandData.categoryId) || null,
      categoryName: brandData.categoryName || '',
      subcategoryId: Number(brandData.subcategoryId) || null,
      subcategoryName: brandData.subcategoryName || '',
      imageUrl: brandData.imageUrl || null,
      sortOrder: Number(brandData.sortOrder || 1),
      active: brandData.active !== undefined ? brandData.active : true,
    };

    if (!USE_MOCK_API) {
      try {
        await apiClient.put(`/api/brands/${id}`, payload);
      } catch (apiError) {
        console.warn('API updateBrand notice:', apiError?.response?.data || apiError.message);
      }
    }

    const localUpdated = db.updateSellerBrand(cleanId, id, payload);
    return normalizeBrand(localUpdated);
  },

  /**
   * 14. DELETE /api/brands/:id (Delete Brand)
   */
  async deleteBrand(id) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = String(rawSellerId).replace(/^seller_/, '');

    if (!USE_MOCK_API) {
      try {
        await apiClient.delete(`/api/brands/${id}`);
      } catch (apiError) {
        console.warn('API deleteBrand notice:', apiError?.response?.data || apiError.message);
      }
    }

    db.deleteSellerBrand(cleanId, id);
    return true;
  },

  /**
   * 15. POST /api/seller/category-requests (Submit Official Category Request to Admin)
   */
  async submitCategoryRequest(requestData) {
    const catName = requestData.categoryName || requestData.name || '';
    const payload = {
      name: catName,
      categoryName: catName,
      description: requestData.description || '',
    };

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.post('/api/seller/category-requests', payload);
        return response.data?.data || response.data;
      } catch (err) {
        console.warn('API submitCategoryRequest notice:', err?.response?.data || err.message);
      }
    }

    await delay(200);
    return {
      success: true,
      requestId: `req_${Date.now()}`,
      ...payload,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * 16. GET /api/seller/category-requests (List My Category Requests)
   */
  async getCategoryRequests() {
    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.get('/api/seller/category-requests');
        const list = response.data?.data || response.data;
        if (Array.isArray(list)) return list;
      } catch (err) {
        // Fallback
      }
    }

    await delay(150);
    return [];
  },
};
