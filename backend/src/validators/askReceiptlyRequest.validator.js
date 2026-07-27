/**
 * ============================================================================
 * Ask Receiptly Request Validator
 * ============================================================================
 * Purpose: Validates incoming POST /api/v1/ask request payloads using Zod.
 * ============================================================================
 */
import { z } from 'zod';

export const askReceiptlyRequestSchema = z.object({
  question: z
    .string({ required_error: 'Question is required' })
    .trim()
    .min(1, 'Question cannot be empty')
    .max(300, 'Question must be 300 characters or fewer'),
});
