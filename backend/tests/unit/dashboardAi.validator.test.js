import { describe, it, expect } from 'vitest';
import { dashboardAiSummarySchema } from '../../src/validators/dashboardAi.validator.js';

describe('dashboardAiSummarySchema Validator', () => {
  it('should validate valid summary array with 1 to 3 items', () => {
    const input = {
      summary: [
        'Food remains your top spending category.',
        'Spending increased by 12% compared to last month.',
        'You have 2 active warranties.',
      ],
    };
    const parsed = dashboardAiSummarySchema.parse(input);
    expect(parsed.summary).toHaveLength(3);
  });

  it('should trim whitespace from summary items', () => {
    const input = {
      summary: ['  Food remains your top category.  '],
    };
    const parsed = dashboardAiSummarySchema.parse(input);
    expect(parsed.summary[0]).toBe('Food remains your top category.');
  });

  it('should reject empty summary array', () => {
    const input = { summary: [] };
    expect(() => dashboardAiSummarySchema.parse(input)).toThrow();
  });

  it('should reject summary array exceeding 3 items', () => {
    const input = {
      summary: ['Point 1', 'Point 2', 'Point 3', 'Point 4'],
    };
    expect(() => dashboardAiSummarySchema.parse(input)).toThrow();
  });

  it('should reject summary items exceeding 100 characters', () => {
    const input = {
      summary: ['A'.repeat(101)],
    };
    expect(() => dashboardAiSummarySchema.parse(input)).toThrow();
  });

  it('should reject blank or empty string items', () => {
    const input = {
      summary: ['   '],
    };
    expect(() => dashboardAiSummarySchema.parse(input)).toThrow();
  });

  it('should reject duplicate summary items (case-insensitive)', () => {
    const input = {
      summary: ['Food spending increased.', 'food spending increased.'],
    };
    expect(() => dashboardAiSummarySchema.parse(input)).toThrow();
  });

  it('should reject non-JSON or extra unexpected fields', () => {
    const input = {
      summary: ['Valid summary bullet'],
      extraField: 'hallucinated data',
    };
    expect(() => dashboardAiSummarySchema.parse(input)).toThrow();
  });
});
