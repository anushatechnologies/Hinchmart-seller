import { apiClient, delay, USE_MOCK_API, canAccessSellerApi } from './api.js';
import { db } from '../mock/db.js';

export const quotationService = {
  /**
   * 6.3 GET /api/seller/quotations
   */
  async getQuotations(filters = {}) {
    if (canAccessSellerApi('/api/seller/quotations')) {
      try {
        const response = await apiClient.get('/api/seller/quotations');
        const rawList = response.data?.data || response.data;
        if (Array.isArray(rawList)) {
          return rawList.map(q => ({
            ...q,
            id: q.quotationId ? `quot_${q.quotationId}` : (q.id || `quot_${q.id || Date.now()}`),
            quotationNumber: q.quotationNumber || `QTN-${q.quotationId || q.id || '101'}`,
            buyer: {
              name: q.buyerName || q.buyer?.name || 'Buyer',
              company: q.buyerCompany || q.buyer?.company || q.buyerName || 'Client Ltd',
              email: q.buyerEmail || q.buyer?.email || '',
            },
            total: q.grandTotal ?? q.total ?? 0,
          }));
        }
      } catch (apiErr) {
        // Fallback
      }
    }

    await delay(100);
    let quotations = db.getQuotations();

    if (filters.status && filters.status !== 'All') {
      quotations = quotations.filter(q => q.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      quotations = quotations.filter(
        item =>
          (item.quotationNumber || '').toLowerCase().includes(q) ||
          (item.buyer?.company || '').toLowerCase().includes(q) ||
          (item.buyer?.name || '').toLowerCase().includes(q)
      );
    }

    return quotations;
  },

  async getQuotationById(id) {
    await delay(100);
    const quotation = db.getQuotationById(id);
    if (!quotation) throw new Error('Quotation not found');
    return quotation;
  },

  /**
   * 5.2 POST /api/seller/quotations (Submit Quotation Proposal to Buyer)
   * Request Body: { enquiryId, quotedPricePerUnit, validUntil, notes }
   */
  async createQuotation(quotationData) {
    const enquiryId = Number(quotationData.enquiryId) || 142;
    const quotedPricePerUnit = Number(
      quotationData.quotedPricePerUnit ?? quotationData.pricePerUnit ?? quotationData.items?.[0]?.unitPrice ?? 810.0
    );
    const validUntil = quotationData.validUntil || new Date(Date.now() + (Number(quotationData.validityDays) || 15) * 86400000).toISOString();
    const notes = quotationData.notes || quotationData.termsAndConditions || 'Includes free delivery to industrial zone';

    const payload = {
      enquiryId,
      quotedPricePerUnit,
      validUntil,
      notes,
      // Extended fields for local and backwards compatibility
      buyerName: quotationData.buyerName || quotationData.buyer?.name || 'Buyer',
      buyerEmail: quotationData.buyerEmail || quotationData.buyer?.email || 'buyer@example.com',
      buyerPhone: quotationData.buyerPhone || quotationData.buyer?.phone || '+91 98765 12345',
      validityDays: Number(quotationData.validityDays || 15),
      freightCharge: Number(quotationData.freightCharge || quotationData.freightCharges || 0),
      items: (quotationData.items || []).map(i => ({
        productId: Number(i.productId) || i.productId || 1,
        productTitle: i.productTitle || i.name || 'Product',
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.unitPrice || i.price || quotedPricePerUnit),
        gstRate: Number(i.gstRate || 18),
      })),
    };

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.post('/api/seller/quotations', payload);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (apiErr) {
        // Fallback
      }
    }

    await delay(300);
    return db.createQuotation(quotationData);
  },

  async updateQuotation(id, updates) {
    await delay(250);
    return db.updateQuotation(id, updates);
  },

  async deleteQuotation(id) {
    await delay(200);
    return db.deleteQuotation(id);
  },

  /**
   * 5.1 GET /api/seller/quotations/enquiries (View Buyer RFQ Enquiries)
   */
  async getEnquiries() {
    if (canAccessSellerApi('/api/seller/quotations/enquiries')) {
      try {
        const response = await apiClient.get('/api/seller/quotations/enquiries');
        const list = response.data?.data || response.data;
        if (Array.isArray(list)) return list;
      } catch (err) {
        // Fallback
      }
    }
    await delay(150);
    return [
      {
        enquiryId: 142,
        buyerName: 'Vikram Mehta',
        buyerCompany: 'Surat Fabrics Mills',
        productTitle: 'Rose Pink Reactive Dye',
        requestedQty: 500,
        unit: 'KG',
        targetPrice: 800.0,
        createdAt: new Date().toISOString(),
      },
    ];
  },
};
