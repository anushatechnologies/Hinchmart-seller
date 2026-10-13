import { z } from 'zod';

export const pricingTierSchema = z.object({
  minQty: z.coerce.number().min(1, 'Min quantity must be at least 1'),
  maxQty: z.coerce.number().min(1, 'Max quantity must be at least 1'),
  price: z.coerce.number().min(0.1, 'Price must be greater than 0'),
});

export const productBasicSchema = z.object({
  name: z.string().min(3, 'Product name is required (min 3 chars)'),
  sku: z.string().min(3, 'SKU / Product code is required'),
  brand: z.string().min(2, 'Brand is required'),
  category: z.string().min(1, 'Please select a primary category'),
  subcategory: z.string().min(1, 'Please select a subcategory'),
  productType: z.string().optional().or(z.literal('')),
  shortDescription: z.string().min(10, 'Short description is required (min 10 chars)'),
  fullDescription: z.string().min(20, 'Full technical description is required (min 20 chars)'),
});

export const productPricingSchema = z.object({
  mrp: z.coerce.number().min(1, 'MRP must be greater than 0'),
  sellingPrice: z.coerce.number().min(1, 'Selling price must be greater than 0'),
  wholesalePrice: z.coerce.number().optional(),
  dealerPrice: z.coerce.number().optional(),
  moq: z.coerce.number().min(1, 'MOQ must be at least 1'),
  maxOrderQty: z.coerce.number().min(1).optional(),
  unit: z.string().min(1, 'Unit of measurement is required'),
  gstRate: z.coerce.number().min(0).max(28),
  hsnCode: z.string().min(4, 'HSN code is required'),
  pricingTiers: z.array(pricingTierSchema).optional(),
});

export const productInventorySchema = z.object({
  stock: z.coerce.number().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.coerce.number().min(0, 'Threshold cannot be negative'),
  warehouseId: z.string().min(1, 'Please select a warehouse'),
});

export const fullProductSchema = productBasicSchema
  .merge(productPricingSchema)
  .merge(productInventorySchema)
  .extend({
    images: z.array(z.string()).min(1, 'Please upload at least 1 product image'),
    specifications: z.record(z.any()).optional(),
  });
