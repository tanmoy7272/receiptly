/**
 * ============================================================================
 * Ask Receiptly Result Schemas
 * ============================================================================
 * Purpose: Defines Zod schemas validating output payload shapes returned by handlers.
 * ============================================================================
 */
import { z } from 'zod';
import { SUPPORTED_INTENTS } from '../intent/supportedIntents.js';

export const receiptDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  merchant: z.string(),
  merchantNormalized: z.string().nullable().optional(),
  amount: z.number(),
  currency: z.string().default('INR'),
  category: z.string(),
  purchaseDate: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  hasWarranty: z.boolean().optional(),
  warrantyExpiryDate: z.string().nullable().optional(),
});

export const queryEnvelopeSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    supported: z.boolean(),
    intent: z.nativeEnum(SUPPORTED_INTENTS).optional(),
    data: z.record(z.any()).optional(),
    metadata: z
      .object({
        intent: z.string(),
        period: z.string(),
        filters: z.record(z.any()),
        timestamp: z.string(),
      })
      .optional(),
    reason: z.string().optional(),
    suggestions: z.array(z.string()).optional(),
  }),
  z.object({
    success: z.literal(false),
    supported: z.boolean().optional(),
    intent: z.string().optional(),
    reason: z.string(),
    details: z.any().optional(),
  }),
]);
