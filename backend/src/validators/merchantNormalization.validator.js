import { z } from 'zod';
import { normalizeMerchantName } from '../utils/merchantNormalizer.util.js';

export const merchantNormalizationSchema = z.object({
  merchantNormalized: z.preprocess(
    (val) => (typeof val === 'string' ? normalizeMerchantName(val) : 'Unknown Store'),
    z
      .string({ required_error: 'Normalized merchant name is required' })
      .trim()
      .min(1, 'Merchant name cannot be empty')
      .max(40, 'Normalized merchant name must be 40 characters or less')
  ),
});
