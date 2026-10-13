import { apiClient, delay } from './api';
import { db } from '../mock/db';

export const labelService = {
  // GET /labels/history
  async getLabelHistory(params = {}) {
    await delay(120);
    const history = db.getLabelHistory(params);
    return {
      data: history,
      total: history.length,
    };
  },

  // GET /labels/:id
  async getLabelById(id) {
    await delay(80);
    const label = db.getLabelById(id);
    if (!label) throw new Error(`Label record ${id} not found`);
    return label;
  },

  // POST /labels/generate
  async createLabel(labelData) {
    await delay(150);
    return db.createLabel(labelData);
  },

  // PATCH /labels/:id/status
  async updateLabelStatus(id, status = 'Printed') {
    await delay(100);
    return db.updateLabelStatus(id, status);
  },

  // DELETE /labels/:id
  async deleteLabel(id) {
    await delay(100);
    return db.deleteLabel(id);
  },

  // POST /labels/bulk-delete
  async deleteMultipleLabels(ids = []) {
    await delay(150);
    return db.deleteMultipleLabels(ids);
  },
};
