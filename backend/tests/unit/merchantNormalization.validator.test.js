import { describe, it, expect } from 'vitest';
import { normalizeMerchantName } from '../../src/utils/merchantNormalizer.util.js';
import { merchantNormalizationSchema } from '../../src/validators/merchantNormalization.validator.js';

describe('Merchant Normalization Utility & Validator', () => {
  it('should normalize corporate/legal suffixes to canonical Title Case', () => {
    expect(normalizeMerchantName('AMAZON SELLER SERVICES PRIVATE LIMITED')).toBe('Amazon');
    expect(normalizeMerchantName('swiggy india limited')).toBe('Swiggy');
    expect(normalizeMerchantName('starbucks coffee co')).toBe('Starbucks Coffee');
  });

  it('should handle simple merchant names without suffixes', () => {
    expect(normalizeMerchantName('byepass dhaba')).toBe('Byepass Dhaba');
    expect(normalizeMerchantName('apple')).toBe('Apple');
  });

  it('should fallback gracefully if suffix removal leaves empty string', () => {
    expect(normalizeMerchantName('Inc Ltd')).toBe('Inc Ltd');
    expect(normalizeMerchantName('Amazon Pay')).toBe('Amazon');
  });

  it('should handle empty or non-string input safely', () => {
    expect(normalizeMerchantName('')).toBe('Unknown Store');
    expect(normalizeMerchantName(null)).toBe('Unknown Store');
    expect(normalizeMerchantName(undefined)).toBe('Unknown Store');
  });

  it('should validate merchantNormalizationSchema correctly', () => {
    const input = { merchantNormalized: 'AMAZON INDIA PRIVATE LIMITED' };
    const parsed = merchantNormalizationSchema.parse(input);
    expect(parsed.merchantNormalized).toBe('Amazon');
  });
});
