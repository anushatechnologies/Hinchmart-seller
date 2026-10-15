import { apiClient, delay, canAccessSellerApi } from './apiClient.js';
import { db } from '../mock/db.js';
import { sellerProductService } from './sellerProduct.service.js';

export const inventoryService = {
  async getInventory(filters = {}) {
    let products = [];
    try {
      products = await sellerProductService.getSellerProducts();
    } catch (err) {
      products = null;
    }
    if (!Array.isArray(products)) {
      products = db.getSellerProducts();
    }

    const warehouses = await this.getWarehouses();

    let list = (Array.isArray(products) ? products : []).map((p) => {
      const wh = warehouses.find(
        (w) => String(w.id) === String(p.warehouseId) || String(w.warehouseId) === String(p.warehouseId)
      ) || warehouses[0];
      const stock = Number(p.stock ?? p.stockQty ?? 0);
      const lowStockThreshold = Number(p.lowStockThreshold ?? 10);
      const isLowStock = stock > 0 && stock <= lowStockThreshold;
      const isOutOfStock = stock === 0;
      const price = Number(p.sellingPrice ?? p.price ?? 0);

      return {
        id: p.id,
        productId: p.productId || p.id,
        name: p.title || p.name || 'Untitled Product',
        title: p.title || p.name || 'Untitled Product',
        sku: p.sku || 'N/A',
        category: p.category || p.categoryName || '',
        brand: p.brand || p.brandName || '',
        unit: p.unit || 'PIECE',
        availableStock: stock,
        stock: stock,
        reservedStock: Number(p.reservedStock || 0),
        lowStockThreshold,
        price,
        sellingPrice: price,
        mrp: Number(p.mrp || price),
        warehouseName: wh ? wh.name : 'Central Logistics Yard',
        warehouseId: p.warehouseId || wh?.id || 'wh_1',
        isLowStock,
        isOutOfStock,
        status: isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock',
        updatedAt: p.updatedAt,
      };
    });

    if (filters.warehouseId && filters.warehouseId !== 'All') {
      list = list.filter((item) => String(item.warehouseId) === String(filters.warehouseId));
    }

    if (filters.status && filters.status !== 'All') {
      list = list.filter((item) => (item.status || '').toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (item) =>
          (item.name || '').toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.warehouseName && item.warehouseName.toLowerCase().includes(q))
      );
    }

    return list;
  },

  async getStockAlerts() {
    await delay(100);
    const inventory = await this.getInventory();
    const lowStock = inventory.filter((p) => p.isLowStock && p.availableStock > 0);
    const outOfStock = inventory.filter((p) => p.isOutOfStock || p.availableStock === 0);

    return {
      totalAlerts: lowStock.length + outOfStock.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
    };
  },

  async updateStock(productId, adjustment) {
    await delay(150);

    const currentProd = db.findProductById(productId) || db.getSellerProductById(null, productId);
    const oldStock = currentProd ? Number(currentProd.stock ?? currentProd.stockQty ?? 0) : 0;

    let newStock;
    let reason = 'Manual Stock Adjustment';
    let qty = 0;
    let normType = 'RESTOCK';

    if (typeof adjustment === 'object' && adjustment !== null) {
      reason = adjustment.reason || reason;
      const adjustQty = Number(adjustment.quantity) || 0;
      if (adjustment.adjustmentType === 'add') {
        newStock = oldStock + adjustQty;
        qty = adjustQty;
        normType = 'RESTOCK';
      } else if (adjustment.adjustmentType === 'subtract') {
        newStock = Math.max(0, oldStock - adjustQty);
        qty = adjustQty;
        normType = 'DAMAGED';
      } else if (adjustment.adjustmentType === 'set') {
        newStock = Math.max(0, adjustQty);
        qty = Math.abs(newStock - oldStock);
        normType = newStock >= oldStock ? 'RESTOCK' : 'DAMAGED';
      } else {
        newStock = Number(adjustment.newStock ?? adjustment.stock ?? adjustQty);
        qty = Math.abs(newStock - oldStock);
        normType = newStock >= oldStock ? 'RESTOCK' : 'DAMAGED';
      }
    } else {
      newStock = parseInt(adjustment, 10);
      qty = Math.abs(newStock - oldStock);
      normType = newStock >= oldStock ? 'RESTOCK' : 'DAMAGED';
    }

    if (isNaN(newStock) || newStock < 0) {
      throw new Error('Stock quantity must be a non-negative number');
    }

    const adjustType = adjustment?.adjustmentType === 'add'
      ? 'add'
      : adjustment?.adjustmentType === 'subtract'
      ? 'subtract'
      : 'replace';

    // 1. Direct stock update: PATCH /api/seller/products/{id}/stock
    try {
      await apiClient.patch(`/api/seller/products/${productId}/stock`, { stockQty: newStock });
    } catch (_) {}

    // 2. Inventory adjust ledger: POST /api/seller/inventory/adjust
    if (canAccessSellerApi('/api/seller/inventory/adjust')) {
      try {
        await apiClient.post('/api/seller/inventory/adjust', {
          productId: Number(productId) || productId,
          quantity: qty,
          type: adjustType,
          warehouseId: adjustment?.warehouseId || undefined,
        });
      } catch (apiErr) {
        // Fallback gracefully
      }
    }

    db.updateSellerStock(null, productId, newStock);

    const updated = db.findProductById(productId) || db.getSellerProductById(null, productId);

    return {
      id: productId,
      productId,
      name: updated?.title || updated?.name || currentProd?.title || currentProd?.name || 'Product',
      stock: newStock,
      unit: updated?.unit || currentProd?.unit || 'PIECE',
      quantity: qty,
      adjustmentType: normType,
      reason,
    };
  },

  async adjustStock(productId, newStock, reason = 'Inventory Count') {
    return this.updateStock(productId, { adjustmentType: 'set', quantity: newStock, reason });
  },

  /**
   * 3.1 GET /api/seller/warehouses
   */
  async getWarehouses() {
    if (canAccessSellerApi('/api/seller/warehouses')) {
      try {
        const response = await apiClient.get('/api/seller/warehouses');
        const rawList = response.data?.data || response.data;
        if (Array.isArray(rawList)) {
          return rawList.map(w => ({
            ...w,
            id: w.id || `wh_${w.warehouseId || 1}`,
            warehouseId: w.warehouseId ?? w.id,
          }));
        }
      } catch (apiErr) {
        // Fallback gracefully
      }
    }

    await delay(50);
    return db.getWarehouses();
  },

  /**
   * 3.2 POST /api/seller/warehouses
   */
  async createWarehouse(whData) {
    if (canAccessSellerApi('/api/seller/warehouses')) {
      try {
        const response = await apiClient.post('/api/seller/warehouses', whData);
        const data = response.data?.data || response.data;
        if (data) return data;
      } catch (apiErr) {
        // Fallback gracefully
      }
    }

    await delay(100);
    return db.createWarehouse(whData);
  },

  async updateWarehouse(id, updates) {
    await delay(150);
    return db.updateWarehouse(id, updates);
  },

  async deleteWarehouse(id) {
    await delay(150);
    return db.deleteWarehouse(id);
  }
};
