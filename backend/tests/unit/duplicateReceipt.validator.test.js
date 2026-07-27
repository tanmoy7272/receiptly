import { describe, it, expect } from 'vitest';
import {
  checkDuplicateInputSchema,
  duplicateCheckResponseSchema,
} from '../../src/validators/duplicateReceipt.validator.js';

describe('duplicateReceipt Validator Schemas', () => {
  it('should validate valid duplicate check input', () => {
    const input = {
      title: 'iPhone 14',
      merchant: 'Apple Store',
      amount: '99900',
      purchaseDate: '2026-05-20',
      category: 'Shopping',
      invoiceNumber: 'INV-12345',
    };
    const parsed = checkDuplicateInputSchema.parse(input);
    expect(parsed.merchant).toBe('Apple Store');
    expect(parsed.amount).toBe(99900);
  });

  it('should validate valid duplicate check response envelope', () => {
    const response = {
      isDuplicate: true,
      confidence: 'high',
      reason: 'invoice_match',
      candidate: {
        id: 'rec-1',
        title: 'iPhone 14',
        merchant: 'Apple',
        amount: 99900,
        purchaseDate: '2026-05-20',
        category: 'Shopping',
        invoiceNumber: 'INV-12345',
      },
    };
    const parsed = duplicateCheckResponseSchema.parse(response);
    expect(parsed.isDuplicate).toBe(true);
    expect(parsed.confidence).toBe('high');
    expect(parsed.reason).toBe('invoice_match');
  });

  it('should reject invalid confidence values', () => {
    const response = {
      isDuplicate: true,
      confidence: 'ultra_high',
      reason: 'invoice_match',
    };
    expect(() => duplicateCheckResponseSchema.parse(response)).toThrow();
  });
});
