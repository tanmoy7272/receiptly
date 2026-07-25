import { z } from 'zod';
import { RECEIPT_CATEGORIES } from '../constants/receipts.js';

export const receiptSearchQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z
    .enum(RECEIPT_CATEGORIES)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  currency: z.string().trim().optional(),
  fromDate: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid fromDate' })
  ),
  toDate: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid toDate' })
  ),
  minAmount: z.preprocess(
    (val) => (val !== undefined && val !== '' ? parseFloat(val) : undefined),
    z.number().nonnegative().optional()
  ),
  maxAmount: z.preprocess(
    (val) => (val !== undefined && val !== '' ? parseFloat(val) : undefined),
    z.number().nonnegative().optional()
  ),
  sortBy: z
    .enum(['newest', 'oldest', 'amount_desc', 'amount_asc', 'merchant_asc', 'merchant_desc'])
    .optional()
    .default('newest'),
  page: z.preprocess(
    (val) => (val !== undefined && val !== '' ? parseInt(val, 10) : 1),
    z.number().min(1).default(1)
  ),
  limit: z.preprocess(
    (val) => (val !== undefined && val !== '' ? parseInt(val, 10) : 10),
    z.number().min(1).max(100).default(10)
  ),
});
