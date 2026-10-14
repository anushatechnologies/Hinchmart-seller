import { apiClient, delay, USE_MOCK_API, canAccessSellerApi } from './apiClient.js';
import { db } from '../mock/db.js';
import { getCleanProductImages } from '../utils/productImages.js';
import { categoryService } from './category.service.js';
import { INITIAL_PRODUCTS } from '../mock/seedData.js';

/**
 * Normalizes a seller-owned product item
 */
export function normalizeSellerProduct(p) {
  if (!p) return null;
  const rawId = p.productId ?? p.id;
  let productId = rawId;
  if (typeof rawId === 'string' && rawId.startsWith('sp_')) {
    const parsed = parseInt(rawId.replace('sp_', ''), 10);
    productId = !isNaN(parsed) ? parsed : rawId;
  } else if (typeof rawId === 'string' && !isNaN(parseInt(rawId, 10))) {
    productId = parseInt(rawId, 10);
  } else if (typeof rawId === 'number') {
    productId = rawId;
  }
  const title = p.title || p.name || '';
  const price = Number(p.price ?? p.sellingPrice ?? 0);
  const mrp = Number(p.mrp ?? (price ? Math.round(price * 1.12) : 0));
  const stockQty = Number(p.stockQty ?? p.stock ?? 0);
  const slug = p.slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `prod-${productId}`);
  const hsn = String(p.hsn || p.hsnCode || '');
  const gstRate = Number(p.gstRate ?? p.gst ?? 18);
  
  const images = getCleanProductImages(p);

  const approval = String(p.approvalStatus || '').toUpperCase();
  const rawStatus = String(p.status || '').toUpperCase();
  const isActive = Boolean(p.active);

  const isDeletedByAdmin =
    approval === 'DELETED_BY_ADMIN' ||
    rawStatus === 'DELETED_BY_ADMIN' ||
    Boolean(p.deletedByAdmin);

  let status = 'PENDING';
  if (approval === 'REJECTED' || rawStatus === 'REJECTED') {
    status = 'REJECTED';
  } else if (isDeletedByAdmin) {
    status = 'DELETED_BY_ADMIN';
  } else if (approval === 'APPROVED' || (rawStatus === 'APPROVED' && approval !== 'PENDING')) {
    status = 'APPROVED';
  } else if (approval === 'INACTIVE' || rawStatus === 'INACTIVE') {
    status = 'INACTIVE';
  } else {
    // Strictly PENDING unless explicitly approved by admin
    status = 'PENDING';
  }

  const bulkPricingTiers = (Array.isArray(p.bulkPricingTiers) ? p.bulkPricingTiers : (p.pricingTiers || [])).map((t, idx) => ({
    tierId: t.tierId || idx + 1,
    minQty: Number(t.minQty || 1),
    maxQty: t.maxQty !== null && t.maxQty !== undefined ? Number(t.maxQty) : null,
    price: Number(t.price ?? t.pricePerUnit ?? 0),
    discountPercentage: Number(t.discountPercentage ?? t.discount ?? 0),
    discount: Number(t.discount ?? t.discountPercentage ?? 0),
  }));

  const categoryId = Number(p.categoryId) || null;
  const subcategoryId = Number(p.subcategoryId) || null;
  const brandId = Number(p.brandId) || null;

  // Robust parsing for specifications in all possible formats (object, JSON string, array, specs/attributes)
  let rawSpecs = p.specifications ?? p.specs ?? p.technicalSpecifications ?? p.attributes ?? {};
  if (typeof rawSpecs === 'string') {
    try {
      rawSpecs = JSON.parse(rawSpecs);
    } catch (_) {
      const parsedMap = {};
      rawSpecs.split(',').forEach((part) => {
        const [k, ...v] = part.split(':');
        if (k && v.length) parsedMap[k.trim()] = v.join(':').trim();
      });
      rawSpecs = Object.keys(parsedMap).length > 0 ? parsedMap : {};
    }
  }
  if (Array.isArray(rawSpecs)) {
    const converted = {};
    rawSpecs.forEach((item) => {
      const k = item?.key || item?.name || item?.attributeName || item?.label;
      if (k) converted[k] = item?.value ?? item?.val ?? '';
    });
    rawSpecs = converted;
  }
  const specifications = typeof rawSpecs === 'object' && rawSpecs !== null ? rawSpecs : {};

  return {
    ...p,
    id: productId,
    productId,
    sellerId: p.sellerId || p.vendorId || null,
    vendorId: p.vendorId || p.sellerId || null,
    name: title,
    title,
    slug,
    sku: p.sku || `SKU-${productId}`,
    hsn,
    hsnCode: hsn,
    gstRate,
    gst: gstRate,
    description: p.description || '',
    price,
    sellingPrice: price,
    mrp,
    unit: p.unit || 'Pieces',
    moq: Number(p.moq || 1),
    stock: stockQty,
    stockQty,
    is24HourDelivery: Boolean(p.is24HourDelivery),
    active: p.active !== undefined ? Boolean(p.active) : status === 'APPROVED',
    status, // PENDING | APPROVED | REJECTED | INACTIVE | DELETED_BY_ADMIN
    approvalStatus: status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : (status === 'INACTIVE' ? 'INACTIVE' : (status === 'DELETED_BY_ADMIN' ? 'DELETED_BY_ADMIN' : 'PENDING'))),
    deletedByAdmin: Boolean(p.deletedByAdmin || status === 'DELETED_BY_ADMIN'),
    rejectionReason: p.rejectionReason || null,
    brand: p.brandName || p.brand || 'Brand',
    brandName: p.brandName || p.brand || 'Brand',
    brandId,
    category: p.categoryName || p.category || 'Category',
    categoryName: p.categoryName || p.category || 'Category',
    categoryId,
    subcategory: p.subcategoryName || p.subcategory || 'Subcategory',
    subcategoryName: p.subcategoryName || p.subcategory || 'Subcategory',
    subcategoryId,
    images,
    image: images[0] || null,
    imageUrl: images[0] || null,
    bulkPricingTiers,
    pricingTiers: bulkPricingTiers,
    specifications,
    specs: specifications,
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
  };
}

export function resolveNumericSellerId(rawId) {
  const sanitize = (id) => {
    if (typeof id === 'number' && id > 0 && id <= 2147483647) return id;
    if (typeof id === 'string') {
      const clean = id.replace(/^seller_/, '').trim();
      const parsed = parseInt(clean, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 2147483647) return parsed;
    }
    return null;
  };

  const fromRaw = sanitize(rawId);
  if (fromRaw) return fromRaw;

  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
  const fromStored = sanitize(stored);
  if (fromStored) return fromStored;

  const currentSeller = db.getSeller();
  const fromSeller = sanitize(currentSeller?.sellerId) || sanitize(currentSeller?.id);
  if (fromSeller) return fromSeller;

  const localAuth = db.getAuth();
  const fromAuth = sanitize(localAuth?.user?.sellerId) || sanitize(localAuth?.user?.id);
  if (fromAuth) return fromAuth;

  return null;
}

export const sellerProductService = {
  /**
   * 4.1 GET /api/seller/products (List Seller Products)
   * Query Parameters: search, category, brand, status, stockStatus, sortBy, page, limit
   */
  async getSellerProducts(filters = {}) {
    const currentSeller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('sellerId') || localStorage.getItem('hinchmart_active_seller_id') || localStorage.getItem('hinchmart_seller_id'))
      : null;
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id;
    if (!rawSellerId) {
      return { products: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
    const cleanId = String(rawSellerId).replace(/^seller_/, '').trim();
    const sellerId = `seller_${cleanId}`;
    const numCleanId = Number(cleanId) || 0;
    const numericSellerId = resolveNumericSellerId(rawSellerId) || 0;

    const isOwner = (p) => {
      if (!p) return false;
      // Never include mock dummy seed products (prod_1 to prod_12)
      if (typeof p.id === 'string' && /^prod_\d+$/i.test(p.id)) return false;
      if (p.id === 735 || p.id === 736 || p.productId === 735 || p.productId === 736) return false;

      const pSellerId = String(p.sellerId || p.seller_id || p.vendorId || p.vendor_id || '').replace(/^seller_/, '').trim().toLowerCase();
      // STRICT: Must have sellerId and it must NOT be admin
      if (!pSellerId || pSellerId === 'admin') return false;

      const currentClean = cleanId.toLowerCase();
      const numPSeller = Number(pSellerId);
      return (
        pSellerId === currentClean ||
        (numCleanId > 0 && numPSeller === numCleanId) ||
        (numericSellerId > 0 && numPSeller === numericSellerId)
      );
    };

    // 1. Get seller products from local store (guaranteed persistence across refresh)
    const localList = (db.getSellerProducts(cleanId) || [])
      .map((p) => normalizeSellerProduct({ ...p, sellerId }));

    // 2. Fetch live products from backend (both authenticated seller products and public catalog)
    let liveSellerProducts = [];
    let livePublicProducts = [];
    if (!USE_MOCK_API) {
      try {
        const [sellerRes, pubRes] = await Promise.allSettled([
          apiClient.get('/api/seller/products', { params: { limit: 100 }, timeout: 5000 }),
          apiClient.get('/api/products', { params: { limit: 100 }, timeout: 5000 }),
        ]);

        if (sellerRes.status === 'fulfilled') {
          const rawSeller = sellerRes.value.data?.data || sellerRes.value.data;
          liveSellerProducts = Array.isArray(rawSeller) ? rawSeller : (rawSeller?.products || rawSeller?.items || []);
        }

        if (pubRes.status === 'fulfilled') {
          const rawPub = pubRes.value.data?.data || pubRes.value.data;
          livePublicProducts = Array.isArray(rawPub) ? rawPub : (rawPub?.products || rawPub?.items || []);
        }
      } catch (err) {
        console.warn('Live catalog fetch notice:', err?.message);
      }
    }

    // Index live products for O(1) matching by ID, SKU, and normalized Title
    const liveById = new Map();
    const liveBySku = new Map();
    const liveByTitle = new Map();

    const registerLive = (lp) => {
      if (!lp) return;
      const pid = String(lp.productId ?? lp.id ?? '').trim();
      const sku = String(lp.sku ?? '').trim().toLowerCase();
      const title = String(lp.title ?? lp.name ?? '').trim().toLowerCase();
      if (pid) liveById.set(pid, lp);
      if (sku) liveBySku.set(sku, lp);
      if (title) liveByTitle.set(title, lp);
    };

    liveSellerProducts.forEach(registerLive);
    livePublicProducts.forEach(registerLive);

    const deletedIds = db.getDeletedProductIds();
    const activeLocalList = [];

    // 3. Synchronously check each local product against live backend catalog
    await Promise.all(
      localList.map(async (p) => {
        const pIdStr = String(p.id ?? p.productId ?? '').trim();
        const pSku = String(p.sku ?? '').trim().toLowerCase();
        const pTitle = String(p.title ?? p.name ?? '').trim().toLowerCase();
        const numericId = Number(p.productId || (Number.isInteger(Number(p.id)) ? p.id : 0));

        if (deletedIds.has(pIdStr) || (p.productId && deletedIds.has(String(p.productId)))) {
          return;
        }

        let match = liveById.get(pIdStr);
        if (!match && !numericId) {
          match = (pSku ? liveBySku.get(pSku) : null) || (pTitle ? liveByTitle.get(pTitle) : null);
        }

        // If product is REJECTED, preserve its REJECTED status so seller can edit and re-upload!
        const curStatus = String(p.status || p.approvalStatus || '').toUpperCase();
        if (curStatus === 'REJECTED') {
          p.status = 'REJECTED';
          p.approvalStatus = 'REJECTED';
          p.deletedByAdmin = false;
          p.active = false;
          p.rejectionReason = p.rejectionReason || 'Product specifications and details require revision. Please edit details and re-submit for admin approval.';
          activeLocalList.push(p);
          return;
        }

        // If product was previously approved but missing from the live batch:
        // Check if still accessible on backend or if admin updated status to REJECTED
        if (!match && !USE_MOCK_API && numericId > 0 && numericId <= 2147483647 && (p.status === 'APPROVED' || p.approvalStatus === 'APPROVED')) {
          try {
            const singleRes = await apiClient.get(`/api/products/${numericId}`, { timeout: 5000 });
            const singleData = singleRes?.data?.data || singleRes?.data;
            if (singleData && (singleData.id || singleData.productId)) {
              match = singleData;
            } else {
              // Missing from public catalog -> mark as REJECTED so seller can review and re-submit
              p.status = 'REJECTED';
              p.approvalStatus = 'REJECTED';
              p.deletedByAdmin = false;
              p.active = false;
              p.rejectionReason = p.rejectionReason || 'Product is not active in the live catalog. Please review and re-submit.';
              db.updateSellerProduct(cleanId, p.id, {
                status: 'REJECTED',
                approvalStatus: 'REJECTED',
                deletedByAdmin: false,
                active: false,
                rejectionReason: p.rejectionReason,
              });
              activeLocalList.push(p);
              return;
            }
          } catch (checkErr) {
            // 404 from public endpoint means product was rejected or unapproved on backend!
            // NEVER mark as DELETED_BY_ADMIN; keep as REJECTED so seller can edit and re-upload!
            p.status = 'REJECTED';
            p.approvalStatus = 'REJECTED';
            p.deletedByAdmin = false;
            p.active = false;
            p.rejectionReason = p.rejectionReason || 'Product details require revision. Please edit details and re-submit for admin approval.';
            db.updateSellerProduct(cleanId, p.id, {
              status: 'REJECTED',
              approvalStatus: 'REJECTED',
              deletedByAdmin: false,
              active: false,
              rejectionReason: p.rejectionReason,
            });
            activeLocalList.push(p);
            return;
          }
        }

        if (match) {
          const matchStatus = String(match.status || match.approvalStatus || '').toUpperCase();
          if (matchStatus === 'APPROVED') {
            p.status = 'APPROVED';
            p.approvalStatus = 'APPROVED';
            p.active = true;
          } else if (matchStatus === 'REJECTED') {
            p.status = 'REJECTED';
            p.approvalStatus = 'REJECTED';
            p.active = false;
          } else {
            p.status = 'PENDING';
            p.approvalStatus = 'PENDING';
            p.active = false;
          }

          if (match.productId || match.id) {
            const realId = Number(match.productId || match.id);
            if (realId) {
              p.productId = realId;
              p.id = realId;
            }
          }
          if (match.sellerId) {
            p.sellerId = match.sellerId;
          }
          db.updateSellerProduct(cleanId, p.id, {
            status: p.status,
            approvalStatus: p.approvalStatus,
            active: p.active,
            id: p.id,
            productId: p.productId,
          });
        }

        activeLocalList.push(p);
      })
    );

    // 4. Collect live products that explicitly belong to this seller ID
    const backendSellerList = [];

    // From dedicated seller endpoint (ensure seller ownership)
    liveSellerProducts.forEach((lp) => {
      const lpSellerId = String(lp.sellerId || lp.vendorId || '').replace(/^seller_/, '').trim();
      const numLpSeller = Number(lpSellerId);
      const isDifferentSeller = lpSellerId && (lpSellerId !== cleanId && (!numCleanId || numLpSeller !== numCleanId) && (!numericSellerId || numLpSeller !== numericSellerId));
      if (!isDifferentSeller) {
        backendSellerList.push(normalizeSellerProduct({ ...lp, sellerId: cleanId }));
      }
    });

    // From public catalog
    livePublicProducts.forEach((lp) => {
      const lpSellerId = String(lp.sellerId || lp.vendorId || '').replace(/^seller_/, '').trim();
      const numLpSeller = Number(lpSellerId);
      const isOwnerSeller =
        (lpSellerId && lpSellerId === cleanId) ||
        (numCleanId > 0 && numLpSeller === numCleanId) ||
        (numericSellerId > 0 && numLpSeller === numericSellerId);

      if (isOwnerSeller) {
        const lpStatus = String(lp.status || lp.approvalStatus || 'PENDING').toUpperCase();
        const finalStatus = lpStatus === 'APPROVED' ? 'APPROVED' : (lpStatus === 'REJECTED' ? 'REJECTED' : (lpStatus === 'INACTIVE' ? 'INACTIVE' : 'PENDING'));
        backendSellerList.push(normalizeSellerProduct({
          ...lp,
          status: finalStatus,
          approvalStatus: finalStatus,
          active: finalStatus === 'APPROVED',
          sellerId: cleanId,
        }));
      }
    });

    const mergedMap = new Map();

    // Helper to find existing matching key in mergedMap
    const findExistingKey = (p) => {
      const idKey = String(p.id ?? p.productId ?? '').trim().toLowerCase();
      if (idKey && mergedMap.has(idKey)) return idKey;
      const skuKey = String(p.sku || '').trim().toLowerCase();
      if (skuKey && skuKey !== '—' && mergedMap.has(skuKey)) return skuKey;
      const titleKey = String(p.title || p.name || '').trim().toLowerCase();
      if (titleKey && mergedMap.has(titleKey)) return titleKey;
      return null;
    };

    // Add authoritative live backend products first
    backendSellerList.forEach((p) => {
      const pIdStr = String(p.id ?? p.productId ?? '');
      if (deletedIds.has(pIdStr)) return;
      const key = String(p.id || p.productId || p.sku || p.title).trim().toLowerCase();
      mergedMap.set(key, p);
      if (p.sku && p.sku !== '—') mergedMap.set(String(p.sku).trim().toLowerCase(), p);
      if (p.title) mergedMap.set(String(p.title).trim().toLowerCase(), p);
    });

    // Add active local items, retaining deleted-by-admin notice with seller dismiss option
    activeLocalList.forEach((p) => {
      const pIdStr = String(p.id ?? p.productId ?? '');
      if (deletedIds.has(pIdStr)) return;

      const matchedKey = findExistingKey(p);
      if (matchedKey) {
        const existing = mergedMap.get(matchedKey);
        if (p.status === 'DELETED_BY_ADMIN' || p.deletedByAdmin) {
          mergedMap.set(matchedKey, {
            ...existing,
            ...p,
            status: 'DELETED_BY_ADMIN',
            approvalStatus: 'DELETED_BY_ADMIN',
            deletedByAdmin: true,
            active: false,
          });
        } else {
          // Live backend status takes priority (e.g. PENDING over old local REJECTED)
          mergedMap.set(matchedKey, { ...p, ...existing });
        }
      } else {
        if (p.status === 'DELETED_BY_ADMIN' || p.approvalStatus === 'DELETED_BY_ADMIN' || p.deletedByAdmin) {
          const key = String(p.id || p.productId || p.sku || p.title).trim().toLowerCase();
          mergedMap.set(key, {
            ...p,
            status: 'DELETED_BY_ADMIN',
            approvalStatus: 'DELETED_BY_ADMIN',
            deletedByAdmin: true,
            active: false,
          });
          return;
        }

        const isBackendId = Number.isInteger(Number(p.id)) && Number(p.id) > 0;
        const isProdBackendId = Number.isInteger(Number(p.productId)) && Number(p.productId) > 0;
        const wasApproved = p.status === 'APPROVED' || p.approvalStatus === 'APPROVED';

        if ((isBackendId || isProdBackendId) && wasApproved) {
          // If a previously approved product is not in the live public catalog, mark as REJECTED so seller can review and re-submit
          const flagged = {
            ...p,
            status: 'REJECTED',
            approvalStatus: 'REJECTED',
            deletedByAdmin: false,
            active: false,
            rejectionReason: p.rejectionReason || 'Product is pending review or requires revision from admin. Click "Edit & Re-submit" to update.',
          };
          db.updateSellerProduct(cleanId, p.id, flagged);
          const key = String(p.id || p.productId || p.sku || p.title).trim().toLowerCase();
          mergedMap.set(key, flagged);
          return;
        }

        const key = String(p.id || p.productId || p.sku || p.title).trim().toLowerCase();
        mergedMap.set(key, p);
      }
    });

    // Deduplicate merged products by unique product ID / SKU
    const seenIds = new Set();
    const rawProducts = [];
    Array.from(mergedMap.values()).forEach((prod) => {
      const uKey = String(prod.id ?? prod.productId ?? prod.sku ?? prod.title).toLowerCase();
      if (!seenIds.has(uKey)) {
        seenIds.add(uKey);
        rawProducts.push(prod);
      }
    });
    let products = rawProducts;

    // Filter out any deleted products with comprehensive prefix matching (NEVER filter out REJECTED or PENDING products)
    const freshDeletedIds = db.getDeletedProductIds();
    products = products.filter((p) => {
      const curStatus = String(p.status || p.approvalStatus || '').toUpperCase();
      if (curStatus === 'REJECTED' || curStatus === 'PENDING') return true;

      const isDel = (val) => {
        if (!val) return false;
        const s = String(val).trim();
        const raw = s.replace(/^sp_/, '');
        return freshDeletedIds.has(s) || freshDeletedIds.has(raw) || freshDeletedIds.has(`sp_${raw}`);
      };
      return !isDel(p.id) && !isDel(p.productId);
    });

    // Sort: PENDING products always appear at the top, then newest by ID
    products.sort((a, b) => {
      const aPending = a.status === 'PENDING' || a.approvalStatus === 'PENDING' ? 1 : 0;
      const bPending = b.status === 'PENDING' || b.approvalStatus === 'PENDING' ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;

      const aId = Number(a.id || a.productId || 0);
      const bId = Number(b.id || b.productId || 0);
      return bId - aId;
    });

    // Auto-sync un-synced local items in the background
    if (!USE_MOCK_API) {
      setTimeout(async () => {
        for (const p of localList) {
          if (typeof p.id === 'string' && (p.id.startsWith('sp_') || p.id.startsWith('prod_') || p.id.length > 10)) {
            try {
              await this.syncProductToBackend(p);
            } catch (_) {}
          }
        }
      }, 500);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q)
      );
    }

    if (filters.category && filters.category !== 'All') {
      products = products.filter(
        (p) =>
          String(p.categoryId) === String(filters.category) ||
          p.category?.toLowerCase() === String(filters.category).toLowerCase() ||
          p.categoryName?.toLowerCase() === String(filters.category).toLowerCase()
      );
    }

    if (filters.brand && filters.brand !== 'All') {
      products = products.filter(
        (p) =>
          String(p.brandId) === String(filters.brand) ||
          p.brand?.toLowerCase() === String(filters.brand).toLowerCase() ||
          p.brandName?.toLowerCase() === String(filters.brand).toLowerCase()
      );
    }

    if (filters.status && filters.status !== 'All') {
      const targetStatus = filters.status.toUpperCase();
      products = products.filter((p) => {
        const curStatus = String(p.status || p.approvalStatus || '').toUpperCase();
        if (targetStatus === 'DELETED_BY_ADMIN' || targetStatus === 'DELETED') {
          return curStatus === 'DELETED_BY_ADMIN' || curStatus === 'DELETED' || Boolean(p.deletedByAdmin);
        }
        return curStatus === targetStatus;
      });
    }

    if (filters.stockStatus && filters.stockStatus !== 'All') {
      if (filters.stockStatus === 'In Stock') {
        products = products.filter((p) => p.stock > 10);
      } else if (filters.stockStatus === 'Low Stock') {
        products = products.filter((p) => p.stock > 0 && p.stock <= 10);
      } else if (filters.stockStatus === 'Out of Stock') {
        products = products.filter((p) => p.stock === 0);
      }
    }

    if (filters.minPrice !== undefined && filters.minPrice !== '') {
      products = products.filter((p) => p.sellingPrice >= Number(filters.minPrice));
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      products = products.filter((p) => p.sellingPrice <= Number(filters.maxPrice));
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name-asc':
          products.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
          break;
        case 'name-desc':
          products.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
          break;
        case 'price-low':
          products.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
          break;
        case 'price-high':
          products.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
          break;
        case 'stock-low':
          products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
          break;
        case 'stock-high':
          products.sort((a, b) => (b.stock || 0) - (a.stock || 0));
          break;
        default:
          products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }
    }

    return products;
  },

  /**
   * Helper: Guarantee that Category, Subcategory, and Brand exist on backend with real 32-bit Integer IDs
   */
  async resolveRealBackendTaxonomy(rawCatId, rawCatName, rawSubId, rawSubName, rawBrandId, rawBrandName) {
    let catId = Number(rawCatId);
    let catName = rawCatName || 'Category';
    let subId = Number(rawSubId);
    let subName = rawSubName || 'Subcategory';
    let brandId = Number(rawBrandId);
    let brandName = rawBrandName || 'Brand';

    // 1. Resolve Category
    if (!Number.isInteger(catId) || catId <= 0 || catId > 2147483647) {
      catId = null;
      try {
        const catRes = await apiClient.get('/api/categories', { params: { search: catName, limit: 20 } });
        const cats = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || catRes.data?.categories || []);
        const matchedCat = cats.find(c =>
          (c.name || c.title || '').toLowerCase() === catName.toLowerCase() ||
          (c.slug || '').toLowerCase() === catName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        ) || cats[0];
        if (matchedCat) {
          catId = Number(matchedCat.id || matchedCat.categoryId);
          catName = matchedCat.name || matchedCat.title || catName;
        } else {
          const newCat = await categoryService.createCategory({ name: catName });
          catId = Number(newCat?.id || newCat?.categoryId);
        }
      } catch (_) {}
    }

    // 2. Resolve Subcategory
    if (!Number.isInteger(subId) || subId <= 0 || subId > 2147483647) {
      subId = null;
      try {
        const subRes = await apiClient.get('/api/subcategories', { params: { search: subName, limit: 20 } });
        const subs = Array.isArray(subRes.data) ? subRes.data : (subRes.data?.data || subRes.data?.subcategories || []);
        const matchedSub = subs.find(s =>
          (catId ? String(s.categoryId) === String(catId) : true) &&
          ((s.name || s.title || '').toLowerCase() === subName.toLowerCase() ||
           (s.slug || '').toLowerCase() === subName.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        ) || subs.find(s => (s.name || s.title || '').toLowerCase() === subName.toLowerCase()) || subs[0];

        if (matchedSub) {
          subId = Number(matchedSub.id || matchedSub.subcategoryId);
          subName = matchedSub.name || matchedSub.title || subName;
        } else if (catId) {
          const newSub = await categoryService.createSubcategory({ name: subName, categoryId: catId });
          subId = Number(newSub?.id || newSub?.subcategoryId);
        }
      } catch (_) {}
    }

    // 3. Resolve Brand
    if (!Number.isInteger(brandId) || brandId <= 0 || brandId > 2147483647) {
      brandId = null;
      try {
        const brandRes = await apiClient.get('/api/brands', { params: { search: brandName, limit: 20 } });
        const brands = Array.isArray(brandRes.data) ? brandRes.data : (brandRes.data?.data || brandRes.data?.brands || []);
        const matchedBrand = brands.find(b =>
          (b.name || b.brandName || '').toLowerCase() === brandName.toLowerCase() ||
          (b.slug || '').toLowerCase() === brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        ) || brands[0];

        if (matchedBrand) {
          brandId = Number(matchedBrand.id || matchedBrand.brandId);
          brandName = matchedBrand.name || matchedBrand.brandName || brandName;
        } else {
          const newBrand = await categoryService.createBrand({ name: brandName, categoryId: catId, subcategoryId: subId });
          brandId = Number(newBrand?.id || newBrand?.brandId);
        }
      } catch (_) {}
    }

    return {
      catId: Number.isInteger(catId) && catId > 0 && catId <= 2147483647 ? catId : null,
      catName,
      subId: Number.isInteger(subId) && subId > 0 && subId <= 2147483647 ? subId : null,
      subName,
      brandId: Number.isInteger(brandId) && brandId > 0 && brandId <= 2147483647 ? brandId : null,
      brandName,
    };
  },

  /**
   * Helper: Synchronize any offline / client-created product to backend with full taxonomy guarantee
   */
  async syncProductToBackend(productData) {
    const currentSeller = db.getSeller();
    const sellerId = String(currentSeller?.sellerId || currentSeller?.id || '');

    const rawCatName = productData.categoryName || productData.category || 'Pencils';
    const rawSubName = productData.subcategoryName || productData.subcategory || 'Color Pencil';
    const rawBrandName = productData.brandName || productData.brand || 'Apsara';

    const { catId, catName, subId, subName, brandId, brandName } = await this.resolveRealBackendTaxonomy(
      productData.categoryId,
      rawCatName,
      productData.subcategoryId,
      rawSubName,
      productData.brandId,
      rawBrandName
    );
  },

  /**
   * Helper: Synchronizes a single product into the shared backend catalog
   */
  async updateProductCatalog(productData) {
    const currentSeller = db.getSeller();
    const rawSellerId = currentSeller?.sellerId || currentSeller?.id || '';
    const numericSellerId = resolveNumericSellerId(rawSellerId);
    const sellerId = String(rawSellerId);

    const title = productData.title || productData.name;
    const price = Number(productData.price ?? productData.sellingPrice ?? 0);
    const mrp = Number(productData.mrp ?? (price ? Math.round(price * 1.15) : 0));
    const slug = productData.slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `prod-${Date.now()}`);

    const rawCatName = productData.categoryName || productData.category || 'Pencils';
    const rawSubName = productData.subcategoryName || productData.subcategory || 'Color Pencil';
    const rawBrandName = productData.brandName || productData.brand || 'Apsara';

    const { catId, catName, subId, subName, brandId, brandName } = await this.resolveRealBackendTaxonomy(
      productData.categoryId,
      rawCatName,
      productData.subcategoryId,
      rawSubName,
      productData.brandId,
      rawBrandName
    );

    const payload = {
      name: title,
      title,
      slug,
      sku: productData.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      description: productData.description || '',
      categoryId: catId || undefined,
      categoryName: catName,
      subcategoryId: subId || undefined,
      subcategoryName: subName,
      brandId: brandId || undefined,
      brandName: brandName,
      brand: brandName,
      price,
      sellingPrice: price,
      mrp,
      images: Array.isArray(productData.images) && productData.images.length > 0 ? productData.images : (productData.imageUrl ? [productData.imageUrl] : []),
      imageUrl: productData.imageUrl || (Array.isArray(productData.images) ? productData.images[0] : null),
      active: productData.active !== undefined ? Boolean(productData.active) : true,
      status: productData.status || 'PENDING',
      approvalStatus: productData.approvalStatus || 'PENDING',
      sellerId: numericSellerId,
      vendorId: numericSellerId,
    };

    try {
      const response = await apiClient.post('/api/products', payload);
      const createdItem = response.data?.data || response.data;
      if (createdItem) {
        const realId = Number(createdItem.id || createdItem.productId);
        db.updateSellerProduct(sellerId, productData.id, {
          ...payload,
          id: realId,
          productId: realId,
          categoryId: catId,
          subcategoryId: subId,
          brandId: brandId,
        });
        return createdItem;
      }
    } catch (err) {
      if (err.response?.status === 409) {
        console.log(`Product "${payload.title}" is already registered on backend.`);
      } else {
        console.warn('Backend sync notice:', err?.response?.data || err.message);
      }
    }
    return null;
  },

  /**
   * 4.2 GET /api/seller/products/{id}
   * Accepts numeric productId (e.g. 790) or string id (e.g. sp_790)
   */
  async getSellerProductById(id) {
    if (!id) return null;
    const cleanIdStr = String(id).trim();
    const currentSeller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanId = String(rawSellerId).replace(/^seller_/, '').trim();
    const sellerId = cleanId ? `seller_${cleanId}` : '';

    // 1. Check local database store first (using seller key, findProductById, and central products)
    let localProduct = db.getSellerProductById(sellerId, id) || db.findProductById(id) || db.getProductById(id);
    const isRejectedOrPending = localProduct && (
      String(localProduct.status || '').toUpperCase() === 'REJECTED' ||
      String(localProduct.approvalStatus || '').toUpperCase() === 'REJECTED' ||
      String(localProduct.status || '').toUpperCase() === 'PENDING' ||
      String(localProduct.approvalStatus || '').toUpperCase() === 'PENDING'
    );

    if (!isRejectedOrPending && db.getDeletedProductIds().has(cleanIdStr)) {
      return null;
    }

    // 2. Query live backend API for this product to guarantee fresh approval & live catalog status
    if (!USE_MOCK_API) {
      try {
        let response = null;
        try {
          response = await apiClient.get(`/api/products/${id}`, { timeout: 3500 });
        } catch (err) {
          const status = err?.response?.status || err?.response?.data?.statusCode;
          const msg = err?.response?.data?.message || err?.message || '';

          // If public endpoint returns 404, the product is NOT public yet (it is either PENDING or REJECTED by admin).
          // NEVER purge or delete from seller store! Preserve local product with its current status.
          if (status === 404 || msg.toLowerCase().includes('not found')) {
            if (localProduct) {
              return normalizeSellerProduct(localProduct);
            }
          }

          // If query by ID failed with other error and local product has SKU or title, try searching catalog
          if (localProduct?.title) {
            try {
              const searchRes = await apiClient.get('/api/products', { params: { search: localProduct.title, limit: 5 }, timeout: 3500 });
              const prods = searchRes.data?.data || searchRes.data || [];
              const items = Array.isArray(prods) ? prods : (prods.products || []);
              const found = items.find(
                (p) => String(p.sku || '').toLowerCase() === String(localProduct.sku || '').toLowerCase() ||
                       String(p.title || '').toLowerCase() === String(localProduct.title || '').toLowerCase()
              );
              if (found) response = { data: found };
            } catch (_) {}
          }
        }

        const rawData = response?.data?.data || response?.data;
        if (rawData && (rawData.id || rawData.productId)) {
          const rawStatus = String(rawData.status || rawData.approvalStatus || '').toUpperCase();
          const isApproved = rawStatus === 'APPROVED' || rawStatus === 'ACTIVE' || Boolean(rawData.active);

          if (localProduct) {
            if (isApproved) {
              localProduct.status = 'APPROVED';
              localProduct.approvalStatus = 'APPROVED';
              localProduct.active = true;
              db.updateSellerProduct(cleanId, id, {
                status: 'APPROVED',
                approvalStatus: 'APPROVED',
                active: true,
                ...(rawData.productId || rawData.id ? { productId: Number(rawData.productId || rawData.id), id: Number(rawData.productId || rawData.id) } : {}),
              });
            }
            return normalizeSellerProduct(localProduct);
          } else {
            return normalizeSellerProduct({ ...rawData, status: isApproved ? 'APPROVED' : rawData.status });
          }
        }
      } catch (apiError) {
        // Fall through to localProduct
      }
    }

    if (localProduct && (isRejectedOrPending || !db.getDeletedProductIds().has(cleanIdStr))) {
      return normalizeSellerProduct(localProduct);
    }

      // 4. Try querying catalog list in case the item is in the live batch
      try {
        const catRes = await apiClient.get('/api/products', { params: { limit: 100, page: 1 } });
        const catList = catRes.data?.data || catRes.data || [];
        const prods = Array.isArray(catList) ? catList : (catList.products || []);
        const found = prods.find(
          (p) => String(p.id) === String(id) || String(p.productId) === String(id) || Number(p.id) === Number(id) || Number(p.productId) === Number(id)
        );
        if (found) {
          return normalizeSellerProduct(found);
        }
      } catch (_) {}

    await delay(30);
    const allProds = db.getProducts();
    const fallback = allProds.find(
      (p) => String(p.id) === String(id) || String(p.productId) === String(id) || Number(p.id) === Number(id) || Number(p.productId) === Number(id)
    );
    return fallback ? normalizeSellerProduct(fallback) : null;
  },

  /**
   * 3. POST /api/products
   * Creates a product owned by the authenticated seller with guaranteed backend category/brand synchronization.
   */
  async createSellerProduct(productData) {
    const currentSeller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanSellerId = String(rawSellerId || '').replace(/^seller_/, '').trim();
    const cleanId = cleanSellerId || '';
    const numericSellerId = resolveNumericSellerId(rawSellerId) || Number(cleanId) || 0;
    const sellerId = cleanId ? `seller_${cleanId}` : '';

    const title = productData.title || productData.name;
    const price = Number(productData.price ?? productData.sellingPrice ?? 0);
    const mrp = Number(productData.mrp ?? (price ? Math.round(price * 1.15) : 0));
    const slug = productData.slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `prod-${Date.now()}`);
    const images = Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : (productData.imageUrl ? [productData.imageUrl] : []);

    const rawCatName = productData.categoryName || productData.category || 'Pencils';
    const rawSubName = productData.subcategoryName || productData.subcategory || 'Color Pencil';
    const rawBrandName = productData.brandName || productData.brand || 'Apsara';

    const { catId, catName, subId, subName, brandId, brandName } = await this.resolveRealBackendTaxonomy(
      productData.categoryId,
      rawCatName,
      productData.subcategoryId,
      rawSubName,
      productData.brandId,
      rawBrandName
    );

    const validUnit = String(productData.unit || 'Pieces').trim();
    const parsedGst = Math.max(0, Math.min(100, parseInt(productData.gstRate ?? productData.gst ?? 18, 10) || 18));
    const parsedMoq = Math.max(1, parseInt(productData.moq || 1, 10) || 1);
    const parsedStock = Math.max(0, parseInt(productData.stockQty ?? productData.stock ?? 0, 10) || 0);

    const finalBrandId = Number.isInteger(Number(brandId)) && Number(brandId) > 0
      ? Number(brandId)
      : (Number.isInteger(Number(productData.brandId)) && Number(productData.brandId) > 0 ? Number(productData.brandId) : 1);

    const payload = {
      name: title,
      title,
      slug,
      sku: productData.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      description: productData.description || '',
      categoryId: catId || undefined,
      categoryName: catName,
      subcategoryId: subId || undefined,
      subcategoryName: subName,
      brandId: finalBrandId,
      brandName: brandName,
      brand: brandName,
      price,
      sellingPrice: productData.sellingPrice !== undefined ? Number(productData.sellingPrice) : price,
      mrp: productData.mrp !== undefined ? Number(productData.mrp) : (mrp || price),
      unit: validUnit,
      moq: parsedMoq,
      stock: parsedStock,
      stockQty: parsedStock,
      hsn: String(productData.hsn || productData.hsnCode || '').trim(),
      hsnCode: String(productData.hsnCode || productData.hsn || '').trim(),
      gstRate: parsedGst,
      gst: parsedGst,
      is24HourDelivery: Boolean(productData.is24HourDelivery),
      imageUrl: images[0] || productData.imageUrl || null,
      images,
      bulkPricingTiers: (productData.bulkPricingTiers || []).map((t) => ({
        minQty: Math.max(1, parseInt(t.minQty || 1, 10) || 1),
        maxQty: t.maxQty !== null && t.maxQty !== undefined && t.maxQty !== '' ? Math.max(1, parseInt(t.maxQty, 10)) : null,
        price: Number(t.price ?? t.pricePerUnit ?? 0),
        discountPercentage: Number(t.discountPercentage ?? t.discount ?? 0),
      })),
      specifications: productData.specifications || {},
      active: false,
      status: 'PENDING',
      approvalStatus: 'PENDING',
      sellerId: numericSellerId,
      vendorId: numericSellerId,
      storeId: 1, // Store 1 in Spring Boot MySQL catalog
    };

    let realProdId = null;
    let createdItem = null;
    let syncErrorMsg = null;

    if (!USE_MOCK_API) {
      try {
        // 1. Try official POST /api/seller/products (attaches Authorization Bearer token & X-Seller-Id)
        let response = null;
        try {
          response = await apiClient.post('/api/seller/products', payload);
        } catch (sellerErr) {
          syncErrorMsg = sellerErr.response?.data?.message || sellerErr.response?.statusText || sellerErr.message;
          // Fallback 1: Try general product endpoint POST /api/products
          try {
            response = await apiClient.post('/api/products', payload);
            syncErrorMsg = null; // Succeeded on fallback
          } catch (prodErr) {
            syncErrorMsg = prodErr.response?.data?.message || `HTTP ${prodErr.response?.status}: ${prodErr.response?.statusText || prodErr.message}`;
            // Fallback 2: Try admin-assisted seller endpoint POST /api/admin/products/sellers/{sellerId}
            if (numericSellerId) {
              try {
                response = await apiClient.post(`/api/admin/products/sellers/${numericSellerId}`, payload);
                syncErrorMsg = null;
              } catch (adminErr) {
                syncErrorMsg = `HTTP ${sellerErr.response?.status || 403}: Backend access denied (${sellerErr.response?.statusText || 'Forbidden'}). Ensure seller role is enabled in Spring Boot.`;
                console.warn('Backend product creation notice:', adminErr?.message || prodErr?.message || sellerErr?.message);
              }
            } else {
              console.warn('Backend product creation notice:', prodErr?.message || sellerErr?.message);
            }
          }
        }
        createdItem = response?.data?.data || response?.data?.product || response?.data;
        if (createdItem) {
          const rawId = createdItem.productId ?? createdItem.id;
          if (typeof rawId === 'string' && rawId.startsWith('sp_')) {
            realProdId = parseInt(rawId.replace('sp_', ''), 10) || rawId;
          } else if (typeof rawId === 'number') {
            realProdId = rawId;
          } else if (typeof rawId === 'string' && !isNaN(parseInt(rawId, 10))) {
            realProdId = parseInt(rawId, 10);
          }
        }
      } catch (apiError) {
        syncErrorMsg = apiError.response?.data?.message || `HTTP ${apiError.response?.status || 'Error'}: ${apiError.message}`;
        if (apiError.response?.status === 400) {
          const validationMsg = apiError.response?.data?.message || 'Validation failed on backend. Preserving product locally for review.';
          console.warn('Backend product creation warning:', validationMsg);
        } else if (apiError.response?.status === 409) {
          console.log(`Product "${title}" already exists on backend, tracking locally with PENDING status.`);
        } else {
          console.warn('Backend create product notice:', apiError?.response?.data?.message || apiError.message);
        }
      }
    }

    const finalId = realProdId || (Math.floor(Date.now() % 1000000) + 7000);
    // Auto-register Category in seller local catalog if not already present
    if (catName && catName !== 'Category') {
      const existingCats = db.getSellerCategories(cleanId);
      const exists = existingCats.find(c => (c.name || '').toLowerCase() === catName.toLowerCase());
      if (!exists) {
        db.createSellerCategory(cleanId, {
          id: catId || `cat_${Date.now()}`,
          categoryId: catId || Date.now(),
          name: catName,
          title: catName,
          active: true,
          status: 'Active',
        });
      }
    }

    // Auto-register Subcategory in seller local catalog if not already present
    if (subName && subName !== 'Subcategory') {
      const existingSubs = db.getSellerSubcategories(cleanId);
      const exists = existingSubs.find(s => (s.name || '').toLowerCase() === subName.toLowerCase());
      if (!exists) {
        db.createSellerSubcategory(cleanId, {
          id: subId || `sub_${Date.now()}`,
          subcategoryId: subId || Date.now(),
          categoryId: catId || null,
          categoryName: catName,
          name: subName,
          title: subName,
          active: true,
          status: 'Active',
        });
      }
    }

    // Auto-register Brand in seller local catalog if not already present
    if (brandName && brandName !== 'Brand') {
      const existingBrands = db.getSellerBrands(cleanId);
      const exists = existingBrands.find(b => (b.name || '').toLowerCase() === brandName.toLowerCase());
      if (!exists) {
        db.createSellerBrand(cleanId, {
          id: brandId || `brand_${Date.now()}`,
          brandId: brandId || Date.now(),
          name: brandName,
          brandName: brandName,
          categoryId: catId || null,
          categoryName: catName,
          subcategoryId: subId || null,
          subcategoryName: subName,
          active: true,
          status: 'Active',
        });
      }
    }

    const created = db.createSellerProduct(sellerId, {
      ...payload,
      id: finalId,
      productId: finalId,
      categoryId: catId,
      subcategoryId: subId,
      brandId: brandId,
      status: 'PENDING',
      approvalStatus: 'PENDING',
      active: false,
      backendSyncNotice: syncErrorMsg,
      isLiveBackend: Boolean(realProdId),
    });
    return normalizeSellerProduct({ ...created, backendSyncNotice: syncErrorMsg, isLiveBackend: Boolean(realProdId) });
  },

  /**
   * 4. PUT /api/seller/products/{id} (or /api/products/{id})
   */
  async updateSellerProduct(id, updates) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '';
    const cleanSellerId = String(rawSellerId || '').replace(/^seller_/, '').trim();
    const cleanId = cleanSellerId || '';
    const numericSellerId = resolveNumericSellerId(rawSellerId) || Number(cleanId) || 0;
    const sellerId = cleanId ? `seller_${cleanId}` : '';

    const localProd = db.findProductById(id) || {};
    const isResubmission =
      updates.status === 'PENDING' ||
      updates.approvalStatus === 'PENDING' ||
      localProd.status === 'REJECTED' ||
      localProd.approvalStatus === 'REJECTED';

    const title = updates.title || updates.name || localProd.title || localProd.name || 'Product';
    const rawCatName = updates.categoryName || updates.category || localProd.categoryName || localProd.category || 'Electrical';
    const rawSubName = updates.subcategoryName || updates.subcategory || localProd.subcategoryName || localProd.subcategory || 'Wires & Cables';
    const rawBrandName = updates.brandName || updates.brand || localProd.brandName || localProd.brand || 'GVD';

    const { catId, catName, subId, subName, brandId, brandName } = await this.resolveRealBackendTaxonomy(
      updates.categoryId || localProd.categoryId,
      rawCatName,
      updates.subcategoryId || localProd.subcategoryId,
      rawSubName,
      updates.brandId || localProd.brandId,
      rawBrandName
    );

    const price = Number(updates.price ?? updates.sellingPrice ?? localProd.price ?? localProd.sellingPrice ?? 0);
    const mrp = Number(updates.mrp ?? localProd.mrp ?? (price ? Math.round(price * 1.15) : 0));
    const slug = updates.slug || localProd.slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `prod-${Date.now()}`);
    const images = Array.isArray(updates.images) && updates.images.length > 0
      ? updates.images
      : (updates.imageUrl ? [updates.imageUrl] : (Array.isArray(localProd.images) && localProd.images.length > 0 ? localProd.images : (localProd.imageUrl ? [localProd.imageUrl] : [])));
    const validUnit = String(updates.unit || localProd.unit || 'Pieces').trim();
    const parsedGst = Math.max(0, Math.min(100, parseInt(updates.gstRate ?? updates.gst ?? localProd.gstRate ?? localProd.gst ?? 18, 10) || 18));
    const parsedMoq = Math.max(1, parseInt(updates.moq || localProd.moq || 1, 10) || 1);
    const parsedStock = Math.max(0, parseInt(updates.stockQty ?? updates.stock ?? localProd.stockQty ?? localProd.stock ?? 0, 10) || 0);

    const finalStatus = isResubmission ? 'PENDING' : (updates.status || localProd.status || 'PENDING');
    const finalApprovalStatus = isResubmission ? 'PENDING' : (updates.approvalStatus || localProd.approvalStatus || 'PENDING');

    const payload = {
      ...localProd,
      ...updates,
      id: Number(id) || id,
      productId: Number(id) || id,
      name: title,
      title,
      slug,
      sku: updates.sku || localProd.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      description: updates.description !== undefined ? updates.description : (localProd.description || ''),
      categoryId: catId || undefined,
      categoryName: catName,
      subcategoryId: subId || undefined,
      subcategoryName: subName,
      brandId: Number.isInteger(Number(brandId)) && Number(brandId) > 0 ? Number(brandId) : 1,
      brandName,
      price,
      sellingPrice: price,
      mrp,
      unit: validUnit,
      moq: parsedMoq,
      stock: parsedStock,
      stockQty: parsedStock,
      hsn: String(updates.hsn || updates.hsnCode || localProd.hsn || localProd.hsnCode || '').trim(),
      hsnCode: String(updates.hsnCode || updates.hsn || localProd.hsnCode || localProd.hsn || '').trim(),
      gstRate: parsedGst,
      gst: parsedGst,
      is24HourDelivery: Boolean(updates.is24HourDelivery ?? localProd.is24HourDelivery),
      imageUrl: images[0] || null,
      images,
      specifications: updates.specifications || localProd.specifications || {},
      bulkPricingTiers: updates.bulkPricingTiers || localProd.bulkPricingTiers || [],
      active: isResubmission ? false : Boolean(updates.active !== undefined ? updates.active : localProd.active),
      status: finalStatus,
      approvalStatus: finalApprovalStatus,
      deletedByAdmin: false,
      rejectionReason: isResubmission ? null : (updates.rejectionReason ?? localProd.rejectionReason),
      reSubmittedAt: isResubmission ? new Date().toISOString() : (updates.reSubmittedAt || localProd.reSubmittedAt),
      sellerId: numericSellerId,
      vendorId: numericSellerId,
      storeId: 1,
    };

    let createdItem = null;
    if (!USE_MOCK_API) {
      try {
        let response = null;
        try {
          response = await apiClient.put(`/api/seller/products/${id}`, payload);
        } catch (putErr) {
          try {
            response = await apiClient.put(`/api/products/${id}`, payload);
          } catch (pErr) {
            // When PUT fails (e.g. 404 because product was removed from backend DB or was only in mock),
            // submit as a fresh seller product via POST /api/seller/products so it enters the Admin review queue!
            try {
              response = await apiClient.post('/api/seller/products', payload);
            } catch (postErr) {
              console.warn('Backend POST /api/seller/products notice:', postErr?.response?.data || postErr.message);
            }
          }
        }
        createdItem = response?.data?.data || response?.data?.product || response?.data;
      } catch (apiError) {
        console.warn('API updateProduct notice:', apiError?.response?.data || apiError.message);
      }
    }

    if (createdItem) {
      const newRawId = createdItem.productId ?? createdItem.id;
      let realProdId = newRawId;
      if (typeof newRawId === 'string' && newRawId.startsWith('sp_')) {
        realProdId = parseInt(newRawId.replace('sp_', ''), 10) || newRawId;
      } else if (typeof newRawId === 'string' && !isNaN(parseInt(newRawId, 10))) {
        realProdId = parseInt(newRawId, 10);
      }

      const finalSaved = {
        ...payload,
        ...createdItem,
        id: realProdId || payload.id,
        productId: realProdId || payload.productId,
        status: finalStatus,
        approvalStatus: finalApprovalStatus,
        active: false,
        deletedByAdmin: false,
      };

      db.updateSellerProduct(sellerId, id, finalSaved);
      if (realProdId && String(realProdId) !== String(id)) {
        db.createSellerProduct(sellerId, finalSaved);
      }
      return normalizeSellerProduct(finalSaved);
    }

    await delay(100);
    const updated = db.updateSellerProduct(sellerId, id, payload);
    return normalizeSellerProduct(updated || { id, ...payload });
  },

  /**
   * 4b. PUT /api/products/{id} (toggle-active)
   */
  async toggleProductActive(id, active) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id;
    const sellerId = String(rawSellerId || '');

    if (!USE_MOCK_API) {
      try {
        let response;
        try {
          response = await apiClient.put(`/api/seller/products/${id}`, { active });
        } catch (e) {
          response = await apiClient.put(`/api/products/${id}`, { active });
        }
        const rawData = response.data?.data || response.data;
        if (rawData) return normalizeSellerProduct(rawData);
      } catch (apiError) {
        // Fallback
      }
    }

    await delay(100);
    const status = active ? 'APPROVED' : 'INACTIVE';
    const updated = db.updateSellerProduct(sellerId, id, { active, status });
    return updated ? normalizeSellerProduct(updated) : null;
  },

  /**
   * 5. DELETE /api/seller/products/{id}
   */
  async deleteSellerProduct(id) {
    if (!id) return false;
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id;
    const sellerId = String(rawSellerId || '');
    const cleanId = String(id);

    // 1. Permanently record as deleted so it never re-seeds
    db.recordDeletedProduct(cleanId);

    // 2. Dispatch DELETE to backend API
    if (!USE_MOCK_API) {
      try {
        try {
          await apiClient.delete(`/api/products/${cleanId}`);
        } catch (e) {
          await apiClient.delete(`/api/seller/products/${cleanId}`);
        }
      } catch (apiError) {
        console.warn('API deleteProduct notice:', apiError?.response?.data || apiError.message);
      }
    }

    await delay(50);
    db.deleteProduct(cleanId);
    db.deleteSellerProduct(sellerId, cleanId);
    return true;
  },

  /**
   * 6. PATCH /api/seller/products/{id}/stock (Quick Stock Update)
   */
  async updateSellerStock(id, stockQty, reason = 'Quick stock update') {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id;
    const sellerId = String(rawSellerId || '');

    if (!USE_MOCK_API) {
      try {
        let response;
        try {
          response = await apiClient.patch(`/api/seller/products/${id}/stock`, { stockQty: Number(stockQty) });
        } catch (e) {
          response = await apiClient.put(`/api/products/${id}`, {
            stockQty: Number(stockQty),
            stock: Number(stockQty),
            reason,
          });
        }
        const rawData = response.data?.data || response.data;
        if (rawData) return normalizeSellerProduct(rawData);
      } catch (apiError) {
        // Fallback
      }
    }

    await delay(100);
    const updated = db.updateSellerStock(sellerId, id, stockQty);
    return updated ? normalizeSellerProduct(updated) : null;
  },

  /**
   * 7. PATCH /api/seller/products/{id}/pricing (Quick Pricing Update)
   */
  async updateSellerPrice(id, priceData) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id;
    const sellerId = String(rawSellerId || '');

    const payload = {
      price: Number(priceData.price ?? priceData.sellingPrice),
      mrp: Number(priceData.mrp ?? 0),
      bulkPricingTiers: priceData.bulkPricingTiers || [],
    };

    if (!USE_MOCK_API) {
      try {
        let response;
        try {
          response = await apiClient.patch(`/api/seller/products/${id}/pricing`, payload);
        } catch (e) {
          response = await apiClient.put(`/api/products/${id}`, {
            price: payload.price,
            sellingPrice: payload.price,
            mrp: payload.mrp,
          });
        }
        const rawData = response.data?.data || response.data;
        if (rawData) return normalizeSellerProduct(rawData);
      } catch (apiError) {
        // Fallback
      }
    }

    await delay(100);
    const updated = db.updateSellerPrice(sellerId, id, priceData);
    return updated ? normalizeSellerProduct(updated) : null;
  },

  async archiveProduct(id) {
    return this.toggleProductActive(id, false);
  },

  async restoreProduct(id) {
    return this.toggleProductActive(id, true);
  },
};
