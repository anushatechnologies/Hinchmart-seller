import { apiClient, delay, hasValidLiveAuth, canAccessSellerApi } from './apiClient.js';
import { db } from '../mock/db.js';
import { sellerOnboardingService } from './sellerOnboarding.service.js';

let cachedStoreProfile = null;
let lastStoreCheckTime = 0;

export const sellerService = {
  async getProfile(sellerId) {
    if (canAccessSellerApi(`/api/sellers/onboarding/${sellerId}/summary`) && sellerId) {
      try {
        return await sellerOnboardingService.getSellerProfile(sellerId);
      } catch (err) {
        // Fallback
      }
    }
    await delay(100);
    return db.getSeller(sellerId);
  },

  async updateProfile(updates) {
    await delay(150);
    return db.updateSeller(updates);
  },

  async getDocumentVault(sellerId) {
    return sellerOnboardingService.getDocumentVault(sellerId);
  },

  /**
   * 5.1 GET /api/seller/documents
   */
  async getDocuments(sellerId) {
    const localDocs = (db.getDocuments ? db.getDocuments() : []) || [];
    let storedPhotos = {};
    if (typeof localStorage !== 'undefined') {
      try {
        storedPhotos = JSON.parse(localStorage.getItem('hinchmart_kyc_photos') || '{}');
      } catch (_) {}
    }

    const baseTemplates = [
      { documentType: 'PAN', label: 'PAN Card', name: 'PAN Card', fileName: null, fileUrl: null, photoUrl: null, status: 'Not Uploaded' },
      { documentType: 'AADHAAR', label: 'Aadhaar Card', name: 'Aadhaar Card', fileName: null, fileUrl: null, photoUrl: null, status: 'Not Uploaded' },
      { documentType: 'GSTIN', label: 'GSTIN Certificate', name: 'GSTIN Certificate', fileName: null, fileUrl: null, photoUrl: null, status: 'Not Uploaded' },
      { documentType: 'INCORPORATION', label: 'Certificate of Incorporation', name: 'Certificate of Incorporation', fileName: null, fileUrl: null, photoUrl: null, status: 'Not Uploaded' },
      { documentType: 'MSME', label: 'MSME/Udyam Registration', name: 'MSME Registration', fileName: null, fileUrl: null, photoUrl: null, status: 'Not Uploaded' },
      { documentType: 'TRADE_LICENSE', label: 'Trade License', name: 'Trade License', fileName: null, fileUrl: null, photoUrl: null, status: 'Not Uploaded' },
    ];

    let backendList = [];
    if (canAccessSellerApi('/api/seller/documents')) {
      try {
        const response = await apiClient.get('/api/seller/documents');
        const rawList = response.data?.data || response.data;
        if (Array.isArray(rawList)) {
          backendList = rawList;
        }
      } catch (err) {
        // Fallback
      }
    }

    if (sellerId && backendList.length === 0 && canAccessSellerApi('/api/seller/documents')) {
      try {
        const docs = await sellerOnboardingService.getSellerDocuments(sellerId);
        if (Array.isArray(docs)) backendList = docs;
      } catch (err) {
        // Fallback
      }
    }

    // Merge: Base Templates + Live Backend + Local DB Documents + Stored KYC Photos
    return baseTemplates.map((tpl) => {
      const merged = { ...tpl };

      // 1. Backend Match
      const bMatch = backendList.find((m) => (m.documentType || m.type || '').toUpperCase() === tpl.documentType);
      if (bMatch && bMatch.status && bMatch.status !== 'Not Uploaded') {
        Object.assign(merged, bMatch);
        merged.status = bMatch.status === 'VERIFIED' ? 'Verified' : 'Pending';
      }

      // 2. Local DB Compliance Document Match
      const lMatch = localDocs.find((d) => {
        const t = (d.type || d.documentType || d.name || '').toUpperCase();
        if (tpl.documentType === 'PAN' && t.includes('PAN')) return true;
        if (tpl.documentType === 'AADHAAR' && (t.includes('AADHAAR') || t.includes('AADHAR'))) return true;
        if (tpl.documentType === 'GSTIN' && t.includes('GST')) return true;
        return t === tpl.documentType;
      });

      if (lMatch && (lMatch.fileName || lMatch.fileUrl || lMatch.photoUrl)) {
        merged.fileName = lMatch.fileName || merged.fileName;
        merged.fileUrl = lMatch.fileUrl || lMatch.photoUrl || merged.fileUrl;
        merged.photoUrl = lMatch.photoUrl || lMatch.fileUrl || merged.photoUrl;
        merged.fileSize = lMatch.fileSize || merged.fileSize;
        merged.documentNumber = lMatch.documentNumber || merged.documentNumber;
        merged.status = lMatch.status || (merged.status !== 'Not Uploaded' ? merged.status : 'Pending');
        merged.notes = lMatch.notes || merged.notes;
      }

      // 3. Stored KYC Photos Match (exact uploaded photo)
      const pMatch = storedPhotos[tpl.documentType];
      if (pMatch && pMatch.dataUrl) {
        merged.photoUrl = pMatch.dataUrl;
        merged.fileUrl = pMatch.dataUrl;
        merged.fileName = pMatch.fileName || merged.fileName || `${tpl.label.toLowerCase().replace(/\s+/g, '_')}.jpg`;
        merged.fileSize = pMatch.fileSize || merged.fileSize || '1.1 MB';
        if (merged.status === 'Not Uploaded') {
          merged.status = 'Pending';
        }
      }

      return merged;
    });
  },

  /**
   * 5.2 POST /api/seller/documents
   * Body: { documentType: "PAN", fileName: "...", fileUrl: "..." }
   */
  async uploadDocument(docData) {
    if (hasValidLiveAuth()) {
      try {
        const formData = new FormData();
        const docType = docData.documentType || docData.type || 'PAN';
        formData.append('documentType', docType);
        if (docData.file instanceof File || docData.file instanceof Blob) {
          formData.append('file', docData.file, docData.fileName || docData.name || `${docType.toLowerCase()}.pdf`);
        } else {
          formData.append('file', new Blob(['Statutory document content'], { type: 'text/plain' }), docData.fileName || docData.name || `${docType.toLowerCase()}.pdf`);
        }

        const response = await apiClient.post('/api/seller/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (apiErr) {
        // Fallback
      }
    }

    await delay(200);
    return db.uploadDocument(docData);
  },

  async uploadMandatoryDocument(sellerId, documentType, file, fileUrl = null) {
    return sellerOnboardingService.uploadMandatoryDocument(sellerId, documentType, file, fileUrl);
  },

  async updateDocument(id, updates) {
    await delay(300);
    return db.updateDocument(id, updates);
  },

  async saveComplianceDocument(docType, docData) {
    await delay(350);
    return db.saveComplianceDocument(docType, docData);
  },

  async deleteDocument(id) {
    await delay(250);
    return db.deleteDocument(id);
  },

  async approveDocument(id, notes) {
    await delay(300);
    return db.approveDocument(id, notes);
  },

  async rejectDocument(id, reason) {
    await delay(300);
    return db.rejectDocument(id, reason);
  },

  async approveAllDocuments() {
    await delay(450);
    return db.approveAllDocuments();
  },

  async resetDocuments() {
    await delay(300);
    return db.resetDocuments();
  },

  async submitForVerification(sellerId) {
    if (sellerId && hasValidLiveAuth()) {
      try {
        return await sellerOnboardingService.finalSubmit(sellerId);
      } catch (err) {
        console.warn('Fallback to local verification submission:', err.message);
      }
    }
    await delay(400);
    return db.updateSeller({
      verificationStatus: 'Under Review',
      verificationProgress: {
        mobileVerified: true,
        emailVerified: true,
        businessDetails: true,
        gstVerified: true,
        documentsApproved: false,
      },
    });
  },

  /**
   * 1.1 GET /api/seller/store (Get Own Store Profile)
   */
  async getStoreProfile() {
    const now = Date.now();
    if (cachedStoreProfile && now - lastStoreCheckTime < 60000) {
      return cachedStoreProfile;
    }

    const seller = db.getSeller();
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;
    const storedLogo = typeof localStorage !== 'undefined' ? localStorage.getItem('hinchmart_seller_logo') : null;
    const storedBanner = typeof localStorage !== 'undefined' ? localStorage.getItem('hinchmart_seller_banner') : null;
    const isStoreApproved = typeof localStorage !== 'undefined' && localStorage.getItem('hinchmart_store_active') === 'true';
    const isVerifiedSeller = seller?.onboardingStatus === 'VERIFIED' || seller?.verificationStatus === 'VERIFIED' || isStoreApproved;

    // Query backend /api/seller/store if authenticated
    if (hasValidLiveAuth() && canAccessSellerApi('/api/seller/store')) {
      try {
        const response = await apiClient.get('/api/seller/store');
        const data = response.data?.data || response.data;
        if (data) {
          cachedStoreProfile = {
            ...data,
            logoUrl: data.logoUrl || data.logo || storedLogo || seller?.logo || null,
            bannerUrl: data.bannerUrl || data.banner || storedBanner || seller?.banner || null,
          };
          lastStoreCheckTime = now;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('hinchmart_store_active', 'true');
            if (cachedStoreProfile.logoUrl) localStorage.setItem('hinchmart_seller_logo', cachedStoreProfile.logoUrl);
            if (cachedStoreProfile.bannerUrl) localStorage.setItem('hinchmart_seller_banner', cachedStoreProfile.bannerUrl);
          }
          return cachedStoreProfile;
        }
      } catch (err) {
        lastStoreCheckTime = now;
      }
    }

    await delay(50);
    const resolvedId = Number(storedSellerId || seller?.storeId || seller?.sellerId || seller?.id || 16);
    const resolvedName = seller?.companyName || seller?.businessName || seller?.name || 'Seller Store';

    cachedStoreProfile = {
      storeId: resolvedId,
      sellerId: resolvedId,
      sellerName: resolvedName,
      name: seller?.storeName || resolvedName,
      slug: (seller?.storeName || resolvedName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      logoUrl: storedLogo || seller?.logo || seller?.logoUrl || null,
      bannerUrl: storedBanner || seller?.banner || seller?.bannerUrl || null,
      description: seller?.description || 'Premier supplier and distributor on HinchMart marketplace.',
      status: seller?.status || 'ACTIVE',
      minOrderValue: Number(seller?.minOrderValue || 500.0),
      serviceRadiusKm: Number(seller?.serviceRadiusKm || 25),
      rating: Number(seller?.rating || 4.8),
      reviewCount: Number(seller?.reviewCount || 34),
    };

    return cachedStoreProfile;
  },

  /**
   * 1.2 PUT /api/seller/store (Update Own Store Profile)
   * Request Body: { name, logoUrl, bannerUrl, description, minOrderValue, serviceRadiusKm }
   */
  async updateStoreProfile(storeData) {
    const payload = {
      name: String(storeData.name || storeData.storeName || storeData.businessName || '').trim(),
      logoUrl: storeData.logoUrl || storeData.logo || null,
      bannerUrl: storeData.bannerUrl || storeData.banner || null,
      description: String(storeData.description || '').trim(),
      minOrderValue: Number(storeData.minOrderValue || 500.0),
      serviceRadiusKm: Number(storeData.serviceRadiusKm || 25),
    };

    // Invalidate local cache and sync localStorage
    cachedStoreProfile = null;
    lastStoreCheckTime = 0;
    if (typeof localStorage !== 'undefined') {
      if (payload.logoUrl) localStorage.setItem('hinchmart_seller_logo', payload.logoUrl);
      if (payload.bannerUrl) localStorage.setItem('hinchmart_seller_banner', payload.bannerUrl);
    }

    if (hasValidLiveAuth()) {
      try {
        const response = await apiClient.put('/api/seller/store', payload);
        const data = response.data?.data || response.data;
        if (data) {
          cachedStoreProfile = data;
          return data;
        }
      } catch (err) {
        // Fallback
      }
    }
    await delay(100);
    return db.updateSeller({
      ...payload,
      logo: payload.logoUrl,
      logoUrl: payload.logoUrl,
      banner: payload.bannerUrl,
      bannerUrl: payload.bannerUrl,
      storeName: payload.name,
      businessName: payload.name,
    });
  },

  /**
   * 6.1 GET /api/seller/warehouses (Get Warehouse Addresses)
   */
  async getWarehouseAddresses() {
    if (canAccessSellerApi('/api/seller/warehouses')) {
      try {
        const response = await apiClient.get('/api/seller/warehouses');
        const data = response.data?.data || response.data;
        if (Array.isArray(data)) return data;
      } catch (err) {
        // Fallback
      }
    }
    await delay(100);
    return [
      {
        id: 1,
        addressLine1: 'Plot 45, MIDC Industrial Area',
        addressLine2: 'Phase 2, Turbhe',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        pincode: '400705',
        contactPerson: 'Ramesh Patil',
        contactPhone: '9876543210',
        isDefault: true,
      },
    ];
  },

  /**
   * 6.2 POST /api/seller/warehouses (Save Warehouse Pickup Location)
   * Request Body: { addressLine1, addressLine2, city, state, pincode, contactPerson, contactPhone, isDefault }
   */
  async saveWarehouseAddress(warehouseData) {
    const payload = {
      addressLine1: String(warehouseData.addressLine1 || '').trim(),
      addressLine2: String(warehouseData.addressLine2 || '').trim(),
      city: String(warehouseData.city || '').trim(),
      state: String(warehouseData.state || '').trim(),
      pincode: String(warehouseData.pincode || '').trim(),
      contactPerson: String(warehouseData.contactPerson || '').trim(),
      contactPhone: String(warehouseData.contactPhone || '').trim(),
      isDefault: Boolean(warehouseData.isDefault),
    };

    if (hasValidLiveAuth()) {
      try {
        const response = await apiClient.post('/api/seller/warehouses', payload);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {
        // Fallback
      }
    }
    await delay(200);
    return {
      id: Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
    };
  },
};
