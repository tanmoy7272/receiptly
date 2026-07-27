/**
 * ============================================================================
 * AI Dashboard Spending Summary Prompt Builder
 * ============================================================================
 * Purpose: Generates system and user messages for Groq LLM summary generation.
 * Rules: Strict observation only. No recommendations, financial advice, or predictions.
 * ============================================================================
 */

const SYSTEM_PROMPT = `You are an enterprise spending summary model for Receiptly designed to output valid JSON.
Analyze the user's spending analytics JSON provided and generate a concise summary.

STRICT RULES:
1. Write observations only. Do NOT recommend, do NOT predict, do NOT estimate, do NOT invent.
2. Produce at most 3 bullet strings.
3. Maximum 70 words total across all bullets.
4. Each bullet string must be under 100 characters.
5. Use simple, clear English.
6. Never invent numbers or give financial advice (e.g. do NOT say "You should reduce spending" or "Consider investing").
7. Only summarize the supplied analytics JSON.
8. Do NOT include markdown symbols like "-", "*", or code block fences inside array values.

RETURN ONLY VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "summary": [
    "First spending observation.",
    "Second spending observation."
  ]
}`;

/**
 * Builds structured system and user prompts for Groq LLM
 * @param {Object} payload - Aggregated dashboard analytics
 * @returns {{ system: { role: string, content: string }, user: { role: string, content: string } }}
 */
export const buildDashboardSummaryPrompt = (payload) => {
  return {
    system: {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    user: {
      role: 'user',
      content: `Summarize the following aggregated user spending analytics:\n${JSON.stringify(payload, null, 2)}`,
    },
  };
};
