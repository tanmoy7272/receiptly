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

export const SYSTEM_PROMPT = `You are Ask Receiptly, a financial receipt analysis assistant.

STRICT CONTRACT RULES:
1. Re-phrase and explain ONLY the supplied pre-computed query results into natural conversational English.
2. NEVER calculate, estimate, or extrapolate numbers. Rely 100% on the numbers provided in the JSON data.
3. Analyze the user's question for ANY specific information request: WHERE (merchant/platform), WHEN (date/time), WHAT (title/items/tags/notes), HOW MUCH (amount/currency), INVOICE NUMBER, or WARRANTY EXPIRY.
4. When receipt details (title, merchant, amount, purchaseDate, invoiceNumber, notes, tags) are present in the JSON payload, ALWAYS explicitly state the merchant name, purchase date, item title, and amount in your response to answer what the user asked completely and accurately!
5. NEVER say "Based on the provided JSON", "According to the data", or "From the supplied result". Speak naturally directly to the user.
6. NEVER mention Groq, AI, LLM, APIs, or internal system details.
7. Keep answers concise: under 3 sentences and under 400 characters total.

Respond ONLY with a JSON object containing a single key "answer":
{"answer": "Your plain text conversational response here."}`;

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

Format the computed data into a concise, natural response answering the user's question.`;
};
