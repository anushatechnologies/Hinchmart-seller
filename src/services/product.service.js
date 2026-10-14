import { apiClient, delay, USE_MOCK_API } from './api.js';
import { db } from '../mock/db.js';

/**
 * Normalizes a product item across both backend API and mock formats
 */
export function normalizeProductItem(p) {
  if (!p) return null;
  const productId = p.productId ?? p.id;
  const title = p.title || p.name || 'Construction Product';
  const price = Number(p.price ?? p.sellingPrice ?? 0);
  const mrp = Number(p.mrp ?? (price ? Math.round(price * 1.12) : 0));
  const stockQty = Number(p.stockQty ?? p.stock ?? 0);
  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (p.imageUrl ? [p.imageUrl] : (p.image ? [p.image] : []));

  const status = p.status || (p.active === false ? 'Draft' : 'Active');

  return {
    ...p,
    id: productId,
    productId,
    name: title,
    title,
    slug: p.slug || String(productId),
    sku: p.sku || `SKU-${productId}`,
    description: p.description || p.fullDescription || p.shortDescription || '',
    shortDescription: p.shortDescription || p.description || '',
    fullDescription: p.fullDescription || p.description || '',
    price,
    sellingPrice: price,
    mrp,
    wholesalePrice: Number(p.wholesalePrice ?? (price ? Math.round(price * 0.95) : 0)),
    dealerPrice: Number(p.dealerPrice ?? (price ? Math.round(price * 0.92) : 0)),
    unit: p.unit || 'Ton',
    moq: Number(p.moq || 1),
    stock: stockQty,
    stockQty,
    rating: Number(p.rating || 0),
    reviewCount: Number(p.reviewCount || 0),
    gstRate: Number(p.gstRate || 18),
    hsnCode: p.hsnCode || p.hsn || '',
    is24HourDelivery: Boolean(p.is24HourDelivery),
    active: p.active !== undefined ? Boolean(p.active) : status.toLowerCase() === 'active',
    status,
    approvalStatus: p.approvalStatus || (status === 'Active' ? 'Approved' : 'Pending'),
    brand: p.brandName || p.brand || '',
    brandName: p.brandName || p.brand || '',
    brandId: p.brandId ?? null,
    category: p.categoryName || p.category || '',
    categoryName: p.categoryName || p.category || '',
    categoryId: p.categoryId ?? null,
    subcategory: p.subcategoryName || p.subcategory || '',
    subcategoryName: p.subcategoryName || p.subcategory || '',
    subcategoryId: p.subcategoryId ?? null,
    images,
    imageUrl: images[0] || p.imageUrl || p.image || null,
    specifications: typeof p.specifications === 'object' && p.specifications !== null ? p.specifications : {},
    bulkPricingTiers: Array.isArray(p.bulkPricingTiers) ? p.bulkPricingTiers : (p.pricingTiers || []),
    pricingTiers: Array.isArray(p.pricingTiers) ? p.pricingTiers : (p.bulkPricingTiers || []),
    vendor: p.vendor || null,
    createdAt: p.createdAt || new Date().toISOString(),
  };
}

export const productService = {
  /**
   * 1. GET /api/products with multi-level filtering
   * Supports: categoryId, subcategoryId, brandId, search, sortBy, page, limit, price filters
   */
  async getProducts(filters = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 1000,
    };

    if (filters.categoryId && filters.categoryId !== 'All') params.categoryId = filters.categoryId;
    if (filters.subcategoryId && filters.subcategoryId !== 'All') params.subcategoryId = filters.subcategoryId;
    if (filters.brandId && filters.brandId !== 'All') params.brandId = filters.brandId;
    if (filters.search) params.search = filters.search;
    if (filters.sortBy) params.sortBy = filters.sortBy;

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.get('/api/products', { params });
        const rawData = response.data?.data || response.data;

        if (Array.isArray(rawData)) {
          return rawData.map(p => normalizeProductItem(p));
        }
        if (rawData?.products && Array.isArray(rawData.products)) {
          return rawData.products.map(p => normalizeProductItem(p));
        }
      } catch (apiError) {
        console.warn('Backend products API notice:', apiError.message);
      }
    }

    // Local Mock DB Fallback
    await delay(200);
    let products = (db.getProducts() || []).map(p => normalizeProductItem(p));

    if (filters.status && filters.status !== 'All') {
      products = products.filter(p => p.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.category && filters.category !== 'All') {
      products = products.filter(p => 
        String(p.categoryId) === String(filters.category) ||
        p.category?.toLowerCase() === String(filters.category).toLowerCase() ||
        p.categoryName?.toLowerCase() === String(filters.category).toLowerCase()
      );
    }

    if (filters.brand && filters.brand !== 'All') {
      products = products.filter(p => 
        String(p.brandId) === String(filters.brand) ||
        p.brand?.toLowerCase() === String(filters.brand).toLowerCase() ||
        p.brandName?.toLowerCase() === String(filters.brand).toLowerCase()
      );
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        p =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.id && String(p.id).toLowerCase().includes(q)) ||
          (p.productId && String(p.productId).toLowerCase().includes(q)) ||
          (p.hsnCode && p.hsnCode.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q))
      );
    }

    if (filters.stockStatus && filters.stockStatus !== 'All') {
      if (filters.stockStatus === 'inStock') {
        products = products.filter(p => p.stock > (p.lowStockThreshold || 0));
      } else if (filters.stockStatus === 'lowStock') {
        products = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 0));
      } else if (filters.stockStatus === 'outOfStock') {
        products = products.filter(p => (p.stock || 0) === 0);
      }
    }

    if (filters.minPrice !== undefined && filters.minPrice !== '') {
      products = products.filter(p => p.sellingPrice >= Number(filters.minPrice));
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      products = products.filter(p => p.sellingPrice <= Number(filters.maxPrice));
    }

    // Sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'nameAsc':
          products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'nameDesc':
          products.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
          break;
        case 'newest':
          products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          break;
        case 'oldest':
          products.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
          break;
        case 'priceAsc':
        case 'price_asc':
          products.sort((a, b) => a.sellingPrice - b.sellingPrice);
          break;
        case 'priceDesc':
        case 'price_desc':
          products.sort((a, b) => b.sellingPrice - a.sellingPrice);
          break;
        case 'stockAsc':
          products.sort((a, b) => a.stock - b.stock);
          break;
        case 'stockDesc':
          products.sort((a, b) => b.stock - a.stock);
          break;
        default:
          break;
      }
    }

    return products;
  },

  /**
   * 2. GET /api/products/search-suggestions?query={searchQuery}
   */
  async getSearchSuggestions(query) {
    if (!query || query.trim().length === 0) return [];

    const cleanQuery = query.trim();

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.get('/api/products/search-suggestions', {
          params: { query: cleanQuery },
        });
        const data = response.data?.data || response.data;
        if (Array.isArray(data)) {
          return data;
        }
      } catch (apiError) {
        console.warn('Backend search suggestions API notice:', apiError.message);
      }
    }

    // Fallback Local Suggestions
    await delay(100);
    const q = cleanQuery.toLowerCase();
    const products = (db.getProducts() || []).map(p => normalizeProductItem(p));
    const suggestions = [];

    // Check matching products
    products
      .filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(p => {
        suggestions.push({
          type: 'PRODUCT',
          id: p.id,
          title: p.name,
          subtitle: `₹${Number(p.price || 0).toLocaleString('en-IN')} / ${p.unit || 'Unit'}`,
          link: `/seller/products/${p.id}`,
        });
      });

    // Check matching brands
    const matchingBrands = [...new Set(products.map(p => p.brand).filter(Boolean))].filter(b => b.toLowerCase().includes(q)).slice(0, 3);
    matchingBrands.forEach((b, idx) => {
      suggestions.push({
        type: 'BRAND',
        id: `brand_${idx}`,
        title: b,
        subtitle: 'in Construction Materials',
        link: `/seller/products?brand=${encodeURIComponent(b)}`,
      });
    });

    return suggestions;
  },

  /**
   * 3. GET /api/products/{id}
   */
  async getProductById(id) {
    if (!id) throw new Error('Product ID is required');

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.get(`/api/products/${id}`);
        const data = response.data?.data || response.data;
        if (data) {
          return normalizeProductItem(data);
        }
      } catch (apiError) {
        console.warn(`Backend product detail API for ID ${id} notice:`, apiError.message);
      }
    }

    // Fallback Mock DB
    await delay(150);
    const product = db.getProductById(id);
    if (!product) {
      // Also check if any product matches string id
      const all = db.getProducts();
      const match = all.find(p => String(p.id) === String(id) || String(p.productId) === String(id));
      if (match) return normalizeProductItem(match);
      throw new Error('Product not found');
    }
    return normalizeProductItem(product);
  },

  /**
   * 4. POST /api/products
   * Payload: { brandId, title, sku, description, price, mrp, unit, moq, stockQty, active, is24HourDelivery, ... }
   */
  async createProduct(productData) {
    const payload = {
      categoryId: Number(productData.categoryId) || null,
      subcategoryId: Number(productData.subcategoryId) || null,
      brandId: Number(productData.brandId) || (productData.brand?.brandId ? Number(productData.brand.brandId) : null),
      title: String(productData.title || productData.name || '').trim(),
      name: String(productData.title || productData.name || '').trim(),
      slug: String(productData.slug || (productData.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim(),
      sku: String(productData.sku || '').trim(),
      description: String(productData.description || productData.fullDescription || productData.shortDescription || '').trim(),
      price: Number(productData.price || productData.sellingPrice || 0),
      sellingPrice: Number(productData.price || productData.sellingPrice || 0),
      mrp: Number(productData.mrp || (productData.price ? productData.price * 1.12 : 0)),
      unit: String(productData.unit || 'Ton').trim(),
      moq: Number(productData.moq || 1),
      stockQty: Number(productData.stockQty || productData.stock || 0),
      hsnCode: String(productData.hsnCode || productData.hsn || '').trim(),
      gstRate: Number(productData.gstRate ?? productData.gst ?? 18),
      active: productData.active !== undefined ? Boolean(productData.active) : true,
      is24HourDelivery: Boolean(productData.is24HourDelivery),
      specifications: productData.specifications || {},
      bulkPricingTiers: Array.isArray(productData.bulkPricingTiers) ? productData.bulkPricingTiers : (productData.pricingTiers || []),
      images: Array.isArray(productData.images) ? productData.images : (productData.imageUrl ? [productData.imageUrl] : []),
      imageUrl: Array.isArray(productData.images) && productData.images.length > 0 ? productData.images[0] : (productData.imageUrl || null),
    };

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.post('/api/products', payload);
        const created = response.data?.data || response.data;
        if (created) {
          const normalized = normalizeProductItem(created);
          db.createProduct(normalized);
          return normalized;
        }
      } catch (apiError) {
        console.warn('Backend create product API notice (falling back to local storage):', apiError.message);
      }
    }

    // Local Mock DB Fallback
    await delay(300);
    const createdLocal = db.createProduct(normalizeProductItem(productData));
    return createdLocal;
  },

  /**
   * 5. PUT / PATCH /api/products/{id}
   */
  async updateProduct(id, updates) {
    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.put(`/api/products/${id}`, updates);
        const updated = response.data?.data || response.data;
        if (updated) {
          const normalized = normalizeProductItem(updated);
          db.updateProduct(id, normalized);
          return normalized;
        }
      } catch (apiError) {
        console.warn(`Backend update product API for ID ${id} notice:`, apiError.message);
      }
    }

    await delay(300);
    const localUpdated = db.updateProduct(id, updates);
    return normalizeProductItem(localUpdated || { id, ...updates });
  },

  /**
   * 6. DELETE /api/products/{id}
   */
  async deleteProduct(id) {
    if (!USE_MOCK_API) {
      try {
        await apiClient.delete(`/api/products/${id}`);
      } catch (apiError) {
        console.warn(`Backend delete product API for ID ${id} notice:`, apiError.message);
      }
    }

    await delay(250);
    return db.deleteProduct(id);
  },

  async archiveProduct(id) {
    await delay(200);
    return this.updateProduct(id, { status: 'Archived', active: false });
  },

  async restoreProduct(id) {
    await delay(200);
    return this.updateProduct(id, { status: 'Active', active: true });
  },

  async duplicateProduct(id) {
    await delay(300);
    const original = await this.getProductById(id);
    if (!original) throw new Error('Product not found');
    const copy = {
      ...original,
      title: `${original.title || original.name} (Copy)`,
      name: `${original.name || original.title} (Copy)`,
      sku: `${original.sku}-COPY`,
      status: 'Draft',
      active: false,
    };
    delete copy.id;
    delete copy.productId;
    return this.createProduct(copy);
  },

  async bulkImportProducts(productsList) {
    await delay(600);
    const results = [];
    for (const p of productsList) {
      const created = await this.createProduct(p);
      results.push(created);
    }
    return { count: results.length, products: results };
  },
};
