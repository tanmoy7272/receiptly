/**
 * ============================================================================
 * Ask Receiptly Question Normalizer
 * ============================================================================
 * Purpose: Pre-processes raw user question text by trimming, stripping emojis,
 *          collapsing spaces, and converting to clean lowercase format.
 * ============================================================================
 */

export const normalizeQuestion = (rawQuestion) => {
  if (!rawQuestion || typeof rawQuestion !== 'string') {
    return '';
  }

  return rawQuestion
    .trim()
    .toLowerCase()
    // Strip common emojis and non-alphanumeric noise except basic punctuation & hyphens
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};
