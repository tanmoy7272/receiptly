/**
 * ============================================================================
 * Tag Normalization Helper Utility
 * ============================================================================
 * Purpose: Sanitizes, trims, removes punctuation, collapses whitespace, deduplicates,
 *          filters out verbatim category duplicates, and sorts tag arrays deterministically.
 * ============================================================================
 */

/**
 * Normalizes an array or comma-separated string of tags
 * @param {Array<string>|string} tags - Raw tags input
 * @param {string} [category] - Receipt category to avoid duplicate tags
 * @returns {string[]} Sanitized, deduplicated, sorted array of max 5 tags (<= 20 chars each)
 */
export const normalizeTags = (tags = [], category = '') => {
  let rawList = [];

  if (Array.isArray(tags)) {
    rawList = tags;
  } else if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) rawList = parsed;
      else rawList = tags.split(',');
    } catch {
      rawList = tags.split(',');
    }
  } else {
    return [];
  }

  const normalizedCategory = String(category || '').trim().toLowerCase();

  const cleaned = rawList
    .map((t) => {
      if (typeof t !== 'string') return '';
      return t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ') // Replace punctuation/symbols with single spaces
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    })
    .filter((t) => {
      if (!t || t.length > 20) return false;
      if (normalizedCategory && t === normalizedCategory) return false;
      return true;
    });

  // Deduplicate and sort alphabetically for deterministic storage
  const uniqueSorted = Array.from(new Set(cleaned)).sort().slice(0, 5);
  return uniqueSorted;
};
