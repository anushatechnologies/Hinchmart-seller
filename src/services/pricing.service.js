import { apiClient, delay, USE_MOCK_API, canAccessSellerApi } from './api.js';
import { db } from '../mock/db.js';

export const pricingService = {
  async getPricingList() {
    const products = db.getSellerProducts();
    return products.map(p => ({
      id: p.id,
      name: p.title || p.name,
      title: p.title || p.name,
      sku: p.sku,
      category: p.category,
      brand: p.brand,
      unit: p.unit,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice || p.price,
      wholesalePrice: p.wholesalePrice || p.sellingPrice,
      dealerPrice: p.dealerPrice || p.sellingPrice,
      pricingTiers: p.bulkPricingTiers || p.pricingTiers || [],
      gstRate: p.gstRate || 18,
      marginPercent: p.mrp ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0,
    }));
  },

  async updateProductPrice(id, priceData) {
    const payload = {
      price: Number(priceData.price ?? priceData.sellingPrice),
      sellingPrice: Number(priceData.sellingPrice ?? priceData.price),
      mrp: Number(priceData.mrp ?? 0),
    };

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.put(`/api/products/${id}`, payload);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (apiErr) {
        // Fallback
      }
    }

    await delay(100);
    return db.updateSellerPrice(null, id, priceData) || db.updateProduct(id, {
      sellingPrice: priceData.sellingPrice,
      price: priceData.sellingPrice,
      mrp: priceData.mrp,
      bulkPricingTiers: priceData.bulkPricingTiers || priceData.pricingTiers,
    });
  },

  /**
   * 4.1 POST /api/seller/pricing/bulk-adjust
   */
  async applyBulkPriceAdjustment({ categoryId, brand, productIds, adjustmentType, value, applyTo }) {
    const products = db.getSellerProducts();
    const matchingProducts = products.filter(p => {
      if (Array.isArray(productIds) && productIds.length > 0) {
        return productIds.includes(p.id) || productIds.includes(Number(p.id)) || productIds.includes(p.productId);
      }
      let matches = true;
      if (categoryId && categoryId !== 'All' && p.category !== categoryId && String(p.categoryId) !== String(categoryId)) matches = false;
      if (brand && brand !== 'All' && p.brand?.toLowerCase() !== brand.toLowerCase()) matches = false;
      return matches;
    });

    const targetProductIds = matchingProducts.map(p => Number(p.id) || p.id);
    const normAdjType = (adjustmentType || '').toLowerCase().includes('percentage') ? 'PERCENTAGE' : 'FIXED';
    const normApplyTo = (applyTo || '').toUpperCase() === 'MRP' ? 'MRP' : 'PRICE';

    if (!USE_MOCK_API && canAccessSellerApi('/api/seller/pricing/bulk-adjust')) {
      try {
        const response = await apiClient.post('/api/seller/pricing/bulk-adjust', {
          productIds: targetProductIds,
          adjustmentType: normAdjType,
          adjustmentValue: Number(value),
          applyTo: normApplyTo,
        });
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (apiErr) {
        // Fallback
      }
    }

    await delay(200);
    const adjustments = [];
    matchingProducts.forEach(p => {
      let newSellingPrice = p.sellingPrice || p.price;
      let newMrp = p.mrp;

      if (normAdjType === 'PERCENTAGE') {
        if (normApplyTo === 'PRICE' || applyTo === 'both') newSellingPrice = Math.round(newSellingPrice * (1 + value / 100));
        if (normApplyTo === 'MRP' || applyTo === 'both') newMrp = Math.round(newMrp * (1 + value / 100));
      } else {
        if (normApplyTo === 'PRICE' || applyTo === 'both') newSellingPrice = Math.max(1, newSellingPrice + Number(value));
        if (normApplyTo === 'MRP' || applyTo === 'both') newMrp = Math.max(1, newMrp + Number(value));
      }

      adjustments.push({ id: p.id, newSellingPrice, newMrp });
      db.updateSellerPrice(null, p.id, { sellingPrice: newSellingPrice, mrp: newMrp });
    });

    return { totalUpdated: adjustments.length, adjustments };
  },

  /**
   * Phase 5 — Discounts & Promotions
   * Base: /api/seller/discounts
   */
  async getDiscounts() {
    if (canAccessSellerApi('/api/seller/discounts')) {
      try {
        const response = await apiClient.get('/api/seller/discounts');
        const list = response.data?.data || response.data;
        if (Array.isArray(list)) return list;
      } catch (err) {}
    }
    await delay(100);
    return [];
  },

  async getDiscountById(id) {
    if (canAccessSellerApi(`/api/seller/discounts/${id}`)) {
      try {
        const response = await apiClient.get(`/api/seller/discounts/${id}`);
        return response.data?.data || response.data;
      } catch (err) {}
    }
    await delay(100);
    return null;
  },

  async createDiscount(discountData) {
    if (canAccessSellerApi('/api/seller/discounts')) {
      try {
        const response = await apiClient.post('/api/seller/discounts', discountData);
        return response.data?.data || response.data;
      } catch (err) {}
    }
    await delay(150);
    return { id: `disc_${Date.now()}`, ...discountData, status: 'PENDING' };
  },

  async updateDiscount(id, discountData) {
    if (canAccessSellerApi(`/api/seller/discounts/${id}`)) {
      try {
        const response = await apiClient.put(`/api/seller/discounts/${id}`, discountData);
        return response.data?.data || response.data;
      } catch (err) {}
    }
    await delay(150);
    return { id, ...discountData };
  },

  async submitDiscountForReview(id) {
    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.patch(`/api/seller/discounts/${id}/submit`);
        return response.data?.data || response.data;
      } catch (err) {}
    }
    await delay(150);
    return { id, status: 'PENDING', message: 'Discount submitted for admin review.' };
  },
};
