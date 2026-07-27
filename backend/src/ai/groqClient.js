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
export const VISION_MODEL = process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview';

/**
 * Checks if AI features are enabled globally and valid API key is present
 * @returns {boolean}
 */
export const isAiEnabled = () => {
  const isEnabledFlag = config.enableAiInsights !== false && process.env.ENABLE_AI_INSIGHTS !== 'false';
  return Boolean(isEnabledFlag && isApiKeyConfigured && groq);
};
