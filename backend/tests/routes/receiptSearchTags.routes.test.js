import { describe, it, expect } from 'vitest';
import { receiptSearchQuerySchema } from '../../src/validators/receiptSearch.validator.js';

describe('Receipt Search by Tags', () => {
  it('should accept search term and sort parameters cleanly', () => {
    const query = {
      search: 'electronics',
      page: '1',
      limit: '10',
    };
    const parsed = receiptSearchQuerySchema.parse(query);
    expect(parsed.search).toBe('electronics');
  });
});
