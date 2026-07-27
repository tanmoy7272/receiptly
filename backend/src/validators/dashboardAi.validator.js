import { z } from 'zod';

export const dashboardAiSummarySchema = z
  .object({
    summary: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Summary bullet cannot be empty.')
          .max(100, 'Summary bullet must be 100 characters or less.')
      )
      .min(1, 'Summary must contain at least 1 item.')
      .max(3, 'Summary can have at most 3 items.')
      .refine(
        (items) => {
          const lowerItems = items.map((item) => item.toLowerCase());
          return new Set(lowerItems).size === lowerItems.length;
        },
        { message: 'Summary bullets must be unique.' }
      ),
  })
  .strict();
