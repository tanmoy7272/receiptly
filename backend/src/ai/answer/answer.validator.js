/**
 * ============================================================================
 * Ask Receiptly Answer Validator
 * ============================================================================
 * Purpose: Validates generated LLM responses using Zod rules to enforce clean text,
 *          max 400 character length, and rejection of raw markdown or JSON leakage.
 * ============================================================================
 */
import { z } from 'zod';

export const askReceiptlyAnswerSchema = z.object({
  answer: z
    .string({ required_error: 'Answer string is required' })
    .trim()
    .min(1, 'Answer cannot be empty')
    .max(400, 'Answer must be 400 characters or fewer')
    .refine((val) => !/^```/i.test(val), {
      message: 'Answer must not contain markdown code blocks',
    })
    .refine((val) => !/^answer:\s*/i.test(val), {
      message: 'Answer must not contain redundant label prepends',
    })
    .refine((val) => !/^(based on|according to)\s+/i.test(val), {
      message: 'Answer must not contain robotic data source intros',
    })
    .refine((val) => !/^[*\-#]\s+/m.test(val), {
      message: 'Answer must not contain markdown bullet points or headers',
    }),
});
