import { apiClient, delay, hasValidLiveAuth, canAccessSellerApi } from './apiClient.js';
import { db } from '../mock/db.js';

export const customerService = {
  // GET /customers
  async getCustomers(params = {}) {
    if (hasValidLiveAuth() && canAccessSellerApi('/api/seller/customers')) {
      try {
        const response = await apiClient.get('/api/seller/customers', { params });
        const list = response.data?.data || response.data?.customers || response.data;
        if (Array.isArray(list)) {
          return {
            data: list,
            total: response.data?.total ?? list.length,
          };
        }
      } catch (e) {
        // Fallback to /api/customers if /api/seller/customers is not available
        try {
          const resp = await apiClient.get('/api/customers', { params });
          const list = resp.data?.data || resp.data?.customers || resp.data;
          if (Array.isArray(list)) {
            return {
              data: list,
              total: resp.data?.total ?? list.length,
            };
          }
        } catch (e2) {
          // Graceful fallback
        }
      }
    }

    await delay(150);
    const customers = db.getCustomers ? db.getCustomers(params) : [];
    return {
      data: customers,
      total: customers.length,
    };
  },

  // GET /customers/:id
  async getCustomerById(id) {
    if (hasValidLiveAuth()) {
      try {
        const resp = await apiClient.get(`/api/seller/customers/${id}`);
        const data = resp.data?.data || resp.data?.customer || resp.data;
        if (data && typeof data === 'object') return data;
      } catch (e) {
        try {
          const resp = await apiClient.get(`/api/customers/${id}`);
          const data = resp.data?.data || resp.data?.customer || resp.data;
          if (data && typeof data === 'object') return data;
        } catch (e2) {}
      }
    }

    await delay(100);
    const customer = db.getCustomerById ? db.getCustomerById(id) : null;
    if (!customer) throw new Error(`Customer with ID ${id} not found`);
    return customer;
  },

  // POST /customers
  async createCustomer(customerData) {
    if (hasValidLiveAuth()) {
      try {
        const resp = await apiClient.post('/api/seller/customers', customerData);
        const data = resp.data?.data || resp.data?.customer || resp.data;
        if (data) return data;
      } catch (e) {
        try {
          const resp = await apiClient.post('/api/customers', customerData);
          const data = resp.data?.data || resp.data?.customer || resp.data;
          if (data) return data;
        } catch (e2) {}
      }
    }

    await delay(250);
    return db.createCustomer ? db.createCustomer(customerData) : { id: `cust_${Date.now()}`, ...customerData };
  },

  // PUT /customers/:id
  async updateCustomer(id, updates) {
    if (hasValidLiveAuth()) {
      try {
        const resp = await apiClient.put(`/api/seller/customers/${id}`, updates);
        const data = resp.data?.data || resp.data?.customer || resp.data;
        if (data) return data;
      } catch (e) {
        try {
          const resp = await apiClient.put(`/api/customers/${id}`, updates);
          const data = resp.data?.data || resp.data?.customer || resp.data;
          if (data) return data;
        } catch (e2) {}
      }
    }

    await delay(200);
    const updated = db.updateCustomer ? db.updateCustomer(id, updates) : null;
    if (!updated) throw new Error(`Customer with ID ${id} not found`);
    return updated;
  },

  // PATCH /customers/:id/status
  async updateCustomerStatus(id, status) {
    if (hasValidLiveAuth()) {
      try {
        const resp = await apiClient.patch(`/api/seller/customers/${id}/status`, { status });
        const data = resp.data?.data || resp.data?.customer || resp.data;
        if (data) return data;
      } catch (e) {
        try {
          const resp = await apiClient.patch(`/api/customers/${id}/status`, { status });
          const data = resp.data?.data || resp.data?.customer || resp.data;
          if (data) return data;
        } catch (e2) {}
      }
    }

    await delay(150);
    const updated = db.updateCustomerStatus ? db.updateCustomerStatus(id, status) : null;
    if (!updated) throw new Error(`Customer with ID ${id} not found`);
    return updated;
  },

  // GET /customers/search?q=
  async searchCustomers(query = '') {
    if (hasValidLiveAuth()) {
      try {
        const resp = await apiClient.get('/api/seller/customers', { params: { search: query, q: query } });
        const list = resp.data?.data || resp.data?.customers || resp.data;
        if (Array.isArray(list)) return list;
      } catch (e) {
        try {
          const resp = await apiClient.get('/api/customers/search', { params: { q: query } });
          const list = resp.data?.data || resp.data?.customers || resp.data;
          if (Array.isArray(list)) return list;
        } catch (e2) {}
      }
    }

    await delay(100);
    return db.searchCustomers ? db.searchCustomers(query) : [];
  },
};
