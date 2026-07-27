/**
 * ============================================================================
 * Ask Receiptly Intent Classifier
 * ============================================================================
 * Purpose: Classifies natural language user questions into structured receipt intents
 *          and extracted filters (pure deterministic execution without DB/Groq).
 * Pipeline: normalizeQuestion -> extractFilters -> isReceiptQuestion -> classifyIntent
 * ============================================================================
 */
import { SUPPORTED_INTENTS, CONFIDENCE_ENUMS } from './supportedIntents.js';
import { normalizeQuestion } from './normalizeQuestion.js';
import { extractFilters } from './extractFilters.js';
import { askReceiptlyResultSchema } from '../../validators/askReceiptly.validator.js';

// Receipt domain keywords for isReceiptQuestion guard
const RECEIPT_DOMAIN_KEYWORDS = [
  'spend', 'spent', 'spending', 'expense', 'expenses', 'cost', 'costs',
  'paid', 'pay', 'purchase', 'purchases', 'bought', 'buy', 'shopping',
  'receipt', 'receipts', 'bill', 'bills', 'invoice', 'invoices', 'warranty',
  'warranties', 'merchant', 'merchants', 'category', 'categories', 'total',
  'average', 'biggest', 'smallest', 'highest', 'lowest', 'recent', 'latest',
  'vault', 'how much', 'how many', 'count', 'breakdown', 'show', 'list', 'find'
];

// Non-receipt domain topics & prompt injection patterns to explicitly reject
const NON_RECEIPT_TOPICS = [
  'elon musk', 'react', 'python', 'javascript', 'weather', 'stock', 'stocks',
  'crypto', 'bitcoin', 'joke', 'world cup', 'code', 'algorithm', 'dsa', 'news',
  'movie', 'song', 'president', 'capital of', 'translate',
  'ignore previous', 'system prompt', 'api key', 'api keys', 'secret key', 'override instructions'
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

  // Must contain at least one receipt domain keyword
  return RECEIPT_DOMAIN_KEYWORDS.some((kw) => normalizedQuestion.includes(kw));
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
  else if (normalized.includes('top category') || normalized.includes('highest category') || normalized.includes('most category')) {
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
  } else if (normalized.includes('breakdown') || normalized.includes('distribution')) {
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
