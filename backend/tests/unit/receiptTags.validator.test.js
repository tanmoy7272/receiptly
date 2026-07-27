import { describe, it, expect } from 'vitest';
import { receiptTagsSchema } from '../../src/validators/receiptTags.validator.js';
import { normalizeTags } from '../../src/utils/tagNormalizer.util.js';

describe('receiptTagsSchema Validator & Tag Normalizer', () => {
  it('should validate, normalize, and sort valid tags array alphabetically', () => {
    const input = ['office', 'electronics', 'apple', 'laptop'];
    const parsed = receiptTagsSchema.parse(input);
    expect(parsed).toEqual(['apple', 'electronics', 'laptop', 'office']);
  });

  it('should strip punctuation and collapse whitespace', () => {
    const input = ['  coffee,  ', 'home-office!  '];
    const parsed = receiptTagsSchema.parse(input);
    expect(parsed).toEqual(['coffee', 'home office']);
  });

  it('should deduplicate case-insensitive duplicates and filter out verbatim category matches', () => {
    const tags = ['electronics', 'Electronics', 'laptop'];
    const normalized = normalizeTags(tags, 'Electronics');
    expect(normalized).toEqual(['laptop']);
  });

  it('should filter out empty strings and strings exceeding 20 chars', () => {
    const input = ['   ', 'a'.repeat(21), 'validtag'];
    const parsed = receiptTagsSchema.parse(input);
    expect(parsed).toEqual(['validtag']);
  });
});
