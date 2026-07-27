import { describe, it, expect } from 'vitest';
import { buildReceiptWhereClause } from '../../src/ai/query/buildWhereClause.js';
import { PERIOD_ENUMS } from '../../src/ai/intent/supportedIntents.js';

describe('Ask Receiptly buildWhereClause Utility', () => {
  it('should build basic where clause with userId', () => {
    const where = buildReceiptWhereClause({ userId: 'user-123' });
    expect(where.userId).toBe('user-123');
  });

  it('should throw error if userId is missing', () => {
    expect(() => buildReceiptWhereClause({})).toThrow('userId is required');
  });

  it('should add merchant normalization OR conditions', () => {
    const where = buildReceiptWhereClause({
      userId: 'user-123',
      filters: { merchant: 'Amazon Seller Services Pvt Ltd' },
    });

    expect(where.userId).toBe('user-123');
    expect(where.OR).toBeDefined();
    expect(where.OR[0].merchantNormalized.contains).toBe('Amazon');
  });

  it('should add category and invoiceNumber filters', () => {
    const where = buildReceiptWhereClause({
      userId: 'user-123',
      filters: { category: 'Food', invoiceNumber: 'INV-999' },
    });

    expect(where.category.equals).toBe('Food');
    expect(where.invoiceNumber.equals).toBe('INV-999');
  });

  it('should add date range filter for period', () => {
    const where = buildReceiptWhereClause({
      userId: 'user-123',
      filters: { period: PERIOD_ENUMS.THIS_MONTH },
    });

    expect(where.purchaseDate.gte).toBeInstanceOf(Date);
    expect(where.purchaseDate.lte).toBeInstanceOf(Date);
  });
});
