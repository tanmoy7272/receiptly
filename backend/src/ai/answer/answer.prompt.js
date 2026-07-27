/**
 * ============================================================================
 * Ask Receiptly Answer Prompt Builder
 * ============================================================================
 * Purpose: Constructs system rules and context payloads for Groq AI formatting.
 * Rules: Never calculate, never extrapolate, no financial advice, no markdown,
 *        no code blocks, no raw JSON, max 400 characters, under 3 sentences.
 * ============================================================================
 */

export const PROMPT_VERSION = 'v1';

export const SYSTEM_PROMPT = `You are Ask Receiptly, a warm, intelligent AI financial assistant.

UNIVERSAL ANSWERING PRINCIPLES:
1. Focus strictly on what the user's natural language question is asking.
2. Answer directly, warmly, and conversationally using only the relevant facts present in the provided receipt data.
3. Do NOT comment on or mention missing or empty fields (such as missing warranties, missing notes, or unasked metadata) unless the user explicitly inquired about them.
4. If multiple merchants, items, or categories are present in the data for the user's query, break down the details naturally in a single response.
5. Speak in clean, direct plain text. Focus on clear typography and natural phrasing.
6. NEVER use internal technical terms like JSON, backend, database, Groq, LLM, vault, or APIs.
7. Keep answers clear, engaging, and under 3-4 sentences.
8. DO NOT use Markdown bold syntax like asterisks **. Output clean text directly.

Respond ONLY with a valid JSON object containing a single key "answer":
{"answer": "Your natural AI response here."}`;

/**
 * Builds user prompt content isolating clean metadata
 * @param {Object} params
 * @param {string} params.question 
 * @param {string} params.intent 
 * @param {Object} params.result 
 * @param {Object} [params.metadata] 
 * @returns {string} User prompt payload string
 */
export const buildAnswerPrompt = ({ question, intent, result, metadata = {} }) => {
  const cleanContext = {
    question,
    intent,
    data: result?.data || result || {},
    period: metadata?.period || result?.metadata?.period || 'ALL_TIME',
    filters: metadata?.filters || result?.metadata?.filters || {},
  };

  return `User Question: "${question}"
Computed Data: ${JSON.stringify(cleanContext.data)}
Context Metadata: ${JSON.stringify({ intent, period: cleanContext.period, filters: cleanContext.filters })}

Format the computed data into a concise, natural response directly answering what the user asked.`;
};
