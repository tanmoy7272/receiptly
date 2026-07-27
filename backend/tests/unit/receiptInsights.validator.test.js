import { describe, it, expect } from 'vitest';
import { receiptInsightsSchema } from '../../src/validators/receiptInsights.validator.js';

describe('receiptInsightsSchema Validator', () => {
  it('should validate valid insights array with 1 to 3 items', () => {
    const input = {
      insights: [
        'Electronics purchase with an active manufacturer warranty.',
        'Invoice number is stored for future claims.',
      ],
    };
    const parsed = receiptInsightsSchema.parse(input);
    expect(parsed.insights).toHaveLength(2);
  });

  it('should allow empty insights array when no observations exist', () => {
    const input = { insights: [] };
    const parsed = receiptInsightsSchema.parse(input);
    expect(parsed.insights).toEqual([]);
  });

  it('should trim whitespace from insight items', () => {
    const input = {
      insights: ['  Electronics purchase with warranty.  '],
    };
    const parsed = receiptInsightsSchema.parse(input);
    expect(parsed.insights[0]).toBe('Electronics purchase with warranty.');
  });

  it('should reject insights array exceeding 3 items', () => {
    const input = {
      insights: ['Bullet 1', 'Bullet 2', 'Bullet 3', 'Bullet 4'],
    };
    expect(() => receiptInsightsSchema.parse(input)).toThrow();
  });

  it('should reject insight items exceeding 100 characters', () => {
    const input = {
      insights: ['X'.repeat(101)],
    };
    expect(() => receiptInsightsSchema.parse(input)).toThrow();
  });

  it('should reject blank or whitespace-only items', () => {
    const input = {
      insights: ['   '],
    };
    expect(() => receiptInsightsSchema.parse(input)).toThrow();
  });

  it('should reject duplicate insight items (case-insensitive)', () => {
    const input = {
      insights: ['Electronics purchase with warranty.', 'electronics purchase with warranty.'],
    };
    expect(() => receiptInsightsSchema.parse(input)).toThrow();
  });

  it('should reject unexpected extra fields', () => {
    const input = {
      insights: ['Valid observation'],
      unexpectedField: 'hallucinated value',
    };
    expect(() => receiptInsightsSchema.parse(input)).toThrow();
  });
});
