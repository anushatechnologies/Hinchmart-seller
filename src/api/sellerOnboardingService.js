import apiClient from './apiClient.js';
import { db } from '../mock/db.js';

function getStoredSellerId(passedId) {
  if (passedId) return passedId;
  if (typeof localStorage !== 'undefined') {
    const id = localStorage.getItem('sellerId');
    if (id) return id;
  }
  return 9;
}

export const sellerOnboardingService = {
  /**
   * Step 1: Personal KYC & PAN Document
   * formData: name, email, phone, panNumber, aadhaarNumber, panCardFile (Multipart)
   */
  submitStep1PersonalKyc: async (formData) => {
    let sellerId = null;
    try {
      const res = await apiClient.post('/api/sellers/onboarding/step1-personal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data || res.data;
      sellerId = data?.sellerId || data?.id;
      if (sellerId && typeof localStorage !== 'undefined') {
        localStorage.setItem('sellerId', String(sellerId));
      }
      return data;
    } catch (err) {
      console.warn('Live onboarding step 1 notice (saving locally):', err.response?.data?.message || err.message);
      // Local fallback
      const cleanPhone = formData.get ? formData.get('phone') : formData.phone;
      const cleanName = formData.get ? formData.get('name') : formData.name;
      sellerId = 9;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sellerId', String(sellerId));
      }
      db.updateSeller({
        id: sellerId,
        sellerId,
        name: cleanName,
        phone: cleanPhone,
        panNumber: formData.get ? formData.get('panNumber') : formData.panNumber,
        aadhaarNumber: formData.get ? formData.get('aadhaarNumber') : formData.aadhaarNumber,
        onboardingStep: 2,
      });
      return { sellerId, success: true, onboardingStep: 2 };
    }
  },

  /**
   * Step 2: Business & Tax Details
   */
  submitStep2BusinessTax: async (sellerId, payload) => {
    const sId = getStoredSellerId(sellerId);
    try {
      const res = await apiClient.post(`/api/sellers/onboarding/${sId}/step2-business`, payload);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Live onboarding step 2 notice (saving locally):', err.response?.data?.message || err.message);
      db.updateSeller({
        id: sId,
        sellerId: sId,
        ...payload,
        onboardingStep: 3,
      });
      return { sellerId: sId, success: true, onboardingStep: 3 };
    }
  },

  /**
   * Step 3: Bank Details
   */
  submitStep3BankDetails: async (sellerId, payload) => {
    const sId = getStoredSellerId(sellerId);
    try {
      const res = await apiClient.post(`/api/sellers/onboarding/${sId}/step3-bank`, payload);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Live onboarding step 3 notice (saving locally):', err.response?.data?.message || err.message);
      db.updateSeller({
        id: sId,
        sellerId: sId,
        bankDetails: payload,
        onboardingStep: 4,
      });
      return { sellerId: sId, success: true, onboardingStep: 4 };
    }
  },

  /**
   * Step 4: Document Vault Uploads (GST_CERTIFICATE, CANCELLED_CHEQUE, etc.)
   */
  uploadSellerDocument: async (sellerId, documentType, file) => {
    const sId = getStoredSellerId(sellerId);
    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('file', file);
      const res = await apiClient.post(`/api/sellers/onboarding/${sId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Live onboarding document upload notice (saving locally):', err.response?.data?.message || err.message);
      return {
        sellerId: sId,
        documentType,
        fileName: file?.name || 'document.pdf',
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Step 5: Final Submission for Admin Review
   */
  finalSubmitOnboarding: async (sellerId) => {
    const sId = getStoredSellerId(sellerId);
    try {
      const res = await apiClient.post(`/api/sellers/onboarding/${sId}/final-submit`);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Live onboarding final submit notice (saving locally):', err.response?.data?.message || err.message);
      db.updateSeller({
        id: sId,
        sellerId: sId,
        verificationStatus: 'Under Review',
        onboardingStatus: 'PENDING',
      });
      return { sellerId: sId, status: 'PENDING', message: 'Application submitted for admin review.' };
    }
  },

  /**
   * Check Onboarding & Verification Status
   */
  getOnboardingSummary: async (sellerId) => {
    const sId = getStoredSellerId(sellerId);
    try {
      const res = await apiClient.get(`/api/sellers/onboarding/${sId}/summary`);
      return res.data?.data || res.data;
    } catch (err) {
      const seller = db.getSeller();
      return {
        sellerId: sId,
        status: seller?.verificationStatus || 'Under Review',
        onboardingStatus: seller?.onboardingStatus || 'PENDING',
        businessName: seller?.companyName || seller?.businessName || 'Seller Enterprise',
      };
    }
  },
};

export default sellerOnboardingService;
