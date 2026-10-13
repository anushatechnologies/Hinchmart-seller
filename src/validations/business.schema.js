import { z } from 'zod';

export const businessDetailsSchema = z.object({
  companyName: z.string().min(3, 'Company name is required'),
  businessType: z.string().min(1, 'Please select a business type'),
  establishedYear: z.coerce.number().min(1950).max(2026),
  employees: z.string().min(1, 'Please select company size'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  companyEmail: z.string().email('Please enter a valid company email'),
  businessPhone: z.string().min(8, 'Please enter a valid phone number'),
  description: z.string().min(20, 'Please provide a brief company description (min 20 characters)'),
});

export const businessAddressSchema = z.object({
  country: z.string().default('India'),
  state: z.string().min(1, 'Please select state'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  area: z.string().min(1, 'Area / Locality is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Please enter a valid 6-digit Indian PIN code'),
  completeAddress: z.string().min(10, 'Please provide full building and street address'),
});

export const legalDetailsSchema = z.object({
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid 15-character GSTIN'),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid 10-character PAN'),
  cin: z.string().optional().or(z.literal('')),
  tradeLicense: z.string().optional().or(z.literal('')),
  msme: z.string().optional().or(z.literal('')),
});
