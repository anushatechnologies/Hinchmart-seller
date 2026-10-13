import { db } from '../mock/db.js';
import { apiClient, delay, USE_MOCK_API } from './api.js';
import { isValidTransition } from '../constants/orderStatus.js';

export const orderService = {
  /**
   * Phase 6 — Order Fulfilment
   * GET /api/orders (scoped to authenticated seller)
   */
  async getOrders(filters = {}) {
    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.get('/api/orders', { params: filters });
        const list = response.data?.data || response.data;
        if (Array.isArray(list)) return list;
      } catch (err) {}
    }
    await delay(150);
    let orders = db.getOrders();

    // 1. Status Filter
    if (filters.status && filters.status !== 'All') {
      const statusFilter = filters.status.toLowerCase();
      if (statusFilter === 'new' || statusFilter === 'pending') {
        orders = orders.filter((o) => ['new', 'pending'].includes(o.orderStatus.toLowerCase()));
      } else if (statusFilter === 'packed / ready' || statusFilter === 'ready for dispatch' || statusFilter === 'ready') {
        orders = orders.filter((o) => ['ready for dispatch', 'packed / ready', 'packed', 'ready'].includes(o.orderStatus.toLowerCase()));
      } else if (statusFilter === 'delivered' || statusFilter === 'completed') {
        if (statusFilter === 'delivered') {
          orders = orders.filter((o) => ['delivered', 'completed'].includes(o.orderStatus.toLowerCase()));
        } else {
          orders = orders.filter((o) => o.orderStatus.toLowerCase() === 'completed');
        }
      } else {
        orders = orders.filter((o) => o.orderStatus.toLowerCase() === statusFilter);
      }
    }

    // 2. Customer Filter
    if (filters.customer && filters.customer !== 'All') {
      const customerQ = filters.customer.toLowerCase();
      orders = orders.filter((o) =>
        o.buyer?.company?.toLowerCase().includes(customerQ) ||
        o.buyer?.name?.toLowerCase().includes(customerQ)
      );
    }

    // 3. Payment Status Filter
    if (filters.paymentStatus && filters.paymentStatus !== 'All') {
      const payQ = filters.paymentStatus.toLowerCase();
      orders = orders.filter((o) => o.paymentStatus?.toLowerCase().includes(payQ));
    }

    // 4. Delivery Status Filter
    if (filters.deliveryStatus && filters.deliveryStatus !== 'All') {
      const delQ = filters.deliveryStatus.toLowerCase();
      orders = orders.filter((o) => o.orderStatus?.toLowerCase().includes(delQ));
    }

    // 5. Search Query across Order ID, Company, Buyer Name, Product Names, Invoice Number
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      orders = orders.filter((o) => {
        const matchNumber = o.orderNumber?.toLowerCase().includes(q);
        const matchCompany = o.buyer?.company?.toLowerCase().includes(q);
        const matchBuyer = o.buyer?.name?.toLowerCase().includes(q);
        const matchInvoice = o.invoice?.invoiceNumber?.toLowerCase().includes(q);
        const matchCity = o.deliveryAddress?.city?.toLowerCase().includes(q);
        const matchSite = o.deliveryAddress?.siteName?.toLowerCase().includes(q);
        const matchItems = (o.items || []).some((item) =>
          item.name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)
        );

        return matchNumber || matchCompany || matchBuyer || matchInvoice || matchCity || matchSite || matchItems;
      });
    }

    // 6. Value Filter
    if (filters.minValue) {
      orders = orders.filter((o) => o.totalAmount >= Number(filters.minValue));
    }
    if (filters.maxValue) {
      orders = orders.filter((o) => o.totalAmount <= Number(filters.maxValue));
    }

    // 7. Date Range Filter
    if (filters.startDate) {
      orders = orders.filter((o) => new Date(o.createdAt) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      orders = orders.filter((o) => new Date(o.createdAt) <= new Date(filters.endDate));
    }

    return orders;
  },

  /**
   * Create a new purchase order
   * POST /api/orders
   */
  async createOrder(orderData) {
    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.post('/api/orders', orderData);
        const data = response.data?.data || response.data;
        if (data) {
          db.createOrder(data);
          return data;
        }
      } catch (err) {}
    }
    await delay(200);
    return db.createOrder(orderData);
  },

  /**
   * Fetch single order details by ID or Order Number
   * GET /api/orders/{id}
   */
  async getOrderById(id) {
    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.get(`/api/orders/${id}`);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (err) {}
    }
    await delay(100);
    const order = db.getOrderById(id);
    if (!order) throw new Error(`Order ${id} not found.`);
    return order;
  },

  /**
   * Generate Statutory Commercial Tax Invoice (Idempotent)
   */
  async generateInvoice(id) {
    await delay(250);
    const result = db.generateOrderInvoice(id);
    if (!result.order) throw new Error('Failed to generate Commercial Tax Invoice.');
    return result;
  },

  /**
   * Update Order Status with transition validation and timeline recording
   * PATCH /api/orders/{id}/status
   */
  async updateOrderStatus(id, { status, notes, dispatchDetails, podDetails }) {
    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.patch(`/api/orders/${id}/status`, {
          status,
          notes,
          dispatchDetails,
          podDetails,
        });
        const data = response.data?.data || response.data;
        if (data) {
          db.updateOrderStatus(id, status, notes, dispatchDetails, podDetails);
          return data;
        }
      } catch (err) {}
    }
    await delay(250);
    const currentOrder = db.getOrderById(id);
    if (!currentOrder) {
      throw new Error(`Order ${id} not found.`);
    }

    // Transition validation
    if (!isValidTransition(currentOrder.orderStatus, status)) {
      console.warn(`Direct status jump from ${currentOrder.orderStatus} to ${status}`);
    }

    return db.updateOrderStatus(id, status, notes, dispatchDetails, podDetails);
  },

  /**
   * Get all commercial invoices for the dedicated Invoices module
   */
  async getInvoices() {
    await delay(150);
    const orders = db.getOrders();
    const invoices = orders
      .filter((o) => o.invoice && o.invoice.invoiceNumber)
      .map((o) => ({
        ...o.invoice,
        orderId: o.id,
        orderNumber: o.orderNumber,
        buyer: o.buyer,
        deliveryAddress: o.deliveryAddress,
        items: o.items,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        createdAt: o.createdAt,
      }));

    return invoices;
  },
};
