import { apiClient, delay, USE_MOCK_API, canAccessSellerApi } from './apiClient.js';
import { db } from '../mock/db.js';

/**
 * Journey 9: Discounts & Promos Service
 * Controller: SellerDiscountController.java
 * Base Path: /api/seller/discounts
 */
export const discountService = {
  /**
   * 9.1 Create Seller Discount / Coupon
   * POST /api/seller/discounts
   * Request Body:
   * {
   *   code: string,
   *   discountType: 'PERCENTAGE' | 'FIXED',
   *   discountValue: number,
   *   startDate: string (YYYY-MM-DD),
   *   endDate: string (YYYY-MM-DD),
   *   minimumOrderAmount: number,
   *   maxDiscountAmount: number
   * }
   */
  async createDiscount(discountData) {
    const payload = {
      code: String(discountData.code || '').trim().toUpperCase(),
      discountType: String(discountData.discountType || 'FIXED').toUpperCase(),
      discountValue: Number(discountData.discountValue || 0),
      startDate: discountData.startDate || new Date().toISOString().split('T')[0],
      endDate: discountData.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      minimumOrderAmount: Number(discountData.minimumOrderAmount || 0),
      maxDiscountAmount: Number(discountData.maxDiscountAmount || discountData.discountValue || 0),
      ...discountData,
    };

    if (!USE_MOCK_API && canAccessSellerApi('/api/seller/discounts')) {
      try {
        const response = await apiClient.post('/api/seller/discounts', payload);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        console.warn('POST /api/seller/discounts fallback:', err?.response?.data?.message || err.message);
      }
    }

    await delay(150);
    return {
      id: `disc_${Date.now()}`,
      discountId: Date.now() % 10000,
      ...payload,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * 9.2 Submit Discount for Review
   * PATCH /api/seller/discounts/{discountId}/submit
   */
  async submitDiscountForReview(discountId) {
    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.patch(`/api/seller/discounts/${discountId}/submit`);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        console.warn(`PATCH /api/seller/discounts/${discountId}/submit fallback:`, err?.response?.data?.message || err.message);
      }
    }

    await delay(150);
    return {
      id: discountId,
      status: 'PENDING_REVIEW',
      message: 'Discount submitted for admin review.',
    };
  },

  /**
   * List Seller Discounts
   * GET /api/seller/discounts
   */
  async getDiscounts() {
    if (!USE_MOCK_API && canAccessSellerApi('/api/seller/discounts')) {
      try {
        const response = await apiClient.get('/api/seller/discounts');
        const list = response.data?.data || response.data;
        if (Array.isArray(list)) return list;
      } catch (err) {
        console.warn('GET /api/seller/discounts fallback:', err?.message);
      }
    }

    await delay(100);
    return [];
  },

  /**
   * Get Single Discount Details
   * GET /api/seller/discounts/{id}
   */
  async getDiscountById(id) {
    if (!USE_MOCK_API && canAccessSellerApi(`/api/seller/discounts/${id}`)) {
      try {
        const response = await apiClient.get(`/api/seller/discounts/${id}`);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        console.warn(`GET /api/seller/discounts/${id} fallback:`, err?.message);
      }
    }

    await delay(100);
    return null;
  },

  /**
   * Update Discount Details
   * PUT /api/seller/discounts/{id}
   */
  async updateDiscount(id, discountData) {
    if (!USE_MOCK_API && canAccessSellerApi(`/api/seller/discounts/${id}`)) {
      try {
        const response = await apiClient.put(`/api/seller/discounts/${id}`, discountData);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        console.warn(`PUT /api/seller/discounts/${id} fallback:`, err?.message);
      }
    }

    await delay(150);
    return { id, ...discountData };
  },
};

export default discountService;

