/**
 * ============================================================================
 * Centralized Groq LLM Client & Feature Flag Helper
 * ============================================================================
 * Purpose: Single point of initialization for Groq SDK client, default models,
 *          and global AI feature flag evaluation (`ENABLE_AI_INSIGHTS`).
 * ============================================================================
 */
import Groq from 'groq-sdk';
import { config } from '../config/env.js';

const groqApiKey = config.groqApiKey || process.env.GROQ_API_KEY;
const isApiKeyConfigured = Boolean(groqApiKey && groqApiKey !== 'gsk_your_groq_api_key_here');

/**
 * Shared Groq SDK instance (null if API key missing)
 */
export const groq = isApiKeyConfigured ? new Groq({ apiKey: groqApiKey }) : null;

/**
 * Default Groq models
 */
export const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
export const VISION_MODEL = process.env.GROQ_VISION_MODEL || 'llama-3.3-70b-versatile';

/**
 * Checks if AI features are enabled globally and valid API key is present
 * @returns {boolean}
 */
export const isAiEnabled = () => {
  const isEnabledFlag = config.enableAiInsights !== false && process.env.ENABLE_AI_INSIGHTS !== 'false';
  return Boolean(isEnabledFlag && isApiKeyConfigured && groq);
};

/**
 * Executes a Groq chat completion with automatic model failover (70b -> 8b instant) to prevent 429 rate limit errors
 */
export const callGroqChatCompletion = async (params, options = {}) => {
  if (!groq) throw new Error('Groq client not initialized');

  const primaryModel = params.model || TEXT_MODEL;
  const fallbackModel = 'llama-3.1-8b-instant';

  try {
    return await groq.chat.completions.create(
      { ...params, model: primaryModel },
      options
    );
  } catch (error) {
    if (error?.status === 429 || (error?.message && error.message.includes('rate_limit'))) {
      return await groq.chat.completions.create(
        { ...params, model: fallbackModel },
        options
      );
    }
    throw error;
  }
};
