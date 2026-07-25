import { describe, it, expect } from 'vitest';
import { receiptSearchQuerySchema } from '../../src/validators/receiptSearch.validator.js';

describe('Receipt Search Query Validator', () => {
  it('applies default pagination and sorting options', () => {
    const parsed = receiptSearchQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(10);
    expect(parsed.sortBy).toBe('newest');
  });

  it('validates search term and category parameters', () => {
    const query = {
      search: 'Amazon',
      category: 'Shopping',
      minAmount: '100',
      maxAmount: '5000',
      sortBy: 'amount_desc',
      page: '2',
      limit: '20',
    };

    const parsed = receiptSearchQuerySchema.parse(query);
    expect(parsed.search).toBe('Amazon');
    expect(parsed.category).toBe('Shopping');
    expect(parsed.minAmount).toBe(100);
    expect(parsed.maxAmount).toBe(5000);
    expect(parsed.sortBy).toBe('amount_desc');
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(20);
  });

  it('rejects invalid sort options', () => {
    expect(() => receiptSearchQuerySchema.parse({ sortBy: 'invalid_sort' })).toThrow();
  });
});
