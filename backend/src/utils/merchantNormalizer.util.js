/**
 * ============================================================================
 * Merchant Name Normalization Helper Utility (Single Source of Truth)
 * ============================================================================
 * Purpose: Deterministically cleans raw merchant strings by stripping legal/corporate
 *          suffixes (Pvt Ltd, Inc, LLC, Corporate, India, Seller Services) and applying
 *          canonical Title Case formatting (e.g., "AMAZON SELLER SERVICES PVT LTD" -> "Amazon").
 * ============================================================================
 */

/**
 * Converts a raw merchant string into a clean, canonical Title Case merchant name.
 * @param {string} merchantRaw - Raw vendor/merchant name from receipt or user input
 * @returns {string} Clean, normalized merchant name (max 40 chars)
 */
export const normalizeMerchantName = (merchantRaw) => {
  if (!merchantRaw || typeof merchantRaw !== 'string') {
    return 'Unknown Store';
  }

  const trimmed = merchantRaw.trim();
  if (!trimmed) return 'Unknown Store';

  // Specific corporate and legal suffix patterns to strip (preserves brand words like Pharmacy, Market)
  const suffixRegex = /\b(pvt|ltd|private|limited|inc|incorporated|corp|corporation|llc|co|company|india|seller services|pay|marketplace|formerly known as|formerly)\b/gi;

  // Strip legal/corporate suffixes and special characters
  let cleaned = trimmed
    .replace(suffixRegex, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If stripping left an empty string, fallback to cleaned original string
  if (!cleaned) {
    cleaned = trimmed.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Convert words to Title Case
  const titleCased = cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return titleCased.slice(0, 40) || 'Unknown Store';
};
