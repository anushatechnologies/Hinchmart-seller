import { apiClient, delay, canAccessSellerApi } from './apiClient.js';
import { db } from '../mock/db.js';

export const enquiryService = {
  /**
   * 5.1 GET /api/seller/enquiries (View Buyer RFQ Enquiries)
   */
  async getEnquiries(filters = {}) {
    if (canAccessSellerApi('/api/seller/enquiries')) {
      try {
        const response = await apiClient.get('/api/seller/enquiries');
        const rawList = response.data?.data || response.data;
        if (Array.isArray(rawList)) {
          return rawList.map(e => ({
            ...e,
            id: e.enquiryId ? `enq_${e.enquiryId}` : (e.id || `enq_${Date.now()}`),
            enquiryId: Number(e.enquiryId || e.id || 142),
            company: e.buyerCompany || e.buyerName || e.company || 'Buyer Company',
            buyerName: e.buyerName || e.buyer?.name || 'Buyer',
            productName: e.productTitle || e.productName || 'Material Requirement',
            quantityRequired: e.requestedQty ? `${e.requestedQty} ${e.unit || 'KG'}` : (e.quantityRequired || '100 Units'),
            targetPrice: e.targetPrice ? `₹${e.targetPrice}` : (e.targetPrice || '₹800/unit'),
            status: e.status || 'New',
          }));
        }
      } catch (apiErr) {
        // Fallback gracefully
      }
    }

    await delay(100);
    let enquiries = db.getEnquiries();

    if (filters.status && filters.status !== 'All') {
      enquiries = enquiries.filter(e => e.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      enquiries = enquiries.filter(
        e =>
          (e.buyerName || '').toLowerCase().includes(q) ||
          (e.company || '').toLowerCase().includes(q) ||
          (e.productName || '').toLowerCase().includes(q)
      );
    }

    return enquiries;
  },

  async getEnquiryById(id) {
    await delay(150);
    const enquiry = db.getEnquiryById(id);
    if (!enquiry) throw new Error('Enquiry not found');
    return enquiry;
  },

  async updateEnquiryStatus(id, { status, quotationId }) {
    await delay(200);
    return db.updateEnquiryStatus(id, status, quotationId);
  }
};
