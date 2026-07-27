/**
 * ============================================================================
 * Ask Receiptly Validator Schemas
 * ============================================================================
 * Purpose: Validates Ask Receiptly intent result envelopes using Zod.
 * ============================================================================
 */
import { z } from 'zod';
import { SUPPORTED_INTENTS, PERIOD_ENUMS, CONFIDENCE_ENUMS } from '../ai/intent/supportedIntents.js';

export const askReceiptlyFiltersSchema = z.object({
  merchant: z.string().trim().optional(),
  merchants: z.array(z.string()).optional(),
  category: z.string().trim().optional(),
  categories: z.array(z.string()).optional(),
  period: z.string().trim().optional(),
  invoiceNumber: z.string().trim().optional(),
  query: z.string().trim().optional(),
  limit: z.number().positive().optional(),
  year: z.number().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
});

export const askReceiptlyResultSchema = z.discriminatedUnion('supported', [
  z.object({
    supported: z.literal(true),
    intent: z.nativeEnum(SUPPORTED_INTENTS),
    filters: askReceiptlyFiltersSchema.default({}),
    confidence: z.nativeEnum(CONFIDENCE_ENUMS),
    needsClarification: z.boolean().optional(),
  }),
  z.object({
    supported: z.literal(false),
    reason: z.string().default('unsupported_question'),
  }),
]);
