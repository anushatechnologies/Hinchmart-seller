import { z } from 'zod';

export const quotationItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  name: z.string(),
  sku: z.string(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit: z.string(),
  unitPrice: z.coerce.number().min(1, 'Price must be greater than 0'),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  gstRate: z.coerce.number().min(0).max(28).default(18),
});

export const quotationSchema = z.object({
  buyer: z.object({
    name: z.string().min(2, 'Buyer name is required'),
    company: z.string().min(2, 'Company name is required'),
    phone: z.string().min(10, 'Contact phone is required'),
    email: z.string().email('Valid email is required'),
    gstin: z.string().optional().or(z.literal('')),
    address: z.string().min(5, 'Delivery site address is required'),
  }),
  items: z.array(quotationItemSchema).min(1, 'At least 1 item is required in quotation'),
  freightCharges: z.coerce.number().min(0).default(0),
  validUntil: z.string().min(1, 'Validity date is required'),
  paymentTerms: z.string().min(5, 'Payment terms required'),
  deliveryTerms: z.string().min(5, 'Delivery terms required'),
  enquiryId: z.string().optional().nullable(),
});

export const warehouseSchema = z.object({
  name: z.string().min(3, 'Warehouse name is required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  phone: z.string().min(10, 'Contact phone is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code required'),
  address: z.string().min(10, 'Full address is required'),
  capacityTons: z.coerce.number().min(1, 'Capacity is required'),
  isDefault: z.boolean().default(false),
});

