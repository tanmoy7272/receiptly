/**
 * ============================================================================
 * Ask Receiptly Fallback Answers Central Registry
 * ============================================================================
 * Purpose: Centralizes deterministic, zero-AI fallback responses for unsupported
 *          queries, empty datasets, disabled AI features, and rate limit bounds.
 * ============================================================================
 */

export const getUnsupportedAnswer = () => ({
  success: true,
  answer: "I can help answer questions about your receipts, spending totals, merchants, categories, and invoices.",
  answeredBy: 'fallback',
});

export const getEmptyResultAnswer = (intent = '', filters = {}) => {
  if (filters.query) {
    return {
      success: true,
      answer: `I couldn't find any receipts matching "${filters.query}".`,
      answeredBy: 'fallback',
    };
  }

  if (filters.merchant) {
    return {
      success: true,
      answer: `I couldn't find any receipts for ${filters.merchant}.`,
      answeredBy: 'fallback',
    };
  }

  if (filters.category) {
    return {
      success: true,
      answer: `I couldn't find any receipts under the ${filters.category} category.`,
      answeredBy: 'fallback',
    };
  }

  if (intent.includes('WARRANTY') || intent.includes('WARRANTIES')) {
    return {
      success: true,
      answer: 'No matching active or expiring warranties were found.',
      answeredBy: 'fallback',
    };
  }

  if (intent.includes('INVOICE')) {
    return {
      success: true,
      answer: 'No matching receipt with that invoice number was found.',
      answeredBy: 'fallback',
    };
  }

  return {
    success: true,
    answer: "I couldn't find any matching receipts for that request.",
    answeredBy: 'fallback',
  };
};

export const getDisabledAnswer = () => ({
  success: true,
  answer: 'AI assistance features are currently disabled. You can browse your receipts directly on your dashboard.',
  answeredBy: 'fallback',
});

export const getRateLimitedAnswer = () => ({
  success: true,
  answer: 'You have reached the temporary AI limit. Please wait a minute before asking another question.',
  answeredBy: 'fallback',
});
