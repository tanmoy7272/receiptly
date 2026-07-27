/**
 * ============================================================================
 * Ask Receiptly Filter Extractor
 * ============================================================================
 * Purpose: Extracts period enums, category matches, invoice numbers, and generic
 *          merchant phrase extractions from normalized question text.
 * ============================================================================
 */
import { PERIOD_ENUMS } from './supportedIntents.js';
import { RECEIPT_CATEGORIES } from '../../constants/receipts.js';

/**
 * Extracts structured query filters from normalized question text
 * @param {string} normalizedQuestion 
 * @returns {Object} Extracted filters object { period?, category?, invoiceNumber?, merchant? }
 */
export const extractFilters = (normalizedQuestion) => {
  const filters = {};

  if (!normalizedQuestion || typeof normalizedQuestion !== 'string') {
    return filters;
  }

  // 1. Period Extraction
  if (normalizedQuestion.includes('today')) {
    filters.period = PERIOD_ENUMS.TODAY;
  } else if (normalizedQuestion.includes('this week')) {
    filters.period = PERIOD_ENUMS.THIS_WEEK;
  } else if (normalizedQuestion.includes('this month')) {
    filters.period = PERIOD_ENUMS.THIS_MONTH;
  } else if (normalizedQuestion.includes('last month')) {
    filters.period = PERIOD_ENUMS.LAST_MONTH;
  } else if (normalizedQuestion.includes('this year')) {
    filters.period = PERIOD_ENUMS.THIS_YEAR;
  } else if (normalizedQuestion.includes('last year')) {
    filters.period = PERIOD_ENUMS.LAST_YEAR;
  } else if (normalizedQuestion.includes('all time') || normalizedQuestion.includes('overall')) {
    filters.period = PERIOD_ENUMS.ALL_TIME;
  }

  // 2. Category Extraction using RECEIPT_CATEGORIES single source of truth
  for (const cat of RECEIPT_CATEGORIES) {
    const catLower = cat.toLowerCase();
    if (normalizedQuestion.includes(catLower)) {
      filters.category = cat;
      break;
    }
  }

  // Common category synonyms mapping
  if (!filters.category) {
    if (normalizedQuestion.includes('dining') || normalizedQuestion.includes('restaurant') || normalizedQuestion.includes('eat') || normalizedQuestion.includes('food')) {
      filters.category = 'Food';
    } else if (normalizedQuestion.includes('flight') || normalizedQuestion.includes('hotel') || normalizedQuestion.includes('cab') || normalizedQuestion.includes('trip') || normalizedQuestion.includes('travel')) {
      filters.category = 'Travel';
    } else if (normalizedQuestion.includes('medicine') || normalizedQuestion.includes('hospital') || normalizedQuestion.includes('pharmacy') || normalizedQuestion.includes('medical')) {
      filters.category = 'Medical';
    } else if (normalizedQuestion.includes('clothes') || normalizedQuestion.includes('apparel') || normalizedQuestion.includes('shopping')) {
      filters.category = 'Shopping';
    } else if (normalizedQuestion.includes('electricity') || normalizedQuestion.includes('utility') || normalizedQuestion.includes('wifi') || normalizedQuestion.includes('bills')) {
      filters.category = 'Bills';
    }
  }

  // 3. Invoice Number Extraction (Regex for INV-123, IN-761, PF-90182, 26P9AGTC00000090)
  const invRegex = /\b(inv[-_#\s]?[a-z0-9]{1,25}|[a-z]{1,4}[-_#\s]?[0-9]{2,25}|[a-z0-9]{6,25})\b/gi;
  const matches = normalizedQuestion.match(invRegex);
  if (matches && (normalizedQuestion.includes('invoice') || normalizedQuestion.includes('bill no') || normalizedQuestion.includes('number') || normalizedQuestion.includes('find') || normalizedQuestion.includes('search'))) {
    const validInv = matches.find(
      (m) => !['invoice', 'number', 'bill', 'receipt', 'spending', 'expenses', 'search', 'find'].includes(m.toLowerCase())
    );
    if (validInv) {
      filters.invoiceNumber = validInv.toUpperCase().replace(/\s+/g, '-');
    }
  }

  // 4. Generic Merchant Phrase Extraction (Dynamic phrase extraction without hardcoded vendor lists)
  // Regex Explanation: Matches phrases like "spent on Swiggy" or "from Amazon" and extracts vendor name into match[1]
  const stopWords = [
    'my', 'total', 'all', 'spending', 'expenses', 'cost', 'purchases', 'receipts', 'bills',
    'food', 'travel', 'shopping', 'medical', 'groceries', 'education', 'other',
    'this', 'last', 'today', 'the', 'a', 'an', 'in', 'for', 'overall', 'month', 'year'
  ];

  const merchantPatterns = [
    /\b(?:spent|spend|spending|expenses?|cost|paid|bought|purchases?)\b\s+\b(?:on|at|for|from|with)\b\s+([a-z0-9\s&'-]+?)(?:\s+this|\s+last|\s+today|\s+in|\s+for|\?|$)/i,
    /\b(?:from|at|on|with)\b\s+([a-z0-9\s&'-]+?)(?:\s+receipts?|\s+purchases?|\s+bills?|\s+expenses?|\s+this|\s+last|\?|$)/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = normalizedQuestion.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const candidateLower = candidate.toLowerCase();
      if (
        candidate &&
        candidate.length >= 2 &&
        !stopWords.includes(candidateLower) &&
        !RECEIPT_CATEGORIES.some((c) => c.toLowerCase() === candidateLower)
      ) {
        filters.merchant = candidate
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        break;
      }
    }
  }

  // 5. Generic Item / Product Search Query Extraction
  // Regex Explanation: Matches phrases like "did I buy saree?" or "show coffee receipts" and extracts item name into match[1]
  if (!filters.merchant && !filters.category && !filters.invoiceNumber && !normalizedQuestion.includes('warranty') && !normalizedQuestion.includes('warranties')) {
    const itemPatterns = [
      /\b(?:did i|have i|did we|have we)\s+(?:buy|bought|purchase|purchased|get|have)\s+(?:(?:any|a|an)\b\s+)?([a-z0-9\s&'-]+?)(?:\s+receipts?|\s+purchases?|\s+bills?|\s+this|\s+last|\?|$)/i,
      /\b(?:show|find|search|get|list|check)\s+(?:(?:any|a|an)\b\s+)?([a-z0-9\s&'-]+?)(?:\s+receipts?|\s+purchases?|\s+bills?|\s+expenses?|\?|$)/i,
      /\b(?:bought|buy|purchased|purchase)\s+(?:(?:any|a|an)\b\s+)?([a-z0-9\s&'-]+?)(?:\s+receipts?|\s+purchases?|\s+bills?|\?|$)/i,
    ];

    for (const pattern of itemPatterns) {
      const match = normalizedQuestion.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim().toLowerCase();
        if (
          candidate &&
          candidate.length >= 2 &&
          !stopWords.includes(candidate) &&
          !RECEIPT_CATEGORIES.some((c) => c.toLowerCase() === candidate)
        ) {
          filters.query = candidate;
          break;
        }
      }
    }
  }

  return filters;
};
