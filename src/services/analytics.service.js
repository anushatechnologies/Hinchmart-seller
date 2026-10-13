import { db } from '../mock/db';
import { delay } from './api';

export const analyticsService = {
  async getAnalyticsData(params = '30d') {
    await delay(150);
    const timeRange = typeof params === 'string' ? params : params.timeRange || '30d';
    const startDate = typeof params === 'object' ? params.startDate : null;
    const endDate = typeof params === 'object' ? params.endDate : null;

    const data = db.getAnalytics();
    const orders = db.getOrders();
    const products = db.getProducts();
    const enquiries = db.getEnquiries();

    // Dynamically calculate KPIs
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = orders.filter(o => o.orderStatus === 'New' || o.orderStatus === 'Processing').length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    // Time-range specific trend data derived from real orders
    let revenueOverview = [];
    if (orders.length > 0) {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        const steps = Math.min(8, Math.max(4, diffDays));
        const stepDays = Math.max(1, Math.floor(diffDays / steps));

        revenueOverview = Array.from({ length: steps }).map((_, idx) => {
          const d = new Date(start.getTime() + idx * stepDays * 24 * 60 * 60 * 1000);
          const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          const matchingOrders = orders.filter((o) => {
            const od = new Date(o.createdAt);
            return od <= d;
          });
          const rev = matchingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          return {
            label,
            revenue: rev,
            orders: matchingOrders.length,
            enquiries: enquiries.length,
          };
        });
      } else {
        revenueOverview = [
          { label: 'Current', revenue: totalRevenue, orders: orders.length, enquiries: enquiries.length },
        ];
      }
    }

    return {
      ...data,
      revenueOverview,
      kpis: {
        totalRevenue: totalRevenue || 0,
        totalOrders: orders.length || 0,
        pendingOrders: pendingOrders || 0,
        totalProducts: products.length || 0,
        activeProducts: products.filter(p => p.status === 'Active' || p.active).length || 0,
        lowStockCount,
        outOfStockCount,
        totalEnquiries: enquiries.length || 0,
        newEnquiries: enquiries.filter(e => e.status === 'New').length || 0,
        conversionRate: enquiries.length > 0 ? Number(((orders.length / enquiries.length) * 100).toFixed(1)) : 0,
        averageOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      }
    };
  }
};
