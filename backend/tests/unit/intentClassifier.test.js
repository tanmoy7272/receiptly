import { describe, it, expect } from 'vitest';
import { classifyQuestion, isReceiptQuestion } from '../../src/ai/intent/classifyIntent.js';
import { normalizeQuestion } from '../../src/ai/intent/normalizeQuestion.js';
import { extractFilters } from '../../src/ai/intent/extractFilters.js';
import { SUPPORTED_INTENTS, PERIOD_ENUMS, CONFIDENCE_ENUMS } from '../../src/ai/intent/supportedIntents.js';

describe('Ask Receiptly Intent Engine (Prompt 1)', () => {
  describe('normalizeQuestion Helper', () => {
    it('should trim, lowercase, and strip emojis & extra whitespace', () => {
      const input = '   How much did I SPEND on Swiggy 🛒 this month?  ';
      const normalized = normalizeQuestion(input);
      expect(normalized).toBe('how much did i spend on swiggy this month?');
    });

    it('should return empty string for null, undefined, or empty inputs', () => {
      expect(normalizeQuestion('')).toBe('');
      expect(normalizeQuestion(null)).toBe('');
      expect(normalizeQuestion(undefined)).toBe('');
    });
  });

  describe('isReceiptQuestion Domain Guard', () => {
    it('should return true for receipt-related questions', () => {
      expect(isReceiptQuestion('how much did i spend on amazon')).toBe(true);
      expect(isReceiptQuestion('show active warranties')).toBe(true);
      expect(isReceiptQuestion('find invoice inv-123')).toBe(true);
    });

    it('should return false for general knowledge & non-receipt questions', () => {
      expect(isReceiptQuestion('who is elon musk?')).toBe(false);
      expect(isReceiptQuestion('explain react.js state management')).toBe(false);
      expect(isReceiptQuestion('what is the weather today in kolkata?')).toBe(false);
      expect(isReceiptQuestion('write a poem about cats')).toBe(false);
      expect(isReceiptQuestion('should i buy crypto?')).toBe(false);
    });
  });

  describe('extractFilters Helper', () => {
    it('should extract period enums correctly without spurious query filters', () => {
      const f1 = extractFilters('how much did i spend this month');
      expect(f1.period).toBe(PERIOD_ENUMS.THIS_MONTH);
      expect(f1.query).toBeUndefined();

      expect(extractFilters('spending last month').period).toBe(PERIOD_ENUMS.LAST_MONTH);
      expect(extractFilters('purchases this year').period).toBe(PERIOD_ENUMS.THIS_YEAR);
    });

    it('should not extract spurious query filters for preset aggregation questions', () => {
      expect(extractFilters('What was my biggest purchase?').query).toBeUndefined();
      expect(extractFilters('How many receipts do I have?').query).toBeUndefined();
      expect(extractFilters('What is my average purchase amount?').query).toBeUndefined();
    });

    it('should extract categories from RECEIPT_CATEGORIES single source of truth', () => {
      expect(extractFilters('show my food expenses').category).toBe('Food');
      expect(extractFilters('travel expenses this month').category).toBe('Travel');
      expect(extractFilters('shopping spending').category).toBe('Shopping');
    });

    it('should extract invoice numbers using regex', () => {
      expect(extractFilters('find invoice INV-12345').invoiceNumber).toBe('INV-12345');
      expect(extractFilters('show bill number 26P9AGTC00000090').invoiceNumber).toBe('26P9AGTC00000090');
    });

    it('should dynamically extract merchant phrases without hardcoding vendor lists', () => {
      expect(extractFilters('how much did i spend on Swiggy this month').merchant).toBe('Swiggy');
      expect(extractFilters('expenses at Reliance Digital').merchant).toBe('Reliance Digital');
    });
  });

  describe('classifyQuestion Main Pipeline', () => {
    it('should classify TOTAL_BY_MERCHANT with dynamic merchant and period enum', () => {
      const res = classifyQuestion('How much did I spend on Swiggy this month?');
      expect(res.supported).toBe(true);
      expect(res.intent).toBe(SUPPORTED_INTENTS.TOTAL_BY_MERCHANT);
      expect(res.filters.merchant).toBe('Swiggy');
      expect(res.filters.period).toBe(PERIOD_ENUMS.THIS_MONTH);
      expect(res.confidence).toBe(CONFIDENCE_ENUMS.HIGH);
    });

    it('should classify TOTAL_BY_CATEGORY with category filter', () => {
      const res = classifyQuestion('Show total food expenses');
      expect(res.supported).toBe(true);
      expect(res.intent).toBe(SUPPORTED_INTENTS.TOTAL_BY_CATEGORY);
      expect(res.filters.category).toBe('Food');
      expect(res.confidence).toBe(CONFIDENCE_ENUMS.HIGH);
    });

    it('should classify TOTAL_SPENDING for general spending queries', () => {
      const res = classifyQuestion('What is my total spending this year?');
      expect(res.supported).toBe(true);
      expect(res.intent).toBe(SUPPORTED_INTENTS.TOTAL_SPENDING);
      expect(res.filters.period).toBe(PERIOD_ENUMS.THIS_YEAR);
    });

    it('should classify ACTIVE_WARRANTIES', () => {
      const res = classifyQuestion('Show all active warranties');
      expect(res.supported).toBe(true);
      expect(res.intent).toBe(SUPPORTED_INTENTS.ACTIVE_WARRANTIES);
    });

    it('should classify EXPIRING_WARRANTIES', () => {
      const res = classifyQuestion('Show warranties expiring soon');
      expect(res.supported).toBe(true);
      expect(res.intent).toBe(SUPPORTED_INTENTS.EXPIRING_WARRANTIES);
    });

    it('should classify SEARCH_INVOICE', () => {
      const res = classifyQuestion('Find invoice number INV-999');
      expect(res.supported).toBe(true);
      expect(res.intent).toBe(SUPPORTED_INTENTS.SEARCH_INVOICE);
      expect(res.filters.invoiceNumber).toBe('INV-999');
    });

    it('should classify BIGGEST_PURCHASE and SMALLEST_PURCHASE', () => {
      const res1 = classifyQuestion('What was my biggest purchase?');
      expect(res1.intent).toBe(SUPPORTED_INTENTS.BIGGEST_PURCHASE);

      const res2 = classifyQuestion('What was my cheapest expense?');
      expect(res2.intent).toBe(SUPPORTED_INTENTS.SMALLEST_PURCHASE);
    });

    it('should classify AVERAGE_SPENDING and PURCHASE_COUNT', () => {
      const res1 = classifyQuestion('What is my average purchase amount?');
      expect(res1.intent).toBe(SUPPORTED_INTENTS.AVERAGE_SPENDING);

      const res2 = classifyQuestion('How many receipts do I have?');
      expect(res2.intent).toBe(SUPPORTED_INTENTS.PURCHASE_COUNT);
    });

    it('should return supported: true with UNKNOWN intent for unsupported receipt queries', () => {
      const res = classifyQuestion('Show receipts bought during festival holidays');
      expect(res.supported).toBe(true);
      expect(res.intent).toBe(SUPPORTED_INTENTS.UNKNOWN);
      expect(res.confidence).toBe(CONFIDENCE_ENUMS.LOW);
    });

    it('should return supported: false for non-receipt domain questions', () => {
      const res1 = classifyQuestion('Who is Elon Musk?');
      expect(res1.supported).toBe(false);
      expect(res1.reason).toBe('unsupported_question');

      const res2 = classifyQuestion('Explain React useState hook');
      expect(res2.supported).toBe(false);
      expect(res2.reason).toBe('unsupported_question');
    });

    it('should classify natural item searches with typos (e.g. i bough any tv?)', () => {
      const res = classifyQuestion('i bough any tv?');
      expect(res.supported).toBe(true);
      expect(res.intent).toBe(SUPPORTED_INTENTS.SEARCH_RECEIPTS);
      expect(res.filters.query).toBe('tv');
    });

    it('should handle ALL CAPS, emojis, extra spaces, and special characters', () => {
      const res = classifyQuestion('  🔥 HOW MUCH DID I SPEND ON AMAZON THIS MONTH??? 🛒 ');
      expect(res.supported).toBe(true);
      expect(res.intent).toBe(SUPPORTED_INTENTS.TOTAL_BY_MERCHANT);
      expect(res.filters.merchant).toBe('Amazon');
      expect(res.filters.period).toBe(PERIOD_ENUMS.THIS_MONTH);
    });
  });
});
