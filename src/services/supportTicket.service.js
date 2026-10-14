import { apiClient, USE_MOCK_API } from './apiClient.js';
import { db } from '../mock/db.js';

export const SUPPORT_CATEGORIES = [
  { value: 'PAYOUT', label: 'Payout & Settlements', description: 'Delays, deductions, bank account issues' },
  { value: 'COMMISSION', label: 'Commission & Fees', description: 'Rate discrepancies, incorrect fee deductions' },
  { value: 'INVENTORY', label: 'Inventory & Catalog', description: 'Stock sync, SKU mapping, listing errors' },
  { value: 'ORDER_DISPUTE', label: 'Order & Customer Disputes', description: 'Cancellation disputes, delivery proof' },
  { value: 'ONBOARDING', label: 'Onboarding & KYC', description: 'GST verification, document re-upload' },
  { value: 'TECHNICAL', label: 'Technical & Platform Bug', description: 'Portal glitch, API error, login issue' },
  { value: 'GENERAL', label: 'General Enquiry', description: 'Policies, partnership, and other questions' },
];

export const SUPPORT_PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-slate-600 bg-slate-100 border-slate-200' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'HIGH', label: 'High', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { value: 'URGENT', label: 'Urgent', color: 'text-rose-700 bg-rose-50 border-rose-200' },
];

export const SUPPORT_STATUSES = [
  { value: 'OPEN', label: 'Open', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'RESOLVED', label: 'Resolved', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'CLOSED', label: 'Closed', color: 'text-slate-600 bg-slate-100 border-slate-200' },
];

export const supportTicketService = {
  /**
   * 2.1 GET /api/seller/help/tickets
   * List tickets for authenticated seller with optional status filter & pagination
   */
  async getTickets(filters = {}) {
    const { status, page = 1, limit = 20 } = filters;
    const params = { page, limit };
    if (status && status !== 'ALL' && status !== 'All') {
      params.status = status.toUpperCase();
    }

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.get('/api/seller/help/tickets', { params, timeout: 8000 });
        const resData = response.data;
        const rawList = resData?.data || (Array.isArray(resData) ? resData : []);
        const pagination = resData?.pagination || {
          page: Number(page) || 1,
          limit: Number(limit) || 20,
          total: Array.isArray(rawList) ? rawList.length : 0,
          totalPages: 1,
        };

        if (Array.isArray(rawList)) {
          // Sync live tickets to local store for offline cache
          const cleanSellerId = db.getCleanSellerId();
          db.setSupportTickets(cleanSellerId, rawList);
          return {
            tickets: rawList,
            pagination,
          };
        }
      } catch (err) {
        console.warn('Live support tickets fetch notice (fallback to local cache):', err?.response?.data || err.message);
      }
    }

    // Local / Offline fallback
    const cleanSellerId = db.getCleanSellerId();
    let localTickets = db.getSupportTickets(cleanSellerId) || [];

    if (params.status) {
      localTickets = localTickets.filter(
        (t) => String(t.status || '').toUpperCase() === params.status
      );
    }

    const total = localTickets.length;
    const start = (page - 1) * limit;
    const paged = localTickets.slice(start, start + limit);

    return {
      tickets: paged,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * 2.2 POST /api/seller/help/tickets
   * Create a new support ticket
   */
  async createTicket(payload) {
    const body = {
      subject: payload.subject?.trim(),
      category: payload.category || 'GENERAL',
      priority: payload.priority || 'MEDIUM',
      message: payload.message?.trim(),
    };

    if (payload.orderId) {
      const numOrder = Number(payload.orderId);
      if (!isNaN(numOrder) && numOrder > 0) {
        body.orderId = numOrder;
      }
    }

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.post('/api/seller/help/tickets', body, { timeout: 10000 });
        const createdTicket = response.data?.data || response.data;
        if (createdTicket && (createdTicket.ticketId || createdTicket.id)) {
          // Mirror in local db
          db.createSupportTicket(createdTicket);
          return createdTicket;
        }
      } catch (err) {
        console.warn('Backend ticket creation error, storing locally:', err?.response?.data || err.message);
        const errMsg = err?.response?.data?.message || err.message;
        // If 400 validation error from backend, rethrow so UI can highlight
        if (err?.response?.status === 400) {
          throw new Error(errMsg || 'Failed to create support ticket');
        }
      }
    }

    // Fallback local creation
    return db.createSupportTicket(body);
  },

  /**
   * 2.3 GET /api/seller/help/tickets/{id}
   * Get ticket details by ID with messages thread
   */
  async getTicketById(ticketId) {
    if (!ticketId) return null;
    const cleanId = String(ticketId).trim();

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.get(`/api/seller/help/tickets/${cleanId}`, { timeout: 8000 });
        const ticketData = response.data?.data || response.data;
        if (ticketData && (ticketData.ticketId || ticketData.id)) {
          return ticketData;
        }
      } catch (err) {
        console.warn(`GET /api/seller/help/tickets/${cleanId} error (using cache):`, err?.response?.data || err.message);
        if (err?.response?.status === 403) {
          throw new Error('Access Denied: This ticket does not belong to your seller account.');
        }
        if (err?.response?.status === 404) {
          throw new Error(`Support ticket not found with id: ${cleanId}`);
        }
      }
    }

    return db.getSupportTicketById(cleanId);
  },

  /**
   * 2.4 POST /api/seller/help/tickets/{id}/messages
   * Add a message / reply to a ticket
   */
  async addMessage(ticketId, payload) {
    if (!ticketId) throw new Error('Ticket ID is required');

    const body = {
      content: payload.content?.trim(),
      attachmentUrl: payload.attachmentUrl?.trim() || null,
    };

    if (!body.content) {
      throw new Error('Message content is required');
    }

    if (!USE_MOCK_API) {
      try {
        const response = await apiClient.post(`/api/seller/help/tickets/${ticketId}/messages`, body, { timeout: 10000 });
        const newMessage = response.data?.data || response.data;
        if (newMessage) {
          db.addSupportTicketMessage(ticketId, newMessage);
          return newMessage;
        }
      } catch (err) {
        console.warn('Backend message reply error, appending locally:', err?.response?.data || err.message);
        if (err?.response?.status === 400 || err?.response?.status === 403) {
          throw new Error(err?.response?.data?.message || 'Failed to send message');
        }
      }
    }

    return db.addSupportTicketMessage(ticketId, body);
  },
};
