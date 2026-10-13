import { db } from '../mock/db';
import { delay } from './api';

export const notificationService = {
  async getNotifications() {
    await delay(150);
    return db.getNotifications();
  },

  async markAsRead(id) {
    await delay(100);
    return db.markNotificationRead(id);
  },

  async markAllAsRead() {
    await delay(150);
    return db.markAllNotificationsRead();
  }
};
