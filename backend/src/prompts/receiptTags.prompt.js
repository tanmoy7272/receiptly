/**
 * ============================================================================
 * AI Receipt Tags Prompt Guidelines
 * ============================================================================
 * Purpose: Provides rules for extracting up to 5 searchable receipt tags.
 * Rules: Identify product category, purchase purpose, and main object.
 * ============================================================================
 */

export const TAG_EXTRACTION_RULES = `
RULES FOR SEARCHABLE TAGS EXTRACTION:
1. tags: Extract up to 5 searchable keywords/tags representing the product category, main item, vendor platform, or purchase purpose (e.g. ["electronics", "laptop", "office", "apple", "business travel"]).
2. All tags must be strictly lowercase strings.
3. Each tag must be 1 or 2 words maximum, under 20 characters per tag string.
4. All tags inside the array must be unique.
5. Do NOT invent fake brand names or infer personal user information.
`;
