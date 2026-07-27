import { z } from 'zod';

export const checkDuplicateInputSchema = z.object({
  title: z.string().trim().optional(),
  merchant: z.string({ required_error: 'Merchant name is required' }).trim().min(1),
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number({ required_error: 'Amount is required' }).positive('Amount must be positive')
  ),
  purchaseDate: z
    .string({ required_error: 'Purchase date is required' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid purchase date' }),
  category: z.string().optional(),
  invoiceNumber: z.string().trim().optional().nullable(),
});

export const duplicateCheckResponseSchema = z.object({
  isDuplicate: z.boolean(),
  confidence: z.enum(['low', 'medium', 'high']),
  reason: z.enum(['invoice_match', 'metadata_match', 'ai_similarity', 'none']),
  candidate: z
    .object({
      id: z.string(),
      title: z.string(),
      merchant: z.string(),
      amount: z.number(),
      purchaseDate: z.union([z.string(), z.date()]),
      category: z.string().optional(),
      invoiceNumber: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const aiDuplicateResultSchema = z.object({
  duplicate: z.boolean().default(false),
  confidence: z.enum(['low', 'medium', 'high']).default('low'),
});
