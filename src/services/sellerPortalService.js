import { apiClient, delay, USE_MOCK_API, canAccessSellerApi } from './apiClient.js';
import { db } from '../mock/db.js';

export const sellerPortalService = {
  // =========================================================================
  // 1. PRODUCT MANAGEMENT (/api/seller/products)
  // =========================================================================

  /**
   * 1.1 Paginated product listing
   * GET /api/seller/products?page=1&limit=12&search=TMT&status=ACTIVE
   */
  async getSellerProducts(params = {}) {
    if (canAccessSellerApi('/api/seller/products')) {
      try {
        const response = await apiClient.get('/api/seller/products', { params });
        const data = response.data?.data || response.data;
        if (Array.isArray(data)) return data;
        if (data?.content && Array.isArray(data.content)) return data.content;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return db.getSellerProducts();
  },

  /**
   * 1.2 Get single product details
   * GET /api/seller/products/{id}
   */
  async getSellerProductById(id) {
    if (canAccessSellerApi(`/api/seller/products/${id}`)) {
      try {
        const response = await apiClient.get(`/api/seller/products/${id}`);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(50);
    return db.getProductById(id);
  },

  /**
   * 1.3 Create new catalog item
   * POST /api/seller/products
   */
  async createProduct(productData) {
    if (canAccessSellerApi('/api/seller/products')) {
      try {
        const response = await apiClient.post('/api/seller/products', productData);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(150);
    return db.addProduct({
      ...productData,
      status: 'PENDING_APPROVAL',
      sellerId: 1,
    });
  },

  /**
   * 1.4 Update existing product info
   * PUT /api/seller/products/{id}
   */
  async updateProduct(id, updates) {
    if (canAccessSellerApi(`/api/seller/products/${id}`)) {
      try {
        const response = await apiClient.put(`/api/seller/products/${id}`, updates);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return db.updateProduct(id, updates);
  },

  /**
   * 1.5 Update stock quantity & threshold
   * PATCH /api/seller/products/{id}/stock
   */
  async updateProductStock(id, stockData) {
    if (canAccessSellerApi(`/api/seller/products/${id}/stock`)) {
      try {
        const response = await apiClient.patch(`/api/seller/products/${id}/stock`, stockData);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return db.updateProduct(id, {
      stockQuantity: stockData.stockQuantity,
      lowStockThreshold: stockData.lowStockThreshold,
    });
  },

  /**
   * 1.6 Update price & bulk tier rules
   * PATCH /api/seller/products/{id}/pricing
   */
  async updateProductPricing(id, pricingData) {
    if (canAccessSellerApi(`/api/seller/products/${id}/pricing`)) {
      try {
        const response = await apiClient.patch(`/api/seller/products/${id}/pricing`, pricingData);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return db.updateProduct(id, {
      price: pricingData.basePrice,
      bulkPricing: pricingData.tiers,
    });
  },

  /**
   * 1.7 Soft-delete product
   * DELETE /api/seller/products/{id}
   */
  async deleteProduct(id) {
    if (canAccessSellerApi(`/api/seller/products/${id}`)) {
      try {
        const response = await apiClient.delete(`/api/seller/products/${id}`);
        return response.data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return db.deleteProduct(id);
  },

  // =========================================================================
  // 2. WAREHOUSES & INVENTORY (/api/seller/warehouses, /api/seller/inventory)
  // =========================================================================

  /**
   * 2.1 List seller warehouses
   * GET /api/seller/warehouses
   */
  async getWarehouses() {
    if (canAccessSellerApi('/api/seller/warehouses')) {
      try {
        const response = await apiClient.get('/api/seller/warehouses');
        const rawList = response.data?.data || response.data;
        if (Array.isArray(rawList)) {
          return rawList.map((w) => ({
            ...w,
            id: w.id || `wh_${w.warehouseId || 1}`,
            warehouseId: w.warehouseId ?? w.id,
          }));
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(50);
    return db.getWarehouses();
  },

  /**
   * 2.2 Add a new warehouse location
   * POST /api/seller/warehouses
   */
  async createWarehouse(whData) {
    if (canAccessSellerApi('/api/seller/warehouses')) {
      try {
        const response = await apiClient.post('/api/seller/warehouses', whData);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(150);
    return db.addWarehouse(whData);
  },

  /**
   * 2.3 Adjust product inventory count
   * POST /api/seller/inventory/adjust
   */
  async adjustInventory(adjustmentData) {
    if (canAccessSellerApi('/api/seller/inventory/adjust')) {
      try {
        const response = await apiClient.post('/api/seller/inventory/adjust', adjustmentData);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return {
      success: true,
      productId: adjustmentData.productId,
      quantity: adjustmentData.quantity,
      adjustmentType: adjustmentData.adjustmentType || 'MANUAL',
    };
  },

  // =========================================================================
  // 3. RFQ ENQUIRIES & QUOTATIONS (/api/seller/enquiries, /api/seller/quotations)
  // =========================================================================

  /**
   * 3.1 Get incoming buyer RFQs & enquiries
   * GET /api/seller/enquiries
   */
  async getEnquiries(params = {}) {
    if (canAccessSellerApi('/api/seller/enquiries')) {
      try {
        const response = await apiClient.get('/api/seller/enquiries', { params });
        const rawList = response.data?.data || response.data;
        if (Array.isArray(rawList)) return rawList;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return db.getEnquiries();
  },

  /**
   * 3.2 List quotations created by this seller
   * GET /api/seller/quotations
   */
  async getQuotations(params = {}) {
    if (canAccessSellerApi('/api/seller/quotations')) {
      try {
        const response = await apiClient.get('/api/seller/quotations', { params });
        const rawList = response.data?.data || response.data;
        if (Array.isArray(rawList)) return rawList;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return db.getQuotations();
  },

  /**
   * 3.3 Submit a customized price quote for an RFQ
   * POST /api/seller/quotations
   */
  async createQuotation(quoteData) {
    if (canAccessSellerApi('/api/seller/quotations')) {
      try {
        const response = await apiClient.post('/api/seller/quotations', quoteData);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(150);
    return db.addQuotation(quoteData);
  },

  // =========================================================================
  // 4. SELLER DISCOUNTS & PROMOTIONS (/api/seller/discounts)
  // =========================================================================

  /**
   * 4.1 List all seller discount rules
   * GET /api/seller/discounts
   */
  async getSellerDiscounts() {
    if (canAccessSellerApi('/api/seller/discounts')) {
      try {
        const response = await apiClient.get('/api/seller/discounts');
        const rawList = response.data?.data || response.data;
        if (Array.isArray(rawList)) return rawList;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return [
      {
        id: 1,
        title: 'Bulk Tier Discount',
        discountPercentage: 5,
        minOrderQuantity: 100,
        status: 'ACTIVE',
      },
    ];
  },

  /**
   * 4.2 Create new volume discount rule
   * POST /api/seller/discounts
   */
  async createDiscount(discountData) {
    if (canAccessSellerApi('/api/seller/discounts')) {
      try {
        const response = await apiClient.post('/api/seller/discounts', discountData);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(150);
    return {
      id: Math.floor(Math.random() * 1000) + 1,
      ...discountData,
      status: 'PENDING_APPROVAL',
    };
  },

  /**
   * 4.3 Update discount rule
   * PUT /api/seller/discounts/{id}
   */
  async updateDiscount(id, updates) {
    if (canAccessSellerApi(`/api/seller/discounts/${id}`)) {
      try {
        const response = await apiClient.put(`/api/seller/discounts/${id}`, updates);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return { id, ...updates };
  },

  /**
   * 4.4 Submit discount rule for Admin approval
   * PATCH /api/seller/discounts/{id}/submit
   */
  async submitDiscountForReview(id) {
    if (canAccessSellerApi(`/api/seller/discounts/${id}/submit`)) {
      try {
        const response = await apiClient.patch(`/api/seller/discounts/${id}/submit`);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return { id, status: 'PENDING_APPROVAL' };
  },
};

export default sellerPortalService;
