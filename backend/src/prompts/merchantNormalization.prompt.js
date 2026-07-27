/**
 * ============================================================================
 * AI Merchant Normalization Prompt Guidelines
 * ============================================================================
 * Purpose: Defines guidelines for extracting canonical Title Case merchant names.
 * Rules: Remove corporate suffixes (Inc, Ltd, Pvt Ltd, Services, Pay), max 40 chars.
 * ============================================================================
 */

export const MERCHANT_NORMALIZATION_RULES = `
RULES FOR MERCHANT NAME NORMALIZATION:
1. merchantNormalized: Output a clean, canonical Title Case merchant name (e.g., "Amazon" for "AMAZON SELLER SERVICES PVT LTD", "Swiggy" for "SWIGGY INDIA LIMITED").
2. Remove corporate, legal, and operational suffixes (e.g., Inc, LLC, Pvt Ltd, Limited, Services, Marketplace, Pay, Retail).
3. Maximum 40 characters long.
4. Never invent brand names or translate store names into other languages.
5. If unsure or no clean canonical brand exists, return the Title Cased original merchant name.
`;
