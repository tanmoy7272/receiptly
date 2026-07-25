import { describe, it, expect } from 'vitest';
import { aiExtractionSchema } from '../../src/validators/ai.validator.js';

describe('AI Validator - aiExtractionSchema', () => {
  it('validates a correct AI extraction result', () => {
    const validPayload = {
      version: 1,
      success: true,
      data: {
        title: { value: 'Amazon Order #102', confidence: 0.95 },
        merchant: { value: 'Amazon India', confidence: 0.98 },
        amount: { value: 1299.5, confidence: 0.99 },
        currency: { value: 'INR', confidence: 0.99 },
        purchaseDate: { value: '2026-07-20', confidence: 0.92 },
        category: { value: 'Shopping', confidence: 0.9 },
        notes: { value: 'Wireless mouse purchase', confidence: 0.85 },
      },
    };

    const result = aiExtractionSchema.parse(validPayload);
    expect(result.data.amount.value).toBe(1299.5);
    expect(result.data.category.value).toBe('Shopping');
  });

  it('validates Phase A additions (invoiceNumber, warrantyMonths, warrantyExpiryDate)', () => {
    const phaseAPayload = {
      version: 1,
      success: true,
      data: {
        title: { value: 'Dell Laptop Purchase', confidence: 0.95 },
        merchant: { value: 'Dell Official Store', confidence: 0.98 },
        amount: { value: 74999.0, confidence: 0.99 },
        currency: { value: 'INR', confidence: 0.99 },
        purchaseDate: { value: '2026-07-25', confidence: 0.95 },
        category: { value: 'Shopping', confidence: 0.9 },
        notes: { value: 'Inspiron 15 with 1 Year Warranty', confidence: 0.85 },
        invoiceNumber: { value: 'INV-2026-90812', confidence: 0.94 },
        warrantyMonths: { value: 12, confidence: 0.9 },
        warrantyExpiryDate: { value: '2027-07-25', confidence: 0.88 },
        warrantySource: { value: 'EXPLICIT_DATE', confidence: 0.9 },
      },
    };

    const result = aiExtractionSchema.parse(phaseAPayload);
    expect(result.data.invoiceNumber.value).toBe('INV-2026-90812');
    expect(result.data.warrantyMonths.value).toBe(12);
    expect(result.data.warrantyExpiryDate.value).toBe('2027-07-25');
  });

  it('handles null values for optional or unextracted fields', () => {
    const payloadWithNulls = {
      data: {
        title: { value: 'Restaurant Receipt', confidence: 0.9 },
        merchant: { value: null },
        amount: { value: 450, confidence: 0.9 },
        currency: { value: null },
        purchaseDate: { value: null },
        category: { value: null },
        notes: { value: null },
      },
    };

    const result = aiExtractionSchema.parse(payloadWithNulls);
    expect(result.data.merchant.value).toBeNull();
    expect(result.data.amount.value).toBe(450);
  });

  it('rejects malformed amount values', () => {
    const malformedData = {
      data: {
        title: { value: 'Invalid Receipt', confidence: 0.9 },
        merchant: { value: 'Store', confidence: 0.9 },
        amount: { value: -50, confidence: 0.9 },
      },
    };

    expect(() => aiExtractionSchema.parse(malformedData)).toThrow();
  });

  it('rejects invalid category options', () => {
    const invalidCategoryData = {
      data: {
        title: { value: 'Store Receipt', confidence: 0.9 },
        category: { value: 'NonExistentCategory', confidence: 0.9 },
      },
    };

    expect(() => aiExtractionSchema.parse(invalidCategoryData)).toThrow();
  });
});
