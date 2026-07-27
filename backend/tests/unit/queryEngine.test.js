import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeIntent } from '../../src/ai/query/queryEngine.js';
import { SUPPORTED_INTENTS, PERIOD_ENUMS } from '../../src/ai/intent/supportedIntents.js';
import prisma from '../../src/lib/prisma.js';

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    receipt: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

describe('Ask Receiptly Query Engine (Prompt 2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return unsupported result for UNKNOWN intent', async () => {
    const res = await executeIntent({
      userId: 'test-user',
      intent: SUPPORTED_INTENTS.UNKNOWN,
    });

    expect(res.success).toBe(true);
    expect(res.supported).toBe(false);
    expect(res.reason).toBe('unsupported_receipt_question');
  });

  it('should return unauthorized failure if userId is missing', async () => {
    const res = await executeIntent({
      userId: null,
      intent: SUPPORTED_INTENTS.TOTAL_SPENDING,
    });

    expect(res.success).toBe(false);
    expect(res.reason).toBe('unauthorized_user_id');
  });

  it('should execute TOTAL_SPENDING query and compute sums', async () => {
    prisma.receipt.findMany.mockResolvedValue([
      { amount: 150.5, currency: 'INR' },
      { amount: 249.5, currency: 'INR' },
    ]);

    const res = await executeIntent({
      userId: 'test-user',
      intent: SUPPORTED_INTENTS.TOTAL_SPENDING,
      filters: { period: PERIOD_ENUMS.THIS_MONTH },
    });

    expect(res.success).toBe(true);
    expect(res.data.totalSpent).toBe(400);
    expect(res.data.receiptCount).toBe(2);
    expect(res.data.currency).toBe('INR');
    expect(res.metadata.intent).toBe(SUPPORTED_INTENTS.TOTAL_SPENDING);
  });

  it('should handle mixed currencies correctly', async () => {
    prisma.receipt.findMany.mockResolvedValue([
      { amount: 100, currency: 'INR' },
      { amount: 50, currency: 'USD' },
    ]);

    const res = await executeIntent({
      userId: 'test-user',
      intent: SUPPORTED_INTENTS.TOTAL_BY_MERCHANT,
      filters: { merchant: 'Amazon' },
    });

    expect(res.success).toBe(true);
    expect(res.data.currency).toBe('MIXED');
    expect(res.data.mixedCurrency).toBe(true);
  });

  it('should return zero total spent when database has no matching receipts', async () => {
    prisma.receipt.findMany.mockResolvedValue([]);

    const res = await executeIntent({
      userId: 'test-user',
      intent: SUPPORTED_INTENTS.TOTAL_SPENDING,
    });

    expect(res.success).toBe(true);
    expect(res.data.totalSpent).toBe(0);
    expect(res.data.receiptCount).toBe(0);
  });

  it('should execute RECENT_PURCHASES query with default limit take: 10', async () => {
    prisma.receipt.findMany.mockResolvedValue([
      {
        id: 'rec-1',
        title: 'Dinner',
        merchant: 'Swiggy',
        merchantNormalized: 'Swiggy',
        amount: 250,
        currency: 'INR',
        category: 'Food',
        purchaseDate: new Date('2026-05-20'),
        invoiceNumber: 'INV-111',
      },
    ]);

    const res = await executeIntent({
      userId: 'test-user',
      intent: SUPPORTED_INTENTS.RECENT_PURCHASES,
      filters: {},
    });

    expect(res.success).toBe(true);
    expect(res.data.count).toBe(1);
    expect(res.data.receipts[0].title).toBe('Dinner');
  });

  it('should execute SEARCH_INVOICE query', async () => {
    prisma.receipt.findFirst.mockResolvedValue({
      id: 'rec-99',
      title: 'Headphones',
      merchant: 'Sony',
      amount: 4999,
      currency: 'INR',
      category: 'Electronics',
      invoiceNumber: 'INV-99',
    });

    const res = await executeIntent({
      userId: 'test-user',
      intent: SUPPORTED_INTENTS.SEARCH_INVOICE,
      filters: { invoiceNumber: 'INV-99' },
    });

    expect(res.success).toBe(true);
    expect(res.data.found).toBe(true);
    expect(res.data.receipt.invoiceNumber).toBe('INV-99');
  });

  it('should handle query execution failure gracefully', async () => {
    prisma.receipt.findMany.mockRejectedValue(new Error('Prisma database connection error'));

    const res = await executeIntent({
      userId: 'test-user',
      intent: SUPPORTED_INTENTS.TOTAL_SPENDING,
    });

    expect(res.success).toBe(false);
    expect(res.reason).toBe('query_failed');
  });
});
