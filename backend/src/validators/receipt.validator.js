import { z } from 'zod';
import { RECEIPT_CATEGORIES } from '../constants/receipts.js';

export const createReceiptSchema = z.object({
  title: z
    .string({ required_error: 'Receipt title is required' })
    .trim()
    .min(1, 'Title cannot be empty'),
  merchant: z
    .string({ required_error: 'Merchant name is required' })
    .trim()
    .min(1, 'Merchant name cannot be empty'),
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number({ required_error: 'Amount is required' }).positive('Amount must be greater than 0')
  ),
  currency: z
    .string()
    .trim()
    .default('INR'),
  purchaseDate: z
    .string({ required_error: 'Purchase date is required' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid purchase date' }),
  category: z.enum(RECEIPT_CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${RECEIPT_CATEGORIES.join(', ')}` }),
  }),
  notes: z.string().trim().optional().nullable(),
  // Phase A Fields
  invoiceNumber: z.string().trim().optional().nullable(),
  merchantProvenance: z.string().trim().optional().default('MANUAL'),
  amountProvenance: z.string().trim().optional().default('MANUAL'),
  hasWarranty: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(false)
  ),
  warrantyExpiryDate: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid warranty expiry date' }).optional().nullable()
  ),
  warrantyMonths: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== '' ? parseInt(val, 10) : undefined),
    z.number().int().nonnegative().optional().nullable()
  ),
  warrantySource: z.string().trim().optional().default('NONE'),
});

export const updateReceiptSchema = createReceiptSchema.partial();
