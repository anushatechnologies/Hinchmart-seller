import {
  INITIAL_SELLER,
  INITIAL_WAREHOUSES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_ENQUIRIES,
  INITIAL_QUOTATIONS,
  INITIAL_DOCUMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ANALYTICS,
  INITIAL_CUSTOMERS,
  INITIAL_LABEL_HISTORY,
} from './seedData.js';
import { formatNameFromEmail } from '../utils/formatters.js';

const DB_KEYS = {
  SELLER: 'hinchmart_seller',
  REGISTERED_SELLERS: 'hinchmart_registered_sellers',
  WAREHOUSES: 'hinchmart_warehouses',
  PRODUCTS: 'hinchmart_products',
  ORDERS: 'hinchmart_orders',
  ENQUIRIES: 'hinchmart_enquiries',
  QUOTATIONS: 'hinchmart_quotations',
  DOCUMENTS: 'hinchmart_documents',
  NOTIFICATIONS: 'hinchmart_notifications',
  ANALYTICS: 'hinchmart_analytics',
  AUTH: 'hinchmart_auth',
  CUSTOMERS: 'hinchmart_customers',
  LABEL_HISTORY: 'hinchmart_label_history',
};

const memoryStorage = {};

// Helper for local storage reading
function getStorage(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') {
      return memoryStorage[key] !== undefined ? memoryStorage[key] : fallback;
    }
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

// Helper for local storage writing
function setStorage(key, value) {
  try {
    if (typeof localStorage === 'undefined') {
      memoryStorage[key] = value;
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Initialize database with clean empty state and purge any previous dummy seed data
export function initDB() {
  const PURGE_DUMMY_VERSION_KEY = 'hinchmart_purged_dummy_v1';
  if (typeof localStorage !== 'undefined') {
    if (!localStorage.getItem(PURGE_DUMMY_VERSION_KEY)) {
      // Clear previously cached mock seed data from browser storage
      localStorage.removeItem(DB_KEYS.ORDERS);
      localStorage.removeItem(DB_KEYS.ENQUIRIES);
      localStorage.removeItem(DB_KEYS.QUOTATIONS);
      localStorage.removeItem(DB_KEYS.DOCUMENTS);
      localStorage.removeItem(DB_KEYS.NOTIFICATIONS);
      localStorage.removeItem(DB_KEYS.ANALYTICS);
      localStorage.removeItem(DB_KEYS.CUSTOMERS);
      localStorage.removeItem(DB_KEYS.LABEL_HISTORY);
      localStorage.removeItem(DB_KEYS.WAREHOUSES);

      const storedSeller = getStorage(DB_KEYS.SELLER, null);
      if (storedSeller && (storedSeller.email === 'rajesh@ultratechmaterials.com' || storedSeller.id === '9')) {
        localStorage.removeItem(DB_KEYS.SELLER);
        localStorage.removeItem(DB_KEYS.REGISTERED_SELLERS);
      }

      const storedProducts = getStorage(DB_KEYS.PRODUCTS, []);
      if (Array.isArray(storedProducts)) {
        const cleaned = storedProducts.filter((p) => !(/^prod_\d+$/i.test(String(p?.id || ''))));
        setStorage(DB_KEYS.PRODUCTS, cleaned);
      }

      localStorage.setItem(PURGE_DUMMY_VERSION_KEY, 'true');
    }

    // Clean up any stray catalog products (the 52 products) from all seller product keys
    const PURGE_UNOWNED_KEY = 'hinchmart_purged_unowned_v3';
    if (!localStorage.getItem(PURGE_UNOWNED_KEY)) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('hinchmart_seller_products_')) {
          const sellerClean = k.replace('hinchmart_seller_products_', '').trim();
          try {
            const list = JSON.parse(localStorage.getItem(k));
            if (Array.isArray(list)) {
              const onlySeller = list.filter((p) => {
                if (!p) return false;
                if (typeof p.id === 'string' && /^prod_\d+$/i.test(p.id)) return false;
                const pSid = String(p.sellerId || p.seller_id || p.vendorId || '').replace(/^seller_/, '').trim().toLowerCase();
                return pSid === sellerClean.toLowerCase() || (Number(sellerClean) > 0 && Number(pSid) === Number(sellerClean));
              });
              localStorage.setItem(k, JSON.stringify(onlySeller));
            }
          } catch (_) {}
        }
      }
      localStorage.removeItem(DB_KEYS.PRODUCTS);
      localStorage.setItem(PURGE_UNOWNED_KEY, 'true');
    }

    // Reset any products falsely auto-approved back to PENDING until real admin approval
    const RESET_PENDING_KEY = 'hinchmart_reset_pending_v3';
    if (!localStorage.getItem(RESET_PENDING_KEY)) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('hinchmart_seller_products_') || k === 'hinchmart_products_data_v5' || k === DB_KEYS.PRODUCTS)) {
          try {
            const list = JSON.parse(localStorage.getItem(k));
            if (Array.isArray(list)) {
              const fixed = list.map((p) => {
                const cur = String(p.approvalStatus || p.status || '').toUpperCase();
                if (cur === 'REJECTED') {
                  return { ...p, status: 'REJECTED', approvalStatus: 'REJECTED', active: false };
                }
                return {
                  ...p,
                  status: 'PENDING',
                  approvalStatus: 'PENDING',
                  active: false,
                };
              });
              localStorage.setItem(k, JSON.stringify(fixed));
            }
          } catch (_) {}
        }
      }
      localStorage.setItem(RESET_PENDING_KEY, 'true');
    }

    // Immediate cleanup for products deleted by Admin (1118, 1113, 1108, etc.)
    const PURGE_ADMIN_DELETED_KEY = 'hinchmart_purged_admin_deleted_v2';
    if (!localStorage.getItem(PURGE_ADMIN_DELETED_KEY)) {
      const deletedIds = ['1118', '1113', '1108', 'sp_1118', 'sp_1113', 'sp_1108'];
      const currentDel = getStorage('hinchmart_deleted_product_ids', []);
      const mergedDel = Array.from(new Set([...currentDel.map(String), ...deletedIds]));
      setStorage('hinchmart_deleted_product_ids', mergedDel);

      const isTarget = (p) => {
        if (!p) return false;
        const pid = String(p.id ?? '').replace(/^sp_/, '');
        const pprodid = String(p.productId ?? '').replace(/^sp_/, '');
        return ['1118', '1113', '1108'].includes(pid) || ['1118', '1113', '1108'].includes(pprodid);
      };

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('hinchmart_seller_products_') || k === DB_KEYS.PRODUCTS || k === 'hinchmart_products_data_v5')) {
          try {
            const list = JSON.parse(localStorage.getItem(k));
            if (Array.isArray(list)) {
              const cleaned = list.filter((p) => !isTarget(p));
              localStorage.setItem(k, JSON.stringify(cleaned));
            }
          } catch (_) {}
        }
      }
      localStorage.setItem(PURGE_ADMIN_DELETED_KEY, 'true');
    }

    // Ensure rejected product (ID 1123 / sku3445 / ssssssss) has proper REJECTED status so seller can edit and re-upload
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('hinchmart_seller_products_') || k === DB_KEYS.PRODUCTS || k === 'hinchmart_products_data_v5')) {
        try {
          const list = JSON.parse(localStorage.getItem(k));
          if (Array.isArray(list)) {
            let changed = false;
            const updatedList = list.map((p) => {
              const pid = String(p?.id ?? p?.productId ?? '').trim().replace(/^sp_/, '');
              const psku = String(p?.sku ?? '').trim().toLowerCase();
              const pname = String(p?.name ?? p?.title ?? '').trim().toLowerCase();
              if (pid === '1123' || psku === 'sku3445' || pname === 'ssssssss') {
                changed = true;
                return {
                  ...p,
                  status: 'REJECTED',
                  approvalStatus: 'REJECTED',
                  deletedByAdmin: false,
                  active: false,
                  rejectionReason: p?.rejectionReason || 'Product specifications and details require revision. Please edit details and re-submit for admin approval.',
                };
              }
              if (p?.status === 'REJECTED' || p?.approvalStatus === 'REJECTED') {
                if (p?.deletedByAdmin) {
                  changed = true;
                  return { ...p, deletedByAdmin: false };
                }
              }
              return p;
            });
            if (changed) {
              localStorage.setItem(k, JSON.stringify(updatedList));
            }
          }
        } catch (_) {}
      }
    }

    // Guarantee that no REJECTED or PENDING products are trapped in hinchmart_deleted_product_ids
    try {
      const delIds = getStorage('hinchmart_deleted_product_ids', []);
      if (Array.isArray(delIds) && delIds.length > 0) {
        const activeIds = new Set();
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('hinchmart_seller_products_') || k === DB_KEYS.PRODUCTS || k === 'hinchmart_products_data_v5')) {
            try {
              const list = JSON.parse(localStorage.getItem(k));
              if (Array.isArray(list)) {
                list.forEach((p) => {
                  const st = String(p?.status || p?.approvalStatus || '').toUpperCase();
                  if (st === 'REJECTED' || st === 'PENDING') {
                    const rawId = String(p.id ?? p.productId ?? '').trim();
                    const clean = rawId.replace(/^sp_/, '');
                    activeIds.add(rawId);
                    activeIds.add(clean);
                    activeIds.add(`sp_${clean}`);
                  }
                });
              }
            } catch (_) {}
          }
        }
        if (activeIds.size > 0) {
          const cleanedDelIds = delIds.filter((id) => !activeIds.has(String(id).trim()));
          if (cleanedDelIds.length !== delIds.length) {
            setStorage('hinchmart_deleted_product_ids', cleanedDelIds);
          }
        }
      }
    } catch (_) {}

    // Immediate cleanup for stale hardcoded Rajesh data if logged in as a different user
    const PURGE_STALE_RAJESH_KEY = 'hinchmart_purged_stale_rajesh_v3';
    if (!localStorage.getItem(PURGE_STALE_RAJESH_KEY)) {
      const curAuth = getStorage(DB_KEYS.AUTH, null);
      const curSeller = getStorage(DB_KEYS.SELLER, null);
      const userEmail = String(curAuth?.user?.email || curSeller?.email || '').trim().toLowerCase();
      const isNotRajeshEmail = userEmail && !userEmail.includes('rajesh');
      const hasRajesh = (curAuth?.user?.name && /rajesh/i.test(curAuth.user.name)) ||
                        (curSeller?.name && /rajesh/i.test(curSeller.name)) ||
                        (curSeller?.companyName && /rajesh/i.test(curSeller.companyName));

      if (isNotRajeshEmail && hasRajesh) {
        const cleanName = formatNameFromEmail(userEmail);
        const compName = `${cleanName} Enterprise`;
        if (curAuth?.user) {
          curAuth.user.name = cleanName;
          curAuth.user.fullName = cleanName;
          curAuth.user.companyName = compName;
          setStorage(DB_KEYS.AUTH, curAuth);
        }
        if (curSeller) {
          curSeller.name = cleanName;
          curSeller.fullName = cleanName;
          curSeller.companyName = compName;
          setStorage(DB_KEYS.SELLER, curSeller);
        }
      }
      localStorage.setItem(PURGE_STALE_RAJESH_KEY, 'true');
    }
  }

  if (!getStorage(DB_KEYS.SELLER, null)) setStorage(DB_KEYS.SELLER, null);
  if (!getStorage(DB_KEYS.WAREHOUSES, null)) setStorage(DB_KEYS.WAREHOUSES, []);
  if (!getStorage(DB_KEYS.PRODUCTS, null)) setStorage(DB_KEYS.PRODUCTS, []);
  if (!getStorage(DB_KEYS.ORDERS, null)) setStorage(DB_KEYS.ORDERS, []);
  if (!getStorage(DB_KEYS.ENQUIRIES, null)) setStorage(DB_KEYS.ENQUIRIES, []);
  if (!getStorage(DB_KEYS.QUOTATIONS, null)) setStorage(DB_KEYS.QUOTATIONS, []);
  if (!getStorage(DB_KEYS.DOCUMENTS, null)) setStorage(DB_KEYS.DOCUMENTS, []);
  if (!getStorage(DB_KEYS.NOTIFICATIONS, null)) setStorage(DB_KEYS.NOTIFICATIONS, []);
  if (!getStorage(DB_KEYS.ANALYTICS, null)) setStorage(DB_KEYS.ANALYTICS, INITIAL_ANALYTICS);
  if (!getStorage(DB_KEYS.CUSTOMERS, null)) setStorage(DB_KEYS.CUSTOMERS, []);
  if (!getStorage(DB_KEYS.LABEL_HISTORY, null)) setStorage(DB_KEYS.LABEL_HISTORY, []);
  if (!getStorage(DB_KEYS.REGISTERED_SELLERS, null)) setStorage(DB_KEYS.REGISTERED_SELLERS, []);
}

// DB API Interface
export const db = {
  // Reset all to clean defaults
  resetToDefaults() {
    setStorage(DB_KEYS.SELLER, null);
    setStorage(DB_KEYS.REGISTERED_SELLERS, []);
    setStorage(DB_KEYS.WAREHOUSES, []);
    setStorage(DB_KEYS.PRODUCTS, []);
    setStorage(DB_KEYS.ORDERS, []);
    setStorage(DB_KEYS.ENQUIRIES, []);
    setStorage(DB_KEYS.QUOTATIONS, []);
    setStorage(DB_KEYS.DOCUMENTS, []);
    setStorage(DB_KEYS.NOTIFICATIONS, []);
    setStorage(DB_KEYS.ANALYTICS, INITIAL_ANALYTICS);
    setStorage(DB_KEYS.CUSTOMERS, []);
    setStorage(DB_KEYS.LABEL_HISTORY, []);
  },

  // Auth
  getAuth() {
    return getStorage(DB_KEYS.AUTH, null);
  },

  setAuth(authData) {
    setStorage(DB_KEYS.AUTH, authData);
  },

  clearAuth() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(DB_KEYS.AUTH);
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerUser');
      localStorage.removeItem('sellerId');
      localStorage.removeItem(DB_KEYS.SELLER);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('hinchmart_onboarding_seller_id');
      sessionStorage.removeItem('otp_phone');
      sessionStorage.removeItem('mock_otp');
    }
  },

  logout() {
    this.clearAuth();
  },

  // Seller Profile Lookup by Phone
  getSellerByPhone(phoneNumber) {
    if (!phoneNumber) return null;
    const cleanNumber = String(phoneNumber).replace(/\D/g, '').slice(-10);

    // 1. Check registered sellers repository
    const registeredSellers = getStorage(DB_KEYS.REGISTERED_SELLERS, []);
    const found = registeredSellers.find((s) => {
      const p = String(s.phone || s.mobile || s.businessPhone || '').replace(/\D/g, '').slice(-10);
      return p === cleanNumber;
    });
    if (found) return found;

    // 2. Check current primary active seller
    const currentSeller = getStorage(DB_KEYS.SELLER, null);
    if (currentSeller) {
      const sellerPhone = String(currentSeller.phone || currentSeller.mobile || currentSeller.businessPhone || '').replace(/\D/g, '').slice(-10);
      if (sellerPhone === cleanNumber) {
        // Also save to registered sellers list so subsequent checks find it immediately
        setStorage(DB_KEYS.REGISTERED_SELLERS, [currentSeller, ...registeredSellers.filter(s => String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10) !== cleanNumber)]);
        return currentSeller;
      }
    }

    return null;
  },

  // Seller Profile Lookup by Email
  getSellerByEmail(email) {
    if (!email) return null;
    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Check registered sellers repository
    const registeredSellers = getStorage(DB_KEYS.REGISTERED_SELLERS, []);
    const found = registeredSellers.find((s) => {
      const e = String(s.email || s.companyEmail || s.officialEmail || s.authorizedEmail || '').trim().toLowerCase();
      return e === cleanEmail;
    });
    if (found) return found;

    // 2. Check current primary active seller
    const currentSeller = getStorage(DB_KEYS.SELLER, null);
    if (currentSeller) {
      const sellerEmail = String(currentSeller.email || currentSeller.companyEmail || '').trim().toLowerCase();
      if (sellerEmail === cleanEmail) {
        return currentSeller;
      }
    }

    return null;
  },

  // Register New Seller
  registerSeller(sellerData) {
    const cleanNumber = String(sellerData.mobileNumber || sellerData.phone || '').replace(/\D/g, '').slice(-10);
    const sellerName = sellerData.fullName || sellerData.name || 'Seller Admin';
    const companyName = sellerData.companyName || `${sellerName} Enterprise`;
    const email = sellerData.email || sellerData.companyEmail || (cleanNumber ? `seller_${cleanNumber}@hinchmart.com` : 'seller@hinchmart.com');
    const sellerId = cleanNumber ? `seller_${cleanNumber}` : `seller_${Date.now()}`;

    const newSeller = {
      id: sellerId,
      sellerId,
      name: sellerName,
      fullName: sellerName,
      email,
      password: sellerData.password || sellerData.accountPassword || null,
      phone: cleanNumber ? `+91 ${cleanNumber}` : '+91 98201 54321',
      mobile: cleanNumber,
      companyName,
      businessType: sellerData.businessType || 'Distributor',
      establishedYear: Number(sellerData.establishedYear) || 2026,
      employees: sellerData.employees || '11-50',
      website: sellerData.website || '',
      companyEmail: email,
      businessPhone: cleanNumber ? `+91 ${cleanNumber}` : '+91 98201 54321',
      description: `${companyName} is a registered building material supplier on HinchMart B2B marketplace.`,
      logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
      address: {
        country: 'India',
        state: sellerData.state || 'Maharashtra',
        district: sellerData.district || 'Mumbai',
        city: sellerData.city || 'Mumbai',
        area: sellerData.area || 'Industrial Area',
        pincode: sellerData.pincode || '400001',
        completeAddress: sellerData.completeAddress || sellerData.businessAddress || 'Registered Business Operating Address, Mumbai, Maharashtra',
      },
      legal: {
        gstin: sellerData.gstin || '',
        pan: sellerData.panCardNumber || sellerData.pan || '',
        aadhaar: sellerData.aadhaarNumber || sellerData.aadhaar || '',
        cin: sellerData.cin || '',
        tradeLicense: sellerData.tradeLicense || '',
        msme: sellerData.msme || '',
      },
      serviceAreas: ['Maharashtra', 'Gujarat'],
      minOrderValue: 25000,
      verified: false,
      verificationStatus: 'Under Review',
      verificationProgress: {
        mobileVerified: true,
        emailVerified: true,
        businessDetails: true,
        gstVerified: true,
        documentsApproved: false,
      },
      completionPercentage: 85,
      bankDetails: {
        bankName: sellerData.bankName || 'HDFC Bank',
        accountHolderName: sellerData.accountHolderName || sellerName,
        accountName: sellerData.accountHolderName || sellerName,
        accountNumber: sellerData.accountNumber || '',
        ifsc: (sellerData.ifscCode || '').toUpperCase(),
        ifscCode: (sellerData.ifscCode || '').toUpperCase(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setStorage(DB_KEYS.SELLER, newSeller);

    const registeredSellers = getStorage(DB_KEYS.REGISTERED_SELLERS, []);
    const updatedList = [
      newSeller,
      ...registeredSellers.filter((s) => {
        const sPhone = String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10);
        const sEmail = String(s.email || s.companyEmail || '').trim().toLowerCase();
        if (cleanNumber && sPhone === cleanNumber) return false;
        if (email && sEmail === email.toLowerCase()) return false;
        return true;
      }),
    ];
    setStorage(DB_KEYS.REGISTERED_SELLERS, updatedList);

    // If PAN Card file provided, upload to Document Vault as Pending
    if (sellerData.panCardImage) {
      const fileInfo = sellerData.panCardImage;
      this.uploadDocument({
        name: 'Company PAN Card',
        type: 'PAN Document',
        fileName: fileInfo.name || 'PAN_Card.jpg',
        fileSize: fileInfo.size || '1.2 MB',
        fileUrl: fileInfo.previewUrl || '/mock/docs/pan_card.jpg',
        status: 'Pending',
        notes: 'Submitted during business onboarding registration',
      });
    }

    const cleanId = String(newSeller.id).replace(/^seller_/, '');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sellerId', String(cleanId));
    }

    // Ensure completely clean 0 products and empty catalog for newly registered seller
    this.clearSellerProducts(cleanId);
    this.clearSellerCategories(cleanId);
    this.clearSellerSubcategories(cleanId);
    this.clearSellerBrands(cleanId);

    const authData = {
      isAuthenticated: true,
      user: {
        id: newSeller.id,
        sellerId: newSeller.id,
        name: newSeller.name,
        fullName: newSeller.name,
        email: newSeller.email,
        phone: newSeller.phone,
        role: 'SELLER_ADMIN',
        companyName: newSeller.companyName,
      },
      token: 'jwt_seller_' + Math.random().toString(36).substring(2),
    };

    this.setAuth(authData);
    return { seller: newSeller, auth: authData };
  },

  // Seller Profile
  getSeller(sellerId) {
    const currentSeller = getStorage(DB_KEYS.SELLER, null);
    const currentAuth = getStorage(DB_KEYS.AUTH, null);
    const registeredSellers = getStorage(DB_KEYS.REGISTERED_SELLERS, []);
    const storedSellerId = typeof localStorage !== 'undefined' ? localStorage.getItem('sellerId') : null;

    // 1. If explicit sellerId provided, look up in registered sellers
    if (sellerId) {
      const cleanSellerId = String(sellerId).replace(/^seller_/, '').replace(/\D/g, '').slice(-10);
      const found = registeredSellers.find((s) =>
        String(s.id) === String(sellerId) ||
        String(s.sellerId) === String(sellerId) ||
        String(s.id).replace(/^seller_/, '') === String(sellerId).replace(/^seller_/, '') ||
        (cleanSellerId && String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10) === cleanSellerId)
      );
      if (found) return found;
    }

    // 2. If active auth user exists, sync from auth (by email or phone or stored sellerId)
    if (currentAuth?.user) {
      const authEmail = String(currentAuth.user.email || '').trim().toLowerCase();
      if (authEmail) {
        const foundByEmail = registeredSellers.find((s) => {
          const e = String(s.email || s.companyEmail || s.officialEmail || '').trim().toLowerCase();
          return e === authEmail;
        });
        if (foundByEmail) {
          const resolvedId = currentAuth.user.sellerId || currentAuth.user.id || storedSellerId || foundByEmail.sellerId || foundByEmail.id;
          return {
            ...foundByEmail,
            id: resolvedId,
            sellerId: resolvedId,
            name: currentAuth.user.name || foundByEmail.name,
            fullName: currentAuth.user.name || foundByEmail.fullName || foundByEmail.name,
            companyName: currentAuth.user.companyName || foundByEmail.companyName,
          };
        }
      }

      const authPhone = String(currentAuth.user.phone || currentAuth.user.mobile || '').replace(/\D/g, '').slice(-10);
      if (authPhone) {
        const foundByPhone = registeredSellers.find((s) =>
          String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10) === authPhone
        );
        if (foundByPhone) {
          const resolvedId = currentAuth.user.sellerId || currentAuth.user.id || storedSellerId || foundByPhone.sellerId || foundByPhone.id;
          return {
            ...foundByPhone,
            id: resolvedId,
            sellerId: resolvedId,
            name: currentAuth.user.name || foundByPhone.name,
            fullName: currentAuth.user.name || foundByPhone.fullName || foundByPhone.name,
            companyName: currentAuth.user.companyName || foundByPhone.companyName,
          };
        }
      }

      if (currentSeller) {
        const resolvedId = currentAuth.user.sellerId || currentAuth.user.id || storedSellerId || currentSeller.sellerId || currentSeller.id;
        let sName = (currentAuth.user.name && currentAuth.user.name !== 'Seller Admin') ? currentAuth.user.name : currentSeller.name;
        let cName = (currentAuth.user.companyName && currentAuth.user.companyName !== 'Registered Enterprise') ? currentAuth.user.companyName : currentSeller.companyName;

        const authEmail = String(currentAuth.user.email || currentSeller.email || '').trim().toLowerCase();
        if (authEmail && !authEmail.includes('rajesh')) {
          if (/rajesh/i.test(sName) || sName === 'Seller Admin') {
            sName = formatNameFromEmail(authEmail);
          }
          if (/rajesh/i.test(cName) || cName === 'Registered Enterprise') {
            cName = `${sName} Enterprise`;
          }
        }

        return {
          ...currentSeller,
          id: resolvedId,
          sellerId: resolvedId,
          name: sName,
          fullName: sName,
          companyName: cName,
          email: currentAuth.user.email || currentSeller.email,
          phone: currentAuth.user.phone || currentSeller.phone,
        };
      }
    }

    if (currentSeller) {
      const authEmail = String(currentAuth?.user?.email || currentSeller.email || '').trim().toLowerCase();
      let sName = currentSeller.name;
      let cName = currentSeller.companyName;
      if (authEmail && !authEmail.includes('rajesh')) {
        if (/rajesh/i.test(sName)) {
          sName = formatNameFromEmail(authEmail);
        }
        if (/rajesh/i.test(cName)) {
          cName = `${sName} Enterprise`;
        }
      }
      return {
        ...currentSeller,
        id: storedSellerId || currentSeller.id,
        sellerId: storedSellerId || currentSeller.sellerId || currentSeller.id,
        name: sName,
        fullName: sName,
        companyName: cName,
      };
    }

    return null;
  },

  updateSeller(updates) {
    const current = this.getSeller();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    setStorage(DB_KEYS.SELLER, updated);

    // Sync to registered sellers repository so looking up by phone or email always finds the updated profile
    const cleanNumber = String(updated.mobile || updated.phone || '').replace(/\D/g, '').slice(-10);
    const cleanEmail = String(updated.email || updated.companyEmail || '').trim().toLowerCase();

    const registeredSellers = getStorage(DB_KEYS.REGISTERED_SELLERS, []);
    const updatedList = [
      updated,
      ...registeredSellers.filter((s) => {
        const sPhone = String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10);
        const sEmail = String(s.email || s.companyEmail || '').trim().toLowerCase();
        if (cleanNumber && sPhone === cleanNumber) return false;
        if (cleanEmail && sEmail === cleanEmail) return false;
        return true;
      }),
    ];
    setStorage(DB_KEYS.REGISTERED_SELLERS, updatedList);

    return updated;
  },

  // Products
  getProducts() {
    return getStorage(DB_KEYS.PRODUCTS, []);
  },

  clearAllProducts() {
    setStorage(DB_KEYS.PRODUCTS, []);
    return [];
  },

  getProductById(id) {
    if (!id) return null;
    const products = this.getProducts();
    const found = products.find(p => String(p.id) === String(id) || String(p.productId) === String(id) || Number(p.id) === Number(id) || Number(p.productId) === Number(id));
    if (found) return found;

    // Check INITIAL_PRODUCTS as fallback
    const initMatch = (INITIAL_PRODUCTS || []).find(p => String(p.id) === String(id) || String(p.productId) === String(id) || Number(p.id) === Number(id) || Number(p.productId) === Number(id));
    if (initMatch) {
      const updated = [initMatch, ...products];
      setStorage(DB_KEYS.PRODUCTS, updated);
      return initMatch;
    }
    return null;
  },

  createProduct(productData) {
    const products = this.getProducts();
    const newProduct = {
      ...productData,
      id: productData.id || productData.productId || `prod_${Date.now()}`,
      productId: productData.productId || productData.id || `prod_${Date.now()}`,
      status: productData.status || 'PENDING',
      approvalStatus: productData.approvalStatus || 'Pending',
      active: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalSales: 0,
      rating: 5.0,
    };
    const updated = [newProduct, ...products];
    setStorage(DB_KEYS.PRODUCTS, updated);
    return newProduct;
  },

  updateProduct(id, updates) {
    if (!id) return null;
    const products = this.getProducts();
    let updatedProduct = null;
    const updated = products.map(p => {
      if (String(p.id) === String(id) || String(p.productId) === String(id)) {
        updatedProduct = { ...p, ...updates, updatedAt: new Date().toISOString() };
        return updatedProduct;
      }
      return p;
    });

    if (!updatedProduct) {
      updatedProduct = { id, productId: id, ...updates, updatedAt: new Date().toISOString() };
      updated.unshift(updatedProduct);
    }

    setStorage(DB_KEYS.PRODUCTS, updated);
    return updatedProduct;
  },

  getDeletedProductIds() {
    return new Set(getStorage('hinchmart_deleted_product_ids', []).map(String));
  },

  recordDeletedProduct(id) {
    if (!id) return;
    const cleanId = String(id).trim();
    const rawId = cleanId.replace(/^sp_/, '');
    const altId = cleanId.startsWith('sp_') ? rawId : `sp_${cleanId}`;
    const existing = getStorage('hinchmart_deleted_product_ids', []);
    const toAdd = [cleanId, rawId, altId].filter(x => x && !existing.includes(x));
    if (toAdd.length > 0) {
      setStorage('hinchmart_deleted_product_ids', [...existing, ...toAdd]);
    }
  },

  deleteProduct(id) {
    if (!id) return false;
    const cleanId = String(id).trim();
    const rawId = cleanId.replace(/^sp_/, '');
    this.recordDeletedProduct(cleanId);

    const matchesTarget = (p) => {
      if (!p) return false;
      const pid = String(p.id ?? '').trim();
      const pProdId = String(p.productId ?? '').trim();
      const rawPid = pid.replace(/^sp_/, '');
      const rawPProdId = pProdId.replace(/^sp_/, '');
      return (
        pid === cleanId || pid === rawId || pid === `sp_${rawId}` ||
        pProdId === cleanId || pProdId === rawId || pProdId === `sp_${rawId}` ||
        (rawId && rawPid === rawId) || (rawId && rawPProdId === rawId)
      );
    };

    const products = this.getProducts();
    const filtered = products.filter(p => !matchesTarget(p));
    setStorage(DB_KEYS.PRODUCTS, filtered);

    // Also remove from all seller storage keys and shared admin key
    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('hinchmart_seller_products_') || k === 'hinchmart_products_data_v5')) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const updated = list.filter(p => !matchesTarget(p));
                localStorage.setItem(k, JSON.stringify(updated));
              }
            }
          }
        }
      } catch (_) {}
    }
    return true;
  },

  bulkUpdatePrices(adjustments) {
    // adjustments: array of { id, newSellingPrice, newMrp }
    const products = this.getProducts();
    const idMap = new Map(adjustments.map(a => [a.id, a]));
    const updated = products.map(p => {
      if (idMap.has(p.id)) {
        const adj = idMap.get(p.id);
        return {
          ...p,
          sellingPrice: adj.newSellingPrice !== undefined ? adj.newSellingPrice : p.sellingPrice,
          mrp: adj.newMrp !== undefined ? adj.newMrp : p.mrp,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    setStorage(DB_KEYS.PRODUCTS, updated);
    return updated;
  },

  // =========================================================================
  // SELLER-ISOLATED PRODUCT REPOSITORY (Data Isolation)
  // Ensures Seller sees ONLY products created/owned by the authenticated seller
  // =========================================================================
  getCleanSellerId(sellerId) {
    if (sellerId !== undefined && sellerId !== null && String(sellerId).trim() !== '') {
      return String(sellerId).replace(/^seller_/, '').trim();
    }
    const stored = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('sellerId') || localStorage.getItem('hinchmart_active_seller_id') || localStorage.getItem('hinchmart_seller_id'))
      : null;
    if (stored && String(stored).trim() !== '') {
      return String(stored).replace(/^seller_/, '').trim();
    }
    const authUser = this.getAuth()?.user;
    if (authUser?.sellerId || authUser?.id) {
      return String(authUser.sellerId || authUser.id).replace(/^seller_/, '').trim();
    }
    const currentSeller = getStorage(DB_KEYS.SELLER, null);
    if (currentSeller?.sellerId || currentSeller?.id) {
      return String(currentSeller.sellerId || currentSeller.id).replace(/^seller_/, '').trim();
    }
    return '';
  },

  getSellerProductsKey(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    return cleanId ? `hinchmart_seller_products_${cleanId}` : 'hinchmart_seller_products_empty';
  },

  getSellerProducts(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];

    const storageKey = this.getSellerProductsKey(cleanId);
    let existing = getStorage(storageKey, []);
    const numCleanId = Number(cleanId);

    // Strictly isolate seller products to the current seller's dedicated storage key
    const adminProductMap = new Map();
    let hasAdminCatalog = false;
    if (typeof localStorage !== 'undefined') {
      try {
        const adminKey = 'hinchmart_products_data_v5';
        const rawAdmin = localStorage.getItem(adminKey);
        if (rawAdmin) {
          const adminList = JSON.parse(rawAdmin);
          if (Array.isArray(adminList) && adminList.length > 0) {
            hasAdminCatalog = true;
            adminList.forEach((ap) => {
              if (ap) {
                const k1 = String(ap.id ?? ap.productId ?? '').trim().toLowerCase();
                const k2 = String(ap.sku ?? '').trim().toLowerCase();
                if (k1) adminProductMap.set(k1, ap);
                if (k2) adminProductMap.set(k2, ap);
              }
            });
          }
        }
      } catch (_) {}
    }

    const seenIds = new Set();
    const allProducts = [];
    const deletedIds = this.getDeletedProductIds();

    const isMatch = (p) => {
      if (!p) return false;
      // Exclude mock dummy seed products (prod_1 to prod_12)
      if (typeof p.id === 'string' && /^prod_\d+$/i.test(p.id)) return false;
      // Exclude legacy mock seed items
      if (p.id === 735 || p.id === 736 || p.productId === 735 || p.productId === 736) return false;

      const pSellerId = String(p.sellerId || p.seller_id || p.vendorId || '').replace(/^seller_/, '').trim().toLowerCase();
      // If product has sellerId, it must match this seller!
      if (pSellerId) {
        return (
          pSellerId === cleanId.toLowerCase() ||
          (numCleanId > 0 && Number(pSellerId) === numCleanId)
        );
      }
      // If product in this seller's dedicated key has no explicit sellerId, attribute to this seller
      return true;
    };

    if (Array.isArray(existing)) {
      const remainingProducts = [];

      existing.forEach((p) => {
        if (!isMatch(p)) return;
        const pIdStr = String(p.id ?? p.productId ?? '').trim();
        const pProdIdStr = String(p.productId ?? p.id ?? '').trim();

        const curStatusCheck = String(p.status || p.approvalStatus || '').toUpperCase();

        // If explicitly deleted by seller or admin (NEVER delete REJECTED or PENDING products)
        const isDeleted = (val) => {
          if (!val) return false;
          const s = String(val).trim();
          const raw = s.replace(/^sp_/, '');
          return deletedIds.has(s) || deletedIds.has(raw) || deletedIds.has(`sp_${raw}`);
        };
        if (curStatusCheck !== 'REJECTED' && curStatusCheck !== 'PENDING' && (isDeleted(p.id) || isDeleted(p.productId))) {
          return;
        }

        const key = String(p.id || p.productId || p.sku || p.title).trim().toLowerCase();
        if (!key || seenIds.has(key)) return;

        const adminMatch = adminProductMap.get(String(p.id).toLowerCase()) || adminProductMap.get(String(p.sku).toLowerCase());

        // If admin portal catalog is active in this browser and product was submitted/reviewed,
        // but is now completely missing from adminProductMap, Admin deleted it in the Admin Portal!
        const numId = Number(p.id ?? p.productId ?? 0);
        const hasValidBackendId = Number.isInteger(numId) && numId > 0;
        let isDeletedByAdmin = Boolean(
          p.deletedByAdmin === true ||
          p.status === 'DELETED_BY_ADMIN' ||
          p.approvalStatus === 'DELETED_BY_ADMIN'
        );

        seenIds.add(key);

        // Sync admin approval status if admin approved/rejected in admin portal
        let status = String(p.status || p.approvalStatus || 'PENDING').toUpperCase();
        let approvalStatus = String(p.approvalStatus || status).toUpperCase();

        if (adminMatch) {
          const admStatus = String(adminMatch.status || adminMatch.approvalStatus || '').toUpperCase();
          if (admStatus === 'APPROVED' || adminMatch.active === true) {
            status = 'APPROVED';
            approvalStatus = 'APPROVED';
            isDeletedByAdmin = false;
          } else if (admStatus === 'REJECTED') {
            status = 'REJECTED';
            approvalStatus = 'REJECTED';
            isDeletedByAdmin = false;
          }
        }

        if (status === 'REJECTED' || approvalStatus === 'REJECTED') {
          isDeletedByAdmin = false;
        } else if (isDeletedByAdmin) {
          status = 'DELETED_BY_ADMIN';
          approvalStatus = 'DELETED_BY_ADMIN';
        }

        const normalizedProd = {
          ...p,
          sellerId: cleanId,
          status,
          approvalStatus,
          deletedByAdmin: isDeletedByAdmin,
          active: isDeletedByAdmin ? false : (status === 'APPROVED'),
        };

        allProducts.push(normalizedProd);
        remainingProducts.push(normalizedProd);
      });

      // Persist any status updates (e.g. DELETED_BY_ADMIN) or purged items back to localStorage
      const hasChanges = remainingProducts.length !== existing.length ||
        remainingProducts.some((np, idx) => {
          const orig = existing[idx];
          return orig && (np.status !== orig.status || np.approvalStatus !== orig.approvalStatus || Boolean(np.deletedByAdmin) !== Boolean(orig.deletedByAdmin));
        });

      if (hasChanges) {
        setStorage(storageKey, remainingProducts);
      }
    }

    return allProducts;
  },

  clearSellerProducts(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];
    const storageKey = this.getSellerProductsKey(cleanId);
    setStorage(storageKey, []);
    return [];
  },

  getSellerProductById(sellerId, productId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return null;
    const products = this.getSellerProducts(cleanId);
    return products.find(p => String(p.id) === String(productId) || String(p.productId) === String(productId)) || null;
  },

  findProductById(productId) {
    if (!productId) return null;
    // 1. Check current authenticated seller's products
    const current = this.getSellerProductById(null, productId);
    if (current) return current;

    // 2. Scan storage keys in case sellerId differs or in test context
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hinchmart_seller_products_')) {
          try {
            const list = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(list)) {
              const match = list.find(p => String(p.id) === String(productId) || String(p.productId) === String(productId));
              if (match) return match;
            }
          } catch (e) {}
        }
      }
    } else {
      for (const key of Object.keys(memoryStorage)) {
        if (key && key.startsWith('hinchmart_seller_products_')) {
          const list = memoryStorage[key];
          if (Array.isArray(list)) {
            const match = list.find(p => String(p.id) === String(productId) || String(p.productId) === String(productId));
            if (match) return match;
          }
        }
      }
    }
    return null;
  },

  createSellerProduct(sellerId, productData) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return null;
    const products = this.getSellerProducts(cleanId);
    const storageKey = this.getSellerProductsKey(cleanId);

    const newProduct = {
      ...productData,
      id: productData.id || productData.productId || `sp_${Date.now()}`,
      productId: productData.productId || productData.id || `sp_${Date.now()}`,
      sellerId: cleanId,
      title: productData.title || productData.name || 'New Construction Material',
      name: productData.title || productData.name || 'New Construction Material',
      sku: productData.sku || `SKU-${Date.now()}`,
      brandId: productData.brandId ?? null,
      brand: productData.brand || productData.brandName || 'Brand',
      brandName: productData.brandName || productData.brand || 'Brand',
      categoryId: productData.categoryId ?? null,
      category: productData.category || productData.categoryName || 'Category',
      categoryName: productData.categoryName || productData.category || 'Category',
      subcategoryId: productData.subcategoryId ?? null,
      subcategory: productData.subcategory || productData.subcategoryName || 'Subcategory',
      subcategoryName: productData.subcategoryName || productData.subcategory || 'Subcategory',
      description: productData.description || '',
      price: Number(productData.price ?? productData.sellingPrice ?? 0),
      sellingPrice: Number(productData.sellingPrice ?? productData.price ?? 0),
      mrp: Number(productData.mrp ?? 0),
      unit: productData.unit || 'PCS',
      moq: Number(productData.moq || 1),
      stockQty: Number(productData.stockQty ?? productData.stock ?? 0),
      stock: Number(productData.stock ?? productData.stockQty ?? 0),
      is24HourDelivery: Boolean(productData.is24HourDelivery),
      active: false,
      status: 'PENDING',
      approvalStatus: 'Pending',
      images: Array.isArray(productData.images) && productData.images.length > 0
        ? productData.images
        : (productData.imageUrl ? [productData.imageUrl] : []),
      bulkPricingTiers: Array.isArray(productData.bulkPricingTiers) ? productData.bulkPricingTiers : [],
      specifications: typeof productData.specifications === 'object' && productData.specifications !== null ? productData.specifications : {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProduct, ...products.filter(p => String(p.id) !== String(newProduct.id) && String(p.productId) !== String(newProduct.productId))];
    setStorage(storageKey, updated);

    // Sync into DB_KEYS.PRODUCTS as well
    const allExisting = getStorage(DB_KEYS.PRODUCTS, []);
    const updatedAll = [newProduct, ...allExisting.filter(p => String(p.id) !== String(newProduct.id) && String(p.productId) !== String(newProduct.productId))];
    setStorage(DB_KEYS.PRODUCTS, updatedAll);

    // Sync into Admin Panel shared local storage key (hinchmart_products_data_v5)
    if (typeof localStorage !== 'undefined') {
      try {
        const adminKey = 'hinchmart_products_data_v5';
        const adminList = JSON.parse(localStorage.getItem(adminKey) || '[]');
        if (Array.isArray(adminList)) {
          const filteredAdmin = adminList.filter(p => String(p.id) !== String(newProduct.id) && String(p.productId) !== String(newProduct.productId));
          localStorage.setItem(adminKey, JSON.stringify([newProduct, ...filteredAdmin]));
        }
      } catch (e) {}
    }

    return newProduct;
  },

  updateSellerProduct(sellerId, productId, updates) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return null;
    const products = this.getSellerProducts(cleanId);
    const storageKey = this.getSellerProductsKey(cleanId);

    let updatedProduct = null;
    const updated = products.map(p => {
      if (String(p.id) === String(productId) || String(p.productId) === String(productId)) {
        updatedProduct = {
          ...p,
          ...updates,
          title: updates.title || updates.name || p.title,
          name: updates.title || updates.name || p.name,
          sellingPrice: updates.sellingPrice !== undefined ? Number(updates.sellingPrice) : (updates.price !== undefined ? Number(updates.price) : p.sellingPrice),
          price: updates.price !== undefined ? Number(updates.price) : (updates.sellingPrice !== undefined ? Number(updates.sellingPrice) : p.price),
          stockQty: updates.stockQty !== undefined ? Number(updates.stockQty) : (updates.stock !== undefined ? Number(updates.stock) : p.stockQty),
          stock: updates.stock !== undefined ? Number(updates.stock) : (updates.stockQty !== undefined ? Number(updates.stockQty) : p.stock),
          updatedAt: new Date().toISOString(),
        };
        return updatedProduct;
      }
      return p;
    });

    if (!updatedProduct) {
      // Look up in fallback or other seller keys
      const existingProd = this.findProductById(productId) || { id: productId, productId, ...updates };
      updatedProduct = {
        ...existingProd,
        ...updates,
        title: updates.title || updates.name || existingProd.title || existingProd.name,
        name: updates.title || updates.name || existingProd.name || existingProd.title,
        updatedAt: new Date().toISOString(),
      };
      updated.unshift(updatedProduct);
    }

    setStorage(storageKey, updated);

    // 1. Sync into DB_KEYS.PRODUCTS as well
    const allExisting = getStorage(DB_KEYS.PRODUCTS, []);
    const updatedAll = [
      updatedProduct,
      ...allExisting.filter(p => String(p.id) !== String(productId) && String(p.productId) !== String(productId))
    ];
    setStorage(DB_KEYS.PRODUCTS, updatedAll);

    // 2. Sync to all sibling seller keys in case product was saved under a different ID (e.g. 16 vs 9)
    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('hinchmart_seller_products_') && k !== storageKey) {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(list)) {
              const hasProd = list.some(p => String(p.id) === String(productId) || String(p.productId) === String(productId));
              if (hasProd) {
                const updatedList = list.map(p => (String(p.id) === String(productId) || String(p.productId) === String(productId)) ? updatedProduct : p);
                localStorage.setItem(k, JSON.stringify(updatedList));
              }
            }
          }
        }
      } catch (_) {}
    }

    // 3. CRITICAL: Sync into Admin Panel shared local storage key (hinchmart_products_data_v5)
    // Ensures Admin sees the product as PENDING review with the newly submitted details!
    if (typeof localStorage !== 'undefined') {
      try {
        const adminKey = 'hinchmart_products_data_v5';
        const adminList = JSON.parse(localStorage.getItem(adminKey) || '[]');
        if (Array.isArray(adminList)) {
          const filteredAdmin = adminList.filter(
            p => String(p.id) !== String(productId) && String(p.productId) !== String(productId)
          );
          const adminItem = {
            ...updatedProduct,
            status: updatedProduct.status || 'PENDING',
            approvalStatus: updatedProduct.approvalStatus || 'PENDING',
            deletedByAdmin: false,
            active: false,
            reSubmittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(adminKey, JSON.stringify([adminItem, ...filteredAdmin]));
        }
      } catch (e) {}
    }

    // 4. Remove from deleted IDs so it is unblocked everywhere
    try {
      const delIds = getStorage('hinchmart_deleted_product_ids', []);
      if (Array.isArray(delIds) && delIds.length > 0) {
        const pidStr = String(productId);
        const rawPid = pidStr.replace(/^sp_/, '');
        const cleaned = delIds.filter((x) => x !== pidStr && x !== rawPid && x !== `sp_${rawPid}`);
        setStorage('hinchmart_deleted_product_ids', cleaned);
      }
    } catch (_) {}

    // 5. Broadcast to any open admin tabs via BroadcastChannel & custom events
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('hinchmart_catalog_updated', { detail: updatedProduct }));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('hinchmart_catalog_sync');
          bc.postMessage({ type: 'PRODUCT_RESUBMITTED', product: updatedProduct });
          bc.close();
        }
      } catch (_) {}
    }

    return updatedProduct;
  },

  deleteSellerProduct(sellerId, productId) {
    if (!productId) return false;
    return this.deleteProduct(productId);
  },

  // Deleted Product History Tracking
  clearDeletedProductIds() {
    setStorage(DB_KEYS.DELETED_PRODUCTS, []);
  },

  bulkUpdateSellerStock(sellerId, stockUpdates) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];
    const products = this.getSellerProducts(cleanId);
    const storageKey = this.getSellerProductsKey(cleanId);

    const updateMap = new Map();
    stockUpdates.forEach((item) => {
      updateMap.set(String(item.id || item.productId), item);
    });

    const updated = products.map((p) => {
      const match = updateMap.get(String(p.id)) || updateMap.get(String(p.productId));
      if (match) {
        const newStock = match.stock !== undefined ? Number(match.stock) : (match.quantity !== undefined ? Number(match.quantity) : p.stock);
        return {
          ...p,
          stock: newStock,
          stockQty: newStock,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setStorage(storageKey, updated);
    return updated;
  },

  bulkUpdateSellerPrices(sellerId, priceAdjustments) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];
    const products = this.getSellerProducts(cleanId);
    const storageKey = this.getSellerProductsKey(cleanId);

    const adjMap = new Map();
    priceAdjustments.forEach((item) => {
      adjMap.set(String(item.id || item.productId), item);
    });

    const updated = products.map((p) => {
      const adj = adjMap.get(String(p.id)) || adjMap.get(String(p.productId));
      if (adj) {
        return {
          ...p,
          sellingPrice: adj.newSellingPrice !== undefined ? adj.newSellingPrice : p.sellingPrice,
          price: adj.newSellingPrice !== undefined ? adj.newSellingPrice : p.price,
          mrp: adj.newMrp !== undefined ? adj.newMrp : p.mrp,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setStorage(storageKey, updated);
    return updated;
  },

  updateSellerStock(sellerId, productId, stockQty) {
    const cleanId = this.getCleanSellerId(sellerId);
    let updated = null;
    if (cleanId) {
      updated = this.updateSellerProduct(cleanId, productId, {
        stockQty: Number(stockQty),
        stock: Number(stockQty),
      });
      if (updated) return updated;
    }

    // Scan all keys in storage if not found under default seller
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hinchmart_seller_products_')) {
          try {
            const list = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(list) && list.some(p => String(p.id) === String(productId) || String(p.productId) === String(productId))) {
              const ownerSellerId = key.replace('hinchmart_seller_products_', '');
              return this.updateSellerProduct(ownerSellerId, productId, {
                stockQty: Number(stockQty),
                stock: Number(stockQty),
              });
            }
          } catch (e) {}
        }
      }
    } else {
      for (const key of Object.keys(memoryStorage)) {
        if (key && key.startsWith('hinchmart_seller_products_')) {
          const list = memoryStorage[key];
          if (Array.isArray(list) && list.some(p => String(p.id) === String(productId) || String(p.productId) === String(productId))) {
            const ownerSellerId = key.replace('hinchmart_seller_products_', '');
            return this.updateSellerProduct(ownerSellerId, productId, {
              stockQty: Number(stockQty),
              stock: Number(stockQty),
            });
          }
        }
      }
    }

    return null;
  },

  updateSellerProductStock(sellerId, productId, stockQty) {
    return this.updateSellerStock(sellerId, productId, stockQty);
  },

  updateSellerPrice(sellerId, productId, priceData) {
    return this.updateSellerProduct(sellerId, productId, {
      price: Number(priceData.sellingPrice ?? priceData.price),
      sellingPrice: Number(priceData.sellingPrice ?? priceData.price),
      mrp: Number(priceData.mrp ?? 0),
      bulkPricingTiers: priceData.bulkPricingTiers || [],
    });
  },

  // =========================================================================
  // SELLER-ISOLATED CATEGORIES, SUBCATEGORIES, AND BRANDS
  // Ensures Seller sees ONLY categories, subcategories, and brands added by this seller
  // =========================================================================
  getSellerCategoriesKey(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    return cleanId ? `hinchmart_seller_categories_${cleanId}` : 'hinchmart_seller_categories_empty';
  },

  getSellerCategories(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];
    const storageKey = this.getSellerCategoriesKey(cleanId);
    const categories = getStorage(storageKey, []);
    return Array.isArray(categories) ? categories : [];
  },

  clearSellerCategories(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];
    const storageKey = this.getSellerCategoriesKey(cleanId);
    setStorage(storageKey, []);
    return [];
  },

  createSellerCategory(sellerId, catData) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return null;
    const categories = this.getSellerCategories(cleanId);
    const storageKey = this.getSellerCategoriesKey(cleanId);

    const title = catData.name?.trim() || catData.title?.trim() || 'New Category';
    const newCat = {
      ...catData,
      id: catData.id || catData.categoryId || `cat_${Date.now()}`,
      categoryId: catData.categoryId || catData.id || Date.now(),
      name: title,
      title: title,
      slug: catData.slug?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: catData.description || '',
      imageUrl: catData.imageUrl || null,
      sortOrder: Number(catData.sortOrder ?? catData.displayOrder ?? 0),
      active: catData.active !== false,
      status: 'Pending Approval',
      subcategories: catData.subcategories || [],
      productCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newCat, ...categories.filter(c => String(c.id) !== String(newCat.id) && c.slug !== newCat.slug)];
    setStorage(storageKey, updated);
    return newCat;
  },

  updateSellerCategory(sellerId, catId, updates) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return null;
    const categories = this.getSellerCategories(cleanId);
    const storageKey = this.getSellerCategoriesKey(cleanId);

    let updatedCat = null;
    const updated = categories.map((c) => {
      if (String(c.id) === String(catId) || String(c.categoryId) === String(catId)) {
        updatedCat = { ...c, ...updates, updatedAt: new Date().toISOString() };
        return updatedCat;
      }
      return c;
    });

    if (!updatedCat) {
      updatedCat = { id: catId, categoryId: catId, ...updates, updatedAt: new Date().toISOString() };
      updated.unshift(updatedCat);
    }

    setStorage(storageKey, updated);
    return updatedCat;
  },

  deleteSellerCategory(sellerId, catId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return false;
    const categories = this.getSellerCategories(cleanId);
    const storageKey = this.getSellerCategoriesKey(cleanId);

    const filtered = categories.filter((c) => String(c.id) !== String(catId) && String(c.categoryId) !== String(catId));
    setStorage(storageKey, filtered);
    return true;
  },

  // Subcategories
  getSellerSubcategoriesKey(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    return cleanId ? `hinchmart_seller_subcategories_${cleanId}` : 'hinchmart_seller_subcategories_empty';
  },

  getSellerSubcategories(sellerId, categoryId = null) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];
    const storageKey = this.getSellerSubcategoriesKey(cleanId);
    const subs = getStorage(storageKey, []);
    const allSubs = Array.isArray(subs) ? subs : [];

    if (categoryId && categoryId !== 'ALL') {
      return allSubs.filter((s) => String(s.categoryId) === String(categoryId));
    }
    return allSubs;
  },

  clearSellerSubcategories(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];
    const storageKey = this.getSellerSubcategoriesKey(cleanId);
    setStorage(storageKey, []);
    return [];
  },

  createSellerSubcategory(sellerId, subData) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return null;
    const subs = this.getSellerSubcategories(cleanId);
    const storageKey = this.getSellerSubcategoriesKey(cleanId);

    const name = subData.name?.trim() || subData.title?.trim() || 'New Subcategory';
    const newSub = {
      ...subData,
      id: subData.id || subData.subcategoryId || `sub_${Date.now()}`,
      subcategoryId: subData.subcategoryId || subData.id || Date.now(),
      categoryId: subData.categoryId || 61,
      categoryName: subData.categoryName || 'Pencils',
      name,
      title: name,
      slug: subData.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sortOrder: Number(subData.sortOrder || 0),
      imageUrl: subData.imageUrl || null,
      active: subData.active !== false,
      status: 'Pending Approval',
      brandsCount: 0,
      brands: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [newSub, ...subs.filter(s => String(s.id) !== String(newSub.id) && s.slug !== newSub.slug)];
    setStorage(storageKey, updated);
    return newSub;
  },

  updateSellerSubcategory(sellerId, subId, updates) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return null;
    const subs = this.getSellerSubcategories(cleanId);
    const storageKey = this.getSellerSubcategoriesKey(cleanId);

    let updatedSub = null;
    const updated = subs.map((s) => {
      if (String(s.id) === String(subId) || String(s.subcategoryId) === String(subId)) {
        updatedSub = { ...s, ...updates, updatedAt: new Date().toISOString() };
        return updatedSub;
      }
      return s;
    });

    if (!updatedSub) {
      updatedSub = { id: subId, subcategoryId: subId, ...updates, updatedAt: new Date().toISOString() };
      updated.unshift(updatedSub);
    }

    setStorage(storageKey, updated);
    return updatedSub;
  },

  deleteSellerSubcategory(sellerId, subId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return false;
    const subs = this.getSellerSubcategories(cleanId);
    const storageKey = this.getSellerSubcategoriesKey(cleanId);

    const filtered = subs.filter((s) => String(s.id) !== String(subId) && String(s.subcategoryId) !== String(subId));
    setStorage(storageKey, filtered);
    return true;
  },

  // Brands
  getSellerBrandsKey(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    return cleanId ? `hinchmart_seller_brands_${cleanId}` : 'hinchmart_seller_brands_empty';
  },

  getSellerBrands(sellerId, options = {}) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];
    const storageKey = this.getSellerBrandsKey(cleanId);
    const brands = getStorage(storageKey, []);
    const allBrands = Array.isArray(brands) ? brands : [];

    const { subcategoryId, categoryId } = typeof options === 'object' && options !== null ? options : {};
    let filtered = allBrands;
    if (subcategoryId && subcategoryId !== 'ALL') {
      filtered = filtered.filter(b => String(b.subcategoryId) === String(subcategoryId));
    }
    if (categoryId && categoryId !== 'ALL') {
      filtered = filtered.filter(b => String(b.categoryId) === String(categoryId));
    }
    return filtered;
  },

  clearSellerBrands(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return [];
    const storageKey = this.getSellerBrandsKey(cleanId);
    setStorage(storageKey, []);
    return [];
  },

  createSellerBrand(sellerId, brandData) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return null;
    const brands = this.getSellerBrands(cleanId);
    const storageKey = this.getSellerBrandsKey(cleanId);

    const name = brandData.name?.trim() || 'New Brand';
    const newBrand = {
      ...brandData,
      id: brandData.id || brandData.brandId || `b_${Date.now()}`,
      brandId: brandData.brandId || brandData.id || Date.now(),
      name,
      brandName: name,
      slug: brandData.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      categoryId: brandData.categoryId || 61,
      categoryName: brandData.categoryName || 'Pencils',
      subcategoryId: brandData.subcategoryId || 110,
      subcategoryName: brandData.subcategoryName || 'Color Pencil',
      imageUrl: brandData.imageUrl || null,
      sortOrder: Number(brandData.sortOrder || 1),
      active: brandData.active !== false,
      status: 'Pending Approval',
      verified: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newBrand, ...brands.filter(b => String(b.id) !== String(newBrand.id) && b.slug !== newBrand.slug)];
    setStorage(storageKey, updated);
    return newBrand;
  },

  updateSellerBrand(sellerId, brandId, updates) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return null;
    const brands = this.getSellerBrands(cleanId);
    const storageKey = this.getSellerBrandsKey(cleanId);

    let updatedBrand = null;
    const updated = brands.map((b) => {
      if (String(b.id) === String(brandId) || String(b.brandId) === String(brandId)) {
        updatedBrand = { ...b, ...updates, updatedAt: new Date().toISOString() };
        return updatedBrand;
      }
      return b;
    });

    if (!updatedBrand) {
      updatedBrand = { id: brandId, brandId: brandId, ...updates, updatedAt: new Date().toISOString() };
      updated.unshift(updatedBrand);
    }

    setStorage(storageKey, updated);
    return updatedBrand;
  },

  deleteSellerBrand(sellerId, brandId) {
    const cleanId = this.getCleanSellerId(sellerId);
    if (!cleanId) return false;
    const brands = this.getSellerBrands(cleanId);
    const storageKey = this.getSellerBrandsKey(cleanId);

    const filtered = brands.filter((b) => String(b.id) !== String(brandId) && String(b.brandId) !== String(brandId));
    setStorage(storageKey, filtered);
    return true;
  },


  // Warehouses
  getWarehouses() {
    return getStorage(DB_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
  },

  createWarehouse(whData) {
    const warehouses = this.getWarehouses();
    const newWh = {
      ...whData,
      id: `wh_${Date.now()}`,
      status: 'Active',
      totalSkus: 0,
    };
    const updated = [...warehouses, newWh];
    setStorage(DB_KEYS.WAREHOUSES, updated);
    return newWh;
  },

  updateWarehouse(id, updates) {
    const warehouses = this.getWarehouses();
    let updatedWh = null;
    const updated = warehouses.map(w => {
      if (w.id === id) {
        updatedWh = { ...w, ...updates };
        return updatedWh;
      }
      return w;
    });
    setStorage(DB_KEYS.WAREHOUSES, updated);
    return updatedWh;
  },

  deleteWarehouse(id) {
    const warehouses = this.getWarehouses();
    const filtered = warehouses.filter(w => w.id !== id);
    setStorage(DB_KEYS.WAREHOUSES, filtered);
    return true;
  },

  // Orders
  getOrders() {
    return getStorage(DB_KEYS.ORDERS, INITIAL_ORDERS);
  },

  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => o.id === id || o.orderNumber === id) || null;
  },

  generateOrderInvoice(id) {
    const orders = this.getOrders();
    const seller = this.getSeller();
    let updatedOrder = null;
    let generatedInvoice = null;

    const updated = orders.map(o => {
      if (o.id === id || o.orderNumber === id) {
        // If invoice already exists, preserve it to prevent duplicates
        if (o.invoice && o.invoice.invoiceNumber) {
          updatedOrder = o;
          generatedInvoice = o.invoice;
          return o;
        }

        const invoiceNumber = `INV-${o.orderNumber.replace('ORD-', '')}`;
        generatedInvoice = {
          invoiceNumber,
          invoiceDate: new Date().toISOString().split('T')[0],
          generatedAt: new Date().toISOString(),
          status: 'Generated',
          sellerName: seller?.companyName || 'Ultratech Materials Pvt Ltd',
          sellerGstin: seller?.legal?.gstin || '27AABCV1234E1Z5',
          buyerCompany: o.buyer?.company || 'Contractor',
          buyerGstin: o.buyer?.gstin || '27AAACL1234F1Z1',
          subtotal: o.subtotal,
          gstAmount: o.gstAmount,
          freightCharges: o.freightCharges || 0,
          totalAmount: o.totalAmount,
        };

        const timeline = [
          ...(o.timeline || []),
          {
            status: 'Invoice Generated',
            timestamp: new Date().toISOString(),
            notes: `Commercial Tax Invoice ${invoiceNumber} generated for ${o.orderNumber}`,
          }
        ];

        updatedOrder = {
          ...o,
          invoice: generatedInvoice,
          timeline,
          updatedAt: new Date().toISOString(),
        };
        return updatedOrder;
      }
      return o;
    });

    if (updatedOrder) {
      setStorage(DB_KEYS.ORDERS, updated);
    }
    return { order: updatedOrder, invoice: generatedInvoice };
  },

  updateOrderStatus(id, newStatus, notes, dispatchDetails = null) {
    const orders = this.getOrders();
    const seller = this.getSeller();
    let updatedOrder = null;
    const updated = orders.map(o => {
      if (o.id === id || o.orderNumber === id) {
        const timeline = [
          ...(o.timeline || []),
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            notes: notes || `Order status updated to ${newStatus}`,
          }
        ];

        // If moving to Dispatched and no invoice exists, auto-attach generated invoice
        let currentInvoice = o.invoice;
        if (newStatus === 'Dispatched' && (!currentInvoice || !currentInvoice.invoiceNumber)) {
          const invNum = `INV-${o.orderNumber.replace('ORD-', '')}`;
          currentInvoice = {
            invoiceNumber: invNum,
            invoiceDate: new Date().toISOString().split('T')[0],
            generatedAt: new Date().toISOString(),
            status: 'Generated',
            sellerName: seller?.companyName || 'Ultratech Materials Pvt Ltd',
            sellerGstin: seller?.legal?.gstin || '27AABCV1234E1Z5',
            buyerCompany: o.buyer?.company || 'Contractor',
            buyerGstin: o.buyer?.gstin || '27AAACL1234F1Z1',
            subtotal: o.subtotal,
            gstAmount: o.gstAmount,
            freightCharges: o.freightCharges || 0,
            totalAmount: o.totalAmount,
          };
        }

        updatedOrder = {
          ...o,
          orderStatus: newStatus,
          timeline,
          invoice: currentInvoice,
          dispatchDetails: dispatchDetails ? { ...o.dispatchDetails, ...dispatchDetails } : o.dispatchDetails,
          updatedAt: new Date().toISOString(),
        };
        return updatedOrder;
      }
      return o;
    });
    setStorage(DB_KEYS.ORDERS, updated);
    return updatedOrder;
  },

  createOrder(orderData) {
    const orders = this.getOrders();
    const seller = this.getSeller();
    const orderSeq = orders.length + 1;
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderSeq).padStart(5, '0')}`;
    const isoDate = new Date().toISOString();

    const newOrder = {
      id: `ord_${Date.now()}`,
      orderNumber,
      buyer: orderData.buyer || {
        name: 'Authorized Buyer',
        company: 'Client Enterprises Ltd',
        phone: '+91 98200 11223',
        email: 'procurement@client.com',
        gstin: '27AABCA1234F1Z5',
      },
      deliveryAddress: orderData.deliveryAddress || {
        siteName: 'Project Main Site',
        address: 'Site Logistics Yard, Maharashtra',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
      items: orderData.items || [],
      subtotal: Number(orderData.subtotal || 0),
      gstAmount: Number(orderData.gstAmount || orderData.taxTotal || 0),
      freightCharges: Number(orderData.freightCharges || 0),
      totalAmount: Number(orderData.totalAmount || 0),
      paymentStatus: orderData.paymentStatus || 'Pending',
      orderStatus: orderData.orderStatus || 'New',
      warehouseId: orderData.warehouseId || 'wh_1',
      deliveryDate: orderData.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: isoDate,
      updatedAt: isoDate,
      invoice: null,
      timeline: [
        {
          status: 'Order Placed',
          timestamp: isoDate,
          notes: orderData.notes || 'Order created through HinchMart Seller Portal.',
        },
      ],
    };

    const updated = [newOrder, ...orders];
    setStorage(DB_KEYS.ORDERS, updated);
    return newOrder;
  },

  // Enquiries
  getEnquiries() {
    return getStorage(DB_KEYS.ENQUIRIES, INITIAL_ENQUIRIES);
  },

  getEnquiryById(id) {
    const enquiries = this.getEnquiries();
    return enquiries.find(e => e.id === id) || null;
  },

  updateEnquiryStatus(id, newStatus, quotationId = null) {
    const enquiries = this.getEnquiries();
    let updatedEnquiry = null;
    const updated = enquiries.map(e => {
      if (e.id === id) {
        updatedEnquiry = {
          ...e,
          status: newStatus,
          quotationId: quotationId || e.quotationId,
        };
        return updatedEnquiry;
      }
      return e;
    });
    setStorage(DB_KEYS.ENQUIRIES, updated);
    return updatedEnquiry;
  },

  // Quotations
  getQuotations() {
    return getStorage(DB_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  },

  getQuotationById(id) {
    const quotations = this.getQuotations();
    return quotations.find(q => q.id === id || q.quotationNumber === id) || null;
  },

  createQuotation(quotationData) {
    const quotations = this.getQuotations();
    const count = quotations.length + 703;
    const newQuotation = {
      ...quotationData,
      id: `quot_${Date.now()}`,
      quotationNumber: `QT-2026-00${count}`,
      createdAt: new Date().toISOString(),
      status: quotationData.status || 'Sent to Buyer',
    };
    const updated = [newQuotation, ...quotations];
    setStorage(DB_KEYS.QUOTATIONS, updated);

    // If linked to enquiry, update enquiry status
    if (quotationData.enquiryId) {
      this.updateEnquiryStatus(quotationData.enquiryId, 'Quotation Sent', newQuotation.id);
    }

    return newQuotation;
  },

  updateQuotation(id, updates) {
    const quotations = this.getQuotations();
    let updatedQ = null;
    const updated = quotations.map(q => {
      if (q.id === id) {
        updatedQ = { ...q, ...updates };
        return updatedQ;
      }
      return q;
    });
    setStorage(DB_KEYS.QUOTATIONS, updated);
    return updatedQ;
  },

  deleteQuotation(id) {
    const quotations = this.getQuotations();
    const filtered = quotations.filter(q => q.id !== id);
    setStorage(DB_KEYS.QUOTATIONS, filtered);
    return true;
  },


  // Documents & Compliance Verification
  syncSellerVerification(documentsList) {
    const docs = documentsList || this.getDocuments();
    const allApproved = docs.length > 0 && docs.every(d => d.status === 'Verified');
    const hasRejected = docs.some(d => d.status === 'Rejected');

    const currentSeller = this.getSeller();
    const currentProgress = currentSeller.verificationProgress || {};

    let newStatus = 'Under Review';
    let isVerified = false;
    let docsApproved = false;

    if (allApproved) {
      newStatus = 'Verified';
      isVerified = true;
      docsApproved = true;
    } else if (hasRejected) {
      newStatus = 'Action Required';
      isVerified = false;
      docsApproved = false;
    } else {
      newStatus = 'Under Review';
      isVerified = false;
      docsApproved = false;
    }

    const updatedSeller = {
      ...currentSeller,
      verified: isVerified,
      verificationStatus: newStatus,
      verificationProgress: {
        ...currentProgress,
        documentsApproved: docsApproved,
      },
      completionPercentage: allApproved ? 92 : 85,
      updatedAt: new Date().toISOString(),
    };
    setStorage(DB_KEYS.SELLER, updatedSeller);
    return updatedSeller;
  },

  getDocuments() {
    const docs = getStorage(DB_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    const cleaned = (docs || []).filter(d => !['doc_1', 'doc_2', 'doc_3', 'doc_4', 'doc_5'].includes(d.id));
    if (cleaned.length !== (docs || []).length) {
      setStorage(DB_KEYS.DOCUMENTS, cleaned);
    }
    return cleaned;
  },

  uploadDocument(docData) {
    const documents = this.getDocuments();
    const newDoc = {
      ...docData,
      id: `doc_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      status: 'Pending',
      verifiedAt: null,
      reviewedBy: null,
      notes: 'Submitted for compliance audit and validation',
    };
    const updated = [newDoc, ...documents];
    setStorage(DB_KEYS.DOCUMENTS, updated);
    this.syncSellerVerification(updated);
    return newDoc;
  },

  updateDocumentStatus(id, status, details = {}) {
    const documents = this.getDocuments();
    let updatedDoc = null;
    const updated = documents.map(d => {
      if (d.id === id) {
        updatedDoc = {
          ...d,
          status,
          ...details,
          reviewedBy: details.reviewedBy || (status === 'Verified' ? 'HinchMart Compliance Admin' : d.reviewedBy),
          verifiedAt: status === 'Verified' ? new Date().toISOString() : null,
          rejectionReason: status === 'Rejected' ? (details.rejectionReason || 'Document could not be verified') : null,
          updatedAt: new Date().toISOString(),
        };
        return updatedDoc;
      }
      return d;
    });
    setStorage(DB_KEYS.DOCUMENTS, updated);
    this.syncSellerVerification(updated);
    return updatedDoc;
  },

  updateDocument(id, updates) {
    const documents = this.getDocuments();
    let updatedDoc = null;
    const updated = documents.map(d => {
      if (d.id === id) {
        updatedDoc = {
          ...d,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return updatedDoc;
      }
      return d;
    });
    if (updatedDoc) {
      setStorage(DB_KEYS.DOCUMENTS, updated);
      this.syncSellerVerification(updated);
    }
    return updatedDoc;
  },

  saveComplianceDocument(docType, data) {
    const documents = this.getDocuments();
    const normalizedType =
      docType === 'PAN Card' || docType === 'PAN Document'
        ? 'PAN Document'
        : docType === 'Aadhaar Card' || docType === 'Aadhaar Document'
        ? 'Aadhaar Document'
        : 'GST Certificate';

    const existingIndex = documents.findIndex(
      d =>
        d.type === normalizedType ||
        (normalizedType === 'PAN Document' && (d.type?.toLowerCase().includes('pan') || d.name?.toLowerCase().includes('pan'))) ||
        (normalizedType === 'Aadhaar Document' && (d.type?.toLowerCase().includes('aadhaar') || d.name?.toLowerCase().includes('aadhaar') || d.name?.toLowerCase().includes('aadhar'))) ||
        (normalizedType === 'GST Certificate' && (d.type?.toLowerCase().includes('gst') || d.name?.toLowerCase().includes('gst')))
    );

    const docPayload = {
      name:
        normalizedType === 'PAN Document'
          ? 'Company PAN Card'
          : normalizedType === 'Aadhaar Document'
          ? 'Aadhaar Card'
          : 'GST Registration Certificate (Form REG-06)',
      type: normalizedType,
      documentNumber: data.documentNumber || data.number || '',
      fileName: data.fileName || `${normalizedType.toLowerCase().replace(/\s+/g, '_')}_2026.pdf`,
      fileSize: data.fileSize || '1.1 MB',
      fileUrl: data.fileUrl || '/mock/docs/sample.pdf',
      status: data.status || 'Pending',
      notes: data.notes || 'Submitted for statutory audit & verification by Admin',
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedDocs = [];
    let savedDoc = null;

    if (existingIndex >= 0) {
      savedDoc = { ...documents[existingIndex], ...docPayload, id: documents[existingIndex].id };
      updatedDocs = [...documents];
      updatedDocs[existingIndex] = savedDoc;
    } else {
      savedDoc = { ...docPayload, id: `doc_${Date.now()}` };
      updatedDocs = [savedDoc, ...documents];
    }

    setStorage(DB_KEYS.DOCUMENTS, updatedDocs);
    this.syncSellerVerification(updatedDocs);

    // Also sync with seller profile
    const seller = this.getSeller();
    const sellerUpdates = {};
    if (normalizedType === 'PAN Document' && data.documentNumber) {
      sellerUpdates.panNumber = data.documentNumber.toUpperCase();
      sellerUpdates.panCardNumber = data.documentNumber.toUpperCase();
    } else if (normalizedType === 'Aadhaar Document' && data.documentNumber) {
      sellerUpdates.aadhaarNumber = data.documentNumber;
    } else if (normalizedType === 'GST Certificate' && data.documentNumber) {
      sellerUpdates.gstin = data.documentNumber.toUpperCase();
      if (seller.legal) {
        sellerUpdates.legal = { ...seller.legal, gstin: data.documentNumber.toUpperCase() };
      }
    }
    if (Object.keys(sellerUpdates).length > 0) {
      this.updateSeller(sellerUpdates);
    }

    return savedDoc;
  },

  approveDocument(id, notes = 'Verified against statutory portal records') {
    return this.updateDocumentStatus(id, 'Verified', {
      notes,
      reviewedBy: 'HinchMart Compliance Admin',
    });
  },

  rejectDocument(id, rejectionReason = 'Document image is blurred or expired. Please upload a clear valid copy.') {
    return this.updateDocumentStatus(id, 'Rejected', {
      rejectionReason,
      reviewedBy: 'HinchMart Compliance Admin',
    });
  },

  approveAllDocuments() {
    const documents = this.getDocuments();
    const updated = documents.map(d => ({
      ...d,
      status: 'Verified',
      verifiedAt: new Date().toISOString(),
      reviewedBy: 'HinchMart Compliance Admin',
      rejectionReason: null,
      notes: 'Approved during batch statutory audit',
      updatedAt: new Date().toISOString(),
    }));
    setStorage(DB_KEYS.DOCUMENTS, updated);
    this.syncSellerVerification(updated);
    return updated;
  },

  resetDocuments() {
    setStorage(DB_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    this.syncSellerVerification(INITIAL_DOCUMENTS);
    return INITIAL_DOCUMENTS;
  },

  deleteDocument(id) {
    const documents = this.getDocuments();
    const filtered = documents.filter(d => d.id !== id);
    setStorage(DB_KEYS.DOCUMENTS, filtered);
    this.syncSellerVerification(filtered);
    return true;
  },

  // Notifications
  getNotifications() {
    return getStorage(DB_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  markNotificationRead(id) {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setStorage(DB_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  markAllNotificationsRead() {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    setStorage(DB_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  // Analytics
  getAnalytics() {
    return getStorage(DB_KEYS.ANALYTICS, INITIAL_ANALYTICS);
  },

  // Customers (Admin-controlled Customer Database)
  getCustomers(params = {}) {
    let customers = getStorage(DB_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);

    if (params.search) {
      const q = params.search.toLowerCase();
      customers = customers.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          (c.gstin && c.gstin.toLowerCase().includes(q)) ||
          (c.city && c.city.toLowerCase().includes(q))
      );
    }

    if (params.status && params.status !== 'All') {
      customers = customers.filter(c => c.status === params.status);
    }

    if (params.state && params.state !== 'All') {
      customers = customers.filter(c => c.state === params.state);
    }

    if (params.city && params.city !== 'All') {
      customers = customers.filter(c => c.city === params.city);
    }

    return customers;
  },

  getCustomerById(id) {
    const customers = this.getCustomers();
    return customers.find(c => c.id === id) || null;
  },

  createCustomer(customerData) {
    const customers = getStorage(DB_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const newId = customerData.id || `CUST-00${100 + customers.length + 1}`;
    const newCustomer = {
      ...customerData,
      id: newId,
      status: customerData.status || 'Active',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };
    const updated = [newCustomer, ...customers];
    setStorage(DB_KEYS.CUSTOMERS, updated);
    return newCustomer;
  },

  updateCustomer(id, updates) {
    const customers = getStorage(DB_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    let updatedCustomer = null;
    const updated = customers.map(c => {
      if (c.id === id) {
        updatedCustomer = {
          ...c,
          ...updates,
          updatedDate: new Date().toISOString(),
        };
        return updatedCustomer;
      }
      return c;
    });
    setStorage(DB_KEYS.CUSTOMERS, updated);
    return updatedCustomer;
  },

  updateCustomerStatus(id, status) {
    return this.updateCustomer(id, { status });
  },

  searchCustomers(query = '') {
    const customers = getStorage(DB_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    if (!query) return customers.filter(c => c.status === 'Active');
    const q = query.toLowerCase();
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.gstin && c.gstin.toLowerCase().includes(q))
    );
  },

  // Label History
  getLabelHistory(params = {}) {
    let history = getStorage(DB_KEYS.LABEL_HISTORY, INITIAL_LABEL_HISTORY);

    // Self-healing: if localStorage has old 3-item stub, hydrate with expanded rich data
    if (!history || history.length < 15) {
      history = INITIAL_LABEL_HISTORY;
      setStorage(DB_KEYS.LABEL_HISTORY, history);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      history = history.filter(
        l =>
          (l.id && l.id.toLowerCase().includes(q)) ||
          (l.customerCompany && l.customerCompany.toLowerCase().includes(q)) ||
          (l.customerName && l.customerName.toLowerCase().includes(q)) ||
          (l.productName && l.productName.toLowerCase().includes(q)) ||
          (l.productId && l.productId.toLowerCase().includes(q)) ||
          (l.productSku && l.productSku.toLowerCase().includes(q)) ||
          (l.sku && l.sku.toLowerCase().includes(q)) ||
          (l.batchNumber && l.batchNumber.toLowerCase().includes(q))
      );
    }

    if (params.customerId && params.customerId !== 'All') {
      history = history.filter(l => l.customerId === params.customerId || l.customerCompany === params.customerId);
    }

    if (params.productId && params.productId !== 'All') {
      history = history.filter(l => l.productId === params.productId || l.productSku === params.productId || l.productName === params.productId);
    }

    if (params.status && params.status !== 'All') {
      history = history.filter(l => l.status === params.status);
    }

    if (params.dateFilter && params.dateFilter !== 'All') {
      const now = new Date();
      if (params.dateFilter === 'Today') {
        const todayStr = now.toISOString().slice(0, 10);
        history = history.filter(l => l.createdAt && l.createdAt.slice(0, 10) === todayStr);
      } else if (params.dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        history = history.filter(l => new Date(l.createdAt || 0) >= sevenDaysAgo);
      } else if (params.dateFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        history = history.filter(l => new Date(l.createdAt || 0) >= thirtyDaysAgo);
      } else if (params.dateFilter === 'This Month') {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        history = history.filter(l => {
          const d = new Date(l.createdAt || 0);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
      }
    }

    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      history = history.filter(l => {
        const d = new Date(l.createdAt || 0);
        return d >= start && d <= end;
      });
    }

    return history;
  },

  getLabelById(id) {
    const history = getStorage(DB_KEYS.LABEL_HISTORY, INITIAL_LABEL_HISTORY);
    return history.find(l => l.id === id) || null;
  },

  createLabel(labelData) {
    const history = getStorage(DB_KEYS.LABEL_HISTORY, INITIAL_LABEL_HISTORY);
    const newId = labelData.id || `LBL-2026-00${800 + history.length + 1}`;
    const newLabel = {
      ...labelData,
      id: newId,
      status: labelData.status || 'Generated',
      createdAt: new Date().toISOString(),
    };
    const updated = [newLabel, ...history];
    setStorage(DB_KEYS.LABEL_HISTORY, updated);
    return newLabel;
  },

  updateLabelStatus(id, status = 'Printed') {
    const history = getStorage(DB_KEYS.LABEL_HISTORY, INITIAL_LABEL_HISTORY);
    let updatedLabel = null;
    const updated = history.map(l => {
      if (l.id === id) {
        updatedLabel = { ...l, status, printedAt: new Date().toISOString() };
        return updatedLabel;
      }
      return l;
    });
    setStorage(DB_KEYS.LABEL_HISTORY, updated);
    return updatedLabel;
  },

  deleteLabel(id) {
    const history = getStorage(DB_KEYS.LABEL_HISTORY, INITIAL_LABEL_HISTORY);
    const filtered = history.filter(l => l.id !== id);
    setStorage(DB_KEYS.LABEL_HISTORY, filtered);
    return true;
  },

  deleteMultipleLabels(ids = []) {
    const history = getStorage(DB_KEYS.LABEL_HISTORY, INITIAL_LABEL_HISTORY);
    const filtered = history.filter(l => !ids.includes(l.id));
    setStorage(DB_KEYS.LABEL_HISTORY, filtered);
    return true;
  },

  // =========================================================================
  // SELLER SUPPORT TICKETS
  // =========================================================================
  getSupportTicketsKey(sellerId) {
    const cleanId = this.getCleanSellerId(sellerId);
    return `hinchmart_seller_tickets_${cleanId}`;
  },

  getSupportTickets(sellerId) {
    const key = this.getSupportTicketsKey(sellerId);
    return getStorage(key, []);
  },

  setSupportTickets(sellerId, tickets) {
    const key = this.getSupportTicketsKey(sellerId);
    setStorage(key, Array.isArray(tickets) ? tickets : []);
  },

  getSupportTicketById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    // Search across all seller tickets keys
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('hinchmart_seller_tickets_')) {
          try {
            const list = JSON.parse(localStorage.getItem(k));
            if (Array.isArray(list)) {
              const found = list.find((t) => String(t.ticketId) === cleanId || String(t.id) === cleanId || String(t.ticketNumber) === cleanId);
              if (found) return found;
            }
          } catch (_) {}
        }
      }
    }
    const current = this.getSupportTickets();
    return current.find((t) => String(t.ticketId) === cleanId || String(t.id) === cleanId || String(t.ticketNumber) === cleanId) || null;
  },

  createSupportTicket(ticketData) {
    const seller = this.getSeller();
    const cleanSellerId = this.getCleanSellerId(ticketData.sellerId);
    const existing = this.getSupportTickets(cleanSellerId);
    const newId = ticketData.ticketId || (Date.now() % 100000);
    const ticketNumber = ticketData.ticketNumber || `STKT-${Date.now()}`;
    const initialMessage = ticketData.message
      ? [
          {
            messageId: Date.now() + 1,
            ticketId: newId,
            senderId: Number(cleanSellerId) || 5,
            senderRole: 'SELLER',
            senderName: ticketData.sellerName || seller?.companyName || seller?.name || 'Seller Admin',
            content: ticketData.message,
            attachmentUrl: ticketData.attachmentUrl || null,
            timestamp: new Date().toISOString(),
          },
        ]
      : [];

    const newTicket = {
      ticketId: newId,
      id: newId,
      ticketNumber,
      sellerId: Number(cleanSellerId) || 5,
      sellerName: ticketData.sellerName || seller?.companyName || seller?.name || 'Seller Enterprise',
      subject: ticketData.subject || '',
      category: ticketData.category || 'GENERAL',
      priority: ticketData.priority || 'MEDIUM',
      status: ticketData.status || 'OPEN',
      orderId: ticketData.orderId ? Number(ticketData.orderId) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: Array.isArray(ticketData.messages) && ticketData.messages.length > 0 ? ticketData.messages : initialMessage,
    };

    const updated = [newTicket, ...existing];
    this.setSupportTickets(cleanSellerId, updated);
    return newTicket;
  },

  addSupportTicketMessage(ticketId, messageData) {
    const cleanId = String(ticketId).trim();
    const seller = this.getSeller();
    const cleanSellerId = this.getCleanSellerId();
    const tickets = this.getSupportTickets(cleanSellerId);

    const newMessage = {
      messageId: messageData.messageId || Date.now(),
      ticketId: Number(ticketId) || ticketId,
      senderId: messageData.senderId || Number(cleanSellerId) || 5,
      senderRole: messageData.senderRole || 'SELLER',
      senderName: messageData.senderName || seller?.companyName || seller?.name || 'Seller Admin',
      content: messageData.content || '',
      attachmentUrl: messageData.attachmentUrl || null,
      timestamp: new Date().toISOString(),
    };

    let targetTicket = null;
    const updatedTickets = tickets.map((t) => {
      if (String(t.ticketId) === cleanId || String(t.id) === cleanId) {
        const msgs = Array.isArray(t.messages) ? [...t.messages, newMessage] : [newMessage];
        const newStatus = t.status === 'CLOSED' ? 'IN_PROGRESS' : t.status;
        targetTicket = { ...t, messages: msgs, status: newStatus, updatedAt: new Date().toISOString() };
        return targetTicket;
      }
      return t;
    });

    if (targetTicket) {
      this.setSupportTickets(cleanSellerId, updatedTickets);
    }
    return newMessage;
  }
};

// Auto-run init
if (typeof window !== 'undefined') {
  initDB();
}
