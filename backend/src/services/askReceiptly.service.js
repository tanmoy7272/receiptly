/**
 * ============================================================================
 * Ask Receiptly Orchestration Service
 * ============================================================================
 * Purpose: Orchestrates the 3-stage Ask Receiptly pipeline:
 *          1. Intent Engine (classifyQuestion)
 *          2. Query Engine (executeIntent)
 *          3. AI Answer Generator (generateNaturalAnswer)
 * ============================================================================
 */
import { classifyQuestion, classifyQuestionAsync } from '../ai/intent/classifyIntent.js';
import { executeIntent } from '../ai/query/queryEngine.js';
import { generateNaturalAnswer } from '../ai/answer/answer.service.js';

/**
 * Processes a user question end-to-end through the Ask Receiptly pipeline
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.question - Raw question text
 * @returns {Promise<Object>} API response payload
 */
export const processUserQuestion = async ({ userId, question }) => {
  // Stage 1: AI Intent Classification (Groq LLM with intelligent fallback)
  const intentResult = await classifyQuestionAsync(question);

  if (!intentResult || intentResult.supported === false) {
    return {
      success: true,
      supported: false,
      answer: 'I can answer questions only about your receipts, spending totals, merchants, categories, active warranties, and invoices.',
      answeredBy: 'fallback',
      metadata: {
        intent: 'UNSUPPORTED',
        period: 'ALL_TIME',
        resultCount: 0,
      },
    };
  }

  // Stage 2: Deterministic PostgreSQL Query Engine Execution
  const queryResult = await executeIntent({
    userId,
    intent: intentResult.intent,
    filters: intentResult.filters,
  });

  // Stage 3: AI Answer Formatting (or Deterministic Fallback)
  const answerResult = await generateNaturalAnswer({
    userId,
    question,
    queryResult,
  });

  const resultCount =
    queryResult?.data?.receiptCount ??
    queryResult?.data?.count ??
    queryResult?.data?.groupCount ??
    (queryResult?.data?.found ? 1 : 0);

  return {
    success: true,
    supported: true,
    intent: intentResult.intent,
    answeredBy: answerResult.answeredBy || 'ai',
    answer: answerResult.answer,
    metadata: {
      intent: intentResult.intent,
      period: queryResult?.metadata?.period || intentResult?.filters?.period || 'ALL_TIME',
      resultCount,
    },
  };
};
