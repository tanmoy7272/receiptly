/**
 * ============================================================================
 * AI Duplicate Receipt Detection Prompt Guidelines
 * ============================================================================
 * Purpose: Provides rules for comparing candidate receipt metadata vs uploaded receipt.
 * Output: Strict JSON matching { "duplicate": boolean, "confidence": "low"|"medium"|"high" }.
 * ============================================================================
 */

export const DUPLICATE_DETECTION_RULES = `
You are an enterprise receipt deduplication analyzer.
Compare the uploaded receipt metadata against candidate receipt metadata.

RULES:
1. Analyze if both records represent the EXACT SAME physical transaction or bill.
2. Consider merchant name variations, title descriptions, purchase date proximity, order IDs, and total amounts.
3. Return ONLY valid JSON matching this schema:
{
  "duplicate": boolean,
  "confidence": "low" | "medium" | "high"
}
4. Do NOT output markdown, explanations, or additional keys.
`;
