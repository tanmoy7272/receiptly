import { z } from 'zod';
import { normalizeTags } from '../utils/tagNormalizer.util.js';

export const receiptTagsSchema = z.preprocess(
  (val) => normalizeTags(val),
  z
    .array(
      z
        .string()
        .min(1, 'Tag cannot be empty.')
        .max(20, 'Tag must be 20 characters or less.')
    )
    .max(5, 'Receipt can have at most 5 tags.')
);
