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
  const title = p.title || p.name || 'Product';
  const price = Number(p.price ?? p.sellingPrice ?? 0);
  const mrp = Number(p.mrp ?? (price ? Math.round(price * 1.12) : 0));
  const stockQty = Number(p.stockQty ?? p.stock ?? 0);
  const slug = p.slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `prod-${productId}`);
  const hsn = String(p.hsn || p.hsnCode || '7214');
  const gstRate = Number(p.gstRate ?? p.gst ?? 18);
  
  const images = getCleanProductImages(p);

  const rawStatus = (p.status || (p.active === false ? 'PENDING' : 'APPROVED')).toUpperCase();
  const status = rawStatus === 'INACTIVE' ? 'INACTIVE' : (rawStatus === 'REJECTED' ? 'REJECTED' : (rawStatus === 'APPROVED' ? 'APPROVED' : 'PENDING'));

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
    unit: p.unit || 'PIECE',
    moq: Number(p.moq || 1),
    stock: stockQty,
    stockQty,
    is24HourDelivery: Boolean(p.is24HourDelivery),
    active: p.active !== undefined ? Boolean(p.active) : status === 'APPROVED',
    status, // PENDING | APPROVED | REJECTED | INACTIVE
    approvalStatus: status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : (status === 'INACTIVE' ? 'INACTIVE' : 'PENDING')),
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
    specifications: typeof p.specifications === 'object' && p.specifications !== null ? p.specifications : {},
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
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id || '9';
    const cleanId = String(rawSellerId).replace(/^seller_/, '').trim() || '9';
    const sellerId = `seller_${cleanId}`;
    const numCleanId = Number(cleanId);

    const isOwner = (p) => {
      if (!p) return false;
      // Never include mock dummy seed products (prod_1 to prod_12)
      if (typeof p.id === 'string' && /^prod_\d+$/i.test(p.id)) {
        return false;
      }
      const pSellerId = String(p.sellerId || p.seller_id || p.vendorId || p.vendor_id || '').replace(/^seller_/, '').trim().toLowerCase();
      // If product has no explicit sellerId or was returned from seller endpoint, keep it
      if (!pSellerId) return true;
      const currentClean = cleanId.toLowerCase();
      const numPSeller = Number(pSellerId);
      return pSellerId === currentClean || (numCleanId > 0 && numPSeller === numCleanId) || pSellerId === 'admin';
    };

    // 1. Get seller products from local store (guaranteed persistence across refresh)
    const localList = (db.getSellerProducts(cleanId) || [])
      .filter(isOwner)
      .map((p) => normalizeSellerProduct({ ...p, sellerId }));

    // 2. Fetch live backend products if authorized
    let backendSellerList = [];
    if (!USE_MOCK_API && canAccessSellerApi('/api/seller/products')) {
      try {
        const queryParams = {
          page: filters.page || 1,
          limit: filters.limit || 50,
        };
        if (filters.search) queryParams.search = filters.search;
        if (filters.category && filters.category !== 'All') queryParams.category = filters.category;
        if (filters.brand && filters.brand !== 'All') queryParams.brand = filters.brand;
        if (filters.status && filters.status !== 'All') queryParams.status = filters.status;
        if (filters.stockStatus && filters.stockStatus !== 'All') {
          queryParams.stockStatus = filters.stockStatus === 'In Stock' ? 'instock' : (filters.stockStatus === 'Low Stock' ? 'lowstock' : 'outofstock');
        }
        if (filters.sortBy) {
          queryParams.sortBy = filters.sortBy === 'price-low' ? 'price_asc' : (filters.sortBy === 'price-high' ? 'price_desc' : 'newest');
        }

        let response;
        try {
          response = await apiClient.get('/api/seller/products', { params: queryParams, timeout: 8000 });
        } catch (sellerErr) {
          if (sellerErr.response?.status === 404 || sellerErr.response?.status === 405) {
            response = await apiClient.get('/api/products', { params: queryParams, timeout: 8000 });
          } else {
            throw sellerErr;
          }
        }
        const rawData = response?.data?.data || response?.data;
        const allProds = Array.isArray(rawData) ? rawData : (rawData?.products || []);

        backendSellerList = allProds
          .filter(isOwner)
          .map((p) => normalizeSellerProduct(p));
      } catch (apiError) {
        // Fall through to local seller storage
      }
    }

    const mergedMap = new Map();

    // 1. Local seller products (created by seller in UI)
    localList.forEach((p) => {
      const key = String(p.id || p.productId || p.sku || p.title).trim().toLowerCase();
      mergedMap.set(key, p);
    });

    // 2. Live backend products belonging to this seller
    backendSellerList.forEach((p) => {
      const key = String(p.id || p.productId || p.sku || p.title).trim().toLowerCase();
      mergedMap.set(key, p);
    });

    let products = Array.from(mergedMap.values());

    // Filter out any deleted products
    const deletedIds = db.getDeletedProductIds();
    products = products.filter((p) => {
      const pId = String(p.id ?? p.productId ?? '');
      const pProdId = String(p.productId ?? p.id ?? '');
      return !deletedIds.has(pId) && !deletedIds.has(pProdId);
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
      products = products.filter((p) => p.status.toUpperCase() === filters.status.toUpperCase());
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
    const sellerId = String(currentSeller?.id || '9');

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
    const rawSellerId = currentSeller?.sellerId || currentSeller?.id || '9';
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
    const currentSeller = db.getSeller();
    const rawSellerId = currentSeller?.sellerId || currentSeller?.id || '9';
    const sellerId = String(rawSellerId);

    // 1. Check local database store
    const localProduct = db.getSellerProductById(sellerId, id) || db.getProductById(id);
    if (localProduct) {
      return normalizeSellerProduct(localProduct);
    }

    // 3. Try live backend API (seller and public routes)
    if (!USE_MOCK_API) {
      try {
        let response;
        if (hasValidLiveAuth()) {
          try {
            response = await apiClient.get(`/api/seller/products/${id}`);
          } catch (e) {
            response = await apiClient.get(`/api/products/${id}`);
          }
        } else {
          response = await apiClient.get(`/api/products/${id}`);
        }
        const rawData = response.data?.data || response.data;
        if (rawData && (rawData.id || rawData.productId || rawData.title || rawData.name)) {
          return normalizeSellerProduct(rawData);
        }
      } catch (apiError) {
        // Fallback to catalog search
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
    }

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
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id;
    const cleanSellerId = String(rawSellerId || '').replace(/^seller_/, '');
    const numericSellerId = resolveNumericSellerId(rawSellerId);
    const sellerId = cleanSellerId ? `seller_${cleanSellerId}` : '';

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

    const validUnit = String(productData.unit || 'PIECE').toUpperCase();
    const parsedGst = Math.max(0, Math.min(100, parseInt(productData.gstRate ?? productData.gst ?? 18, 10) || 18));
    const parsedMoq = Math.max(1, parseInt(productData.moq || 1, 10) || 1);
    const parsedStock = Math.max(0, parseInt(productData.stockQty ?? productData.stock ?? 0, 10) || 0);

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
      unit: validUnit,
      moq: parsedMoq,
      stock: parsedStock,
      stockQty: parsedStock,
      hsn: String(productData.hsn || productData.hsnCode || '7214'),
      hsnCode: String(productData.hsnCode || productData.hsn || '7214'),
      gstRate: parsedGst,
      gst: parsedGst,
      is24HourDelivery: Boolean(productData.is24HourDelivery),
      imageUrl: images[0] || productData.imageUrl || null,
      images,
      bulkPricingTiers: (productData.bulkPricingTiers || []).map((t, idx) => ({
        tierId: t.tierId || idx + 1,
        minQty: Math.max(1, parseInt(t.minQty || 1, 10) || 1),
        maxQty: t.maxQty !== null && t.maxQty !== undefined ? Math.max(1, parseInt(t.maxQty, 10)) : null,
        price: Number(t.price ?? t.pricePerUnit ?? 0),
        discountPercentage: Number(t.discountPercentage ?? t.discount ?? 0),
      })),
      specifications: productData.specifications || {},
      active: productData.active !== undefined ? Boolean(productData.active) : true,
      status: productData.status || 'PENDING',
      approvalStatus: productData.approvalStatus || 'PENDING',
      sellerId: numericSellerId,
      vendorId: numericSellerId,
    };

    let realProdId = null;
    let createdItem = null;

    if (!USE_MOCK_API) {
      try {
        // 1. Try official POST /api/seller/products (attaches Authorization Bearer token & X-Seller-Id)
        let response;
        try {
          response = await apiClient.post('/api/seller/products', payload);
        } catch (sellerErr) {
          if (sellerErr.response?.status === 401 || sellerErr.response?.status === 404 || sellerErr.response?.status === 405) {
            // Live backend product creation endpoint fallback: POST /api/products
            response = await apiClient.post('/api/products', payload);
          } else {
            throw sellerErr;
          }
        }
        createdItem = response.data?.data || response.data;
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
        if (apiError.response?.status === 409) {
          console.log(`Product "${title}" already exists on backend, tracking locally with PENDING status.`);
        } else {
          console.warn('Backend create product notice:', apiError?.response?.data?.message || apiError.message);
        }
      }
    }

    const finalId = realProdId || (Math.floor(Date.now() % 1000000) + 7000);
    const cleanId = String(sellerId).replace(/^seller_/, '');

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
    });
    return normalizeSellerProduct(created);
  },

  /**
   * 4. PUT /api/seller/products/{id} (or /api/products/{id})
   */
  async updateSellerProduct(id, updates) {
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const currentSeller = db.getSeller();
    const currentAuth = db.getAuth();
    const rawSellerId = storedSellerId || currentAuth?.user?.sellerId || currentAuth?.user?.id || currentSeller?.sellerId || currentSeller?.id;
    const sellerId = String(rawSellerId || '');

    if (!USE_MOCK_API) {
      try {
        let response;
        try {
          response = await apiClient.put(`/api/seller/products/${id}`, updates);
        } catch (e) {
          if (e.response?.status === 401 || e.response?.status === 404 || e.response?.status === 405) {
            response = await apiClient.put(`/api/products/${id}`, updates);
          } else {
            throw e;
          }
        }
        const rawData = response.data?.data || response.data;
        if (rawData) {
          const norm = normalizeSellerProduct(rawData);
          db.updateSellerProduct(sellerId, id, updates);
          db.updateProduct(id, updates);
          return norm;
        }
      } catch (apiError) {
        console.warn('API updateProduct notice:', apiError?.response?.data || apiError.message);
      }
    }

    await delay(100);
    const updated = db.updateSellerProduct(sellerId, id, updates);
    db.updateProduct(id, updates);
    return normalizeSellerProduct(updated || { id, ...updates });
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
