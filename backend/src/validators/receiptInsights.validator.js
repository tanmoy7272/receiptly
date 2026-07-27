import { z } from 'zod';

export const receiptInsightsSchema = z
  .object({
    insights: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Insight bullet cannot be empty.')
          .max(100, 'Insight bullet must be 100 characters or less.')
      )
      .max(3, 'Insights can have at most 3 items.')
      .refine(
        (items) => {
          const lowerItems = items.map((item) => item.toLowerCase());
          return new Set(lowerItems).size === lowerItems.length;
        },
        { message: 'Insight bullets must be unique.' }
      ),
  })
  .strict();
