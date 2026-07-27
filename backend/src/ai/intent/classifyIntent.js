import { SUPPORTED_INTENTS, CONFIDENCE_ENUMS } from './supportedIntents.js';
import { normalizeQuestion } from './normalizeQuestion.js';
import { extractFilters } from './extractFilters.js';
import { askReceiptlyResultSchema } from '../../validators/askReceiptly.validator.js';
import { callGroqChatCompletion, TEXT_MODEL, isAiEnabled } from '../groqClient.js';
import { buildIntentClassifierPrompt } from '../../prompts/intentClassifier.prompt.js';
import { logger } from '../../utils/logger.js';

/**
 * Async AI-driven intent classifier that uses Groq LLM to dynamically understand intent and filters.
 * @param {string} rawQuestion 
 * @returns {Promise<Object>} Validated askReceiptly result envelope
 */
export const classifyQuestionAsync = async (rawQuestion) => {
  const normalized = normalizeQuestion(rawQuestion);

  // 0. Safety guard check for empty or off-topic / prompt-injection questions
  if (!normalized || !isReceiptQuestion(normalized)) {
    return askReceiptlyResultSchema.parse({
      supported: false,
      reason: 'unsupported_question',
    });
  }

  // 1. Pure Full AI Classification via Groq LLM (understands any natural question, typos & search queries)
  if (isAiEnabled()) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const prompt = buildIntentClassifierPrompt(rawQuestion);
      const completion = await callGroqChatCompletion(
        {
          messages: [prompt.system, prompt.user],
          model: TEXT_MODEL,
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: 'json_object' },
        },
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const content = completion.choices[0]?.message?.content?.trim() || '';
      const cleanJsonText = content.replace(/```json|```/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonText);

      if (parsed && typeof parsed === 'object') {
        // If LLM claims unsupported but isReceiptQuestion is true, override and fall back to deterministic classification
        if (parsed.supported === false && isReceiptQuestion(normalized)) {
          return classifyQuestion(rawQuestion);
        }

        if (parsed.supported === false) {
          return askReceiptlyResultSchema.parse({
            supported: false,
            reason: 'unsupported_question',
          });
        }

        const validIntentValues = Object.values(SUPPORTED_INTENTS);
        const intent = validIntentValues.includes(parsed.intent)
          ? parsed.intent
          : SUPPORTED_INTENTS.SEARCH_RECEIPTS;

        const rawFilters = parsed.filters || {};
        const cleanFilters = {};
        if (rawFilters.merchant && typeof rawFilters.merchant === 'string') cleanFilters.merchant = rawFilters.merchant;
        if (rawFilters.category && typeof rawFilters.category === 'string') cleanFilters.category = rawFilters.category;
        if (rawFilters.period && typeof rawFilters.period === 'string') cleanFilters.period = rawFilters.period;
        if (rawFilters.invoiceNumber && typeof rawFilters.invoiceNumber === 'string') cleanFilters.invoiceNumber = rawFilters.invoiceNumber;
        if (typeof rawFilters.minAmount === 'number') cleanFilters.minAmount = rawFilters.minAmount;
        if (typeof rawFilters.maxAmount === 'number') cleanFilters.maxAmount = rawFilters.maxAmount;

        if (rawFilters.query && typeof rawFilters.query === 'string') {
          const qLower = rawFilters.query.trim().toLowerCase();
          const isStopWordQuery = ['how', 'much', 'many', 'spend', 'spent', 'spending', 'expense', 'expenses', 'total', 'cost', 'biggest', 'smallest', 'cheapest', 'count', 'average', 'avg', 'what', 'was', 'how much spend', 'how much spending', 'how many receipts'].includes(qLower);
          if (!isStopWordQuery) {
            cleanFilters.query = rawFilters.query;
          }
        }

        return askReceiptlyResultSchema.parse({
          supported: true,
          intent,
          filters: cleanFilters,
          confidence: CONFIDENCE_ENUMS.HIGH,
        });
      }
    } catch (aiErr) {
      clearTimeout(timeoutId);
      logger.warn(`Groq AI intent classification failed or timed out, falling back: ${aiErr.message}`);
    }
  }

  // 2. Deterministic Fallback Classifier for Offline Unit Testing
  return classifyQuestion(rawQuestion);
};

// Receipt domain keywords for isReceiptQuestion guard (including common typos and question prefixes)
const RECEIPT_DOMAIN_KEYWORDS = [
  'spend', 'spent', 'spending', 'expense', 'expenses', 'cost', 'costs',
  'paid', 'pay', 'purchase', 'purchases', 'bought', 'bough', 'bght', 'bot', 'buyed', 'buy', 'buys', 'shopping',
  'receipt', 'receipts', 'bill', 'bills', 'invoice', 'invoices', 'warranty',
  'warranties', 'merchant', 'merchants', 'category', 'categories', 'total',
  'average', 'biggest', 'smallest', 'highest', 'lowest', 'recent', 'latest',
  'vault', 'how much', 'how many', 'count', 'breakdown', 'show', 'list', 'find',
  'search', 'check', 'any', 'have i', 'did i', 'do i', 'is there', 'got', 'get', 'where',
  'what can you do', 'what can ask receiptly do', 'help', 'what questions'
];

// Non-receipt domain topics & prompt injection patterns to explicitly reject
const NON_RECEIPT_TOPICS = [
  'elon musk', 'react', 'python', 'javascript', 'weather', 'stock', 'stocks',
  'crypto', 'bitcoin', 'joke', 'world cup', 'code', 'algorithm', 'dsa', 'news',
  'movie', 'song', 'poem', 'cat', 'cats', 'president', 'capital of', 'translate',
  'ignore previous', 'system prompt', 'api key', 'api keys', 'secret key', 'keys', 'override instructions', 'instructions'
];

/**
 * Checks if a question belongs to the receipt/expense domain
 * @param {string} normalizedQuestion 
 * @returns {boolean}
 */
export const isReceiptQuestion = (normalizedQuestion) => {
  if (!normalizedQuestion || typeof normalizedQuestion !== 'string') {
    return false;
  }

  // Explicit non-receipt topic check
  if (NON_RECEIPT_TOPICS.some((topic) => normalizedQuestion.includes(topic))) {
    return false;
  }

  // Check keyword match
  const hasKeyword = RECEIPT_DOMAIN_KEYWORDS.some((kw) => normalizedQuestion.includes(kw));
  if (hasKeyword) return true;

  // Fallback: Check if structured filter (merchant, category, query, invoice) can be extracted
  const filters = extractFilters(normalizedQuestion);
  return Boolean(filters.merchant || filters.category || filters.invoiceNumber || filters.query);
};

/**
 * Main intent classifier function
 * @param {string} rawQuestion 
 * @returns {Object} Validated askReceiptly result envelope
 */
export const classifyQuestion = (rawQuestion) => {
  const normalized = normalizeQuestion(rawQuestion);

  // 1. Guard check for empty or non-receipt domain questions
  if (!normalized || !isReceiptQuestion(normalized)) {
    return askReceiptlyResultSchema.parse({
      supported: false,
      reason: 'unsupported_question',
    });
  }

  // 2. Extract structured filters
  const filters = extractFilters(normalized);
  let intent = SUPPORTED_INTENTS.UNKNOWN;
  let confidence = CONFIDENCE_ENUMS.MEDIUM;
  let needsClarification = false;

  // 3. Intent Classification Rules (ordered by priority)

  // Warranty intents
  if (normalized.includes('expiring warranty') || normalized.includes('warranties expiring')) {
    intent = SUPPORTED_INTENTS.EXPIRING_WARRANTIES;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (normalized.includes('warranty') || normalized.includes('warranties')) {
    intent = SUPPORTED_INTENTS.ACTIVE_WARRANTIES;
    confidence = CONFIDENCE_ENUMS.HIGH;
  }
  // Invoice lookup intent
  else if (filters.invoiceNumber || normalized.includes('invoice') || normalized.includes('bill no')) {
    intent = SUPPORTED_INTENTS.SEARCH_INVOICE;
    confidence = CONFIDENCE_ENUMS.HIGH;
  }
  // Biggest / Smallest purchase intents
  else if (normalized.includes('biggest') || normalized.includes('highest') || normalized.includes('maximum') || normalized.includes('most expensive')) {
    intent = SUPPORTED_INTENTS.BIGGEST_PURCHASE;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (normalized.includes('smallest') || normalized.includes('lowest') || normalized.includes('cheapest') || normalized.includes('least expensive')) {
    intent = SUPPORTED_INTENTS.SMALLEST_PURCHASE;
    confidence = CONFIDENCE_ENUMS.HIGH;
  }
  // Top Category / Merchant intents
  else if (normalized.includes('top category') || normalized.includes('top categories') || normalized.includes('top 3 categories') || normalized.includes('highest spending category') || normalized.includes('highest category') || normalized.includes('most category')) {
    intent = SUPPORTED_INTENTS.TOP_CATEGORY;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (normalized.includes('top merchant') || normalized.includes('highest merchant') || normalized.includes('top vendor') || normalized.includes('favorite store')) {
    intent = SUPPORTED_INTENTS.TOP_MERCHANT;
    confidence = CONFIDENCE_ENUMS.HIGH;
  }
  // Average / Count / Breakdown / Monthly / Yearly intents
  else if (normalized.includes('average') || normalized.includes('avg')) {
    intent = SUPPORTED_INTENTS.AVERAGE_SPENDING;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (normalized.includes('count') || normalized.includes('how many') || normalized.includes('number of receipts')) {
    intent = SUPPORTED_INTENTS.PURCHASE_COUNT;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (normalized.includes('breakdown') || normalized.includes('distribution') || normalized.includes('category breakdown')) {
    intent = SUPPORTED_INTENTS.CATEGORY_BREAKDOWN;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (normalized.includes('monthly') || normalized.includes('month by month')) {
    intent = SUPPORTED_INTENTS.MONTHLY_SPENDING;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (normalized.includes('yearly') || normalized.includes('year by year')) {
    intent = SUPPORTED_INTENTS.YEARLY_SPENDING;
    confidence = CONFIDENCE_ENUMS.HIGH;
  }
  // Recent purchases intent
  else if (normalized.includes('recent') || normalized.includes('latest') || normalized.includes('last purchases')) {
    intent = SUPPORTED_INTENTS.RECENT_PURCHASES;
    confidence = CONFIDENCE_ENUMS.HIGH;
  }
  // Spending sum intents (by merchant, by category, or total)
  else if (filters.merchant) {
    intent = SUPPORTED_INTENTS.TOTAL_BY_MERCHANT;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (filters.category) {
    intent = SUPPORTED_INTENTS.TOTAL_BY_CATEGORY;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (normalized.includes('total') || normalized.includes('spend') || normalized.includes('spent') || normalized.includes('cost') || normalized.includes('expense')) {
    intent = SUPPORTED_INTENTS.TOTAL_SPENDING;
    confidence = CONFIDENCE_ENUMS.HIGH;
  }
  // Generic receipt search vs UNKNOWN receipt concept
  else if (normalized.includes('festival') || normalized.includes('holiday') || normalized.includes('coupon') || normalized.includes('discount')) {
    intent = SUPPORTED_INTENTS.UNKNOWN;
    confidence = CONFIDENCE_ENUMS.LOW;
  }
  // Item/keyword query search or generic receipt search
  else if (filters.query) {
    intent = SUPPORTED_INTENTS.SEARCH_RECEIPTS;
    confidence = CONFIDENCE_ENUMS.HIGH;
  } else if (normalized.includes('show') || normalized.includes('list') || normalized.includes('find') || normalized.includes('receipts')) {
    intent = SUPPORTED_INTENTS.SEARCH_RECEIPTS;
    confidence = CONFIDENCE_ENUMS.MEDIUM;
  } else {
    intent = SUPPORTED_INTENTS.UNKNOWN;
    confidence = CONFIDENCE_ENUMS.LOW;
  }

  // Flag potential ambiguity (e.g. phrase could be merchant or search query)
  if (filters.merchant && filters.category) {
    needsClarification = true;
  }

  const rawResult = {
    supported: true,
    intent,
    filters,
    confidence,
    ...(needsClarification ? { needsClarification: true } : {}),
  };

  return askReceiptlyResultSchema.parse(rawResult);
};
