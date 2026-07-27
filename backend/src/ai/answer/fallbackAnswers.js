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
  answer: 'Receiptly can answer questions about your receipts, spending totals, merchants, categories, active warranties, and invoices.',
  answeredBy: 'fallback',
});

export const getEmptyResultAnswer = (intent = '', filters = {}) => {
  if (filters.query) {
    return {
      success: true,
      answer: `I couldn't find any receipts for "${filters.query}" in your vault.`,
      answeredBy: 'fallback',
    };
  }

  if (filters.merchant) {
    return {
      success: true,
      answer: `I couldn't find any receipts for ${filters.merchant} in your vault.`,
      answeredBy: 'fallback',
    };
  }

  if (intent.includes('WARRANTY') || intent.includes('WARRANTIES')) {
    return {
      success: true,
      answer: 'No matching active or expiring warranties were found in your receipt vault.',
      answeredBy: 'fallback',
    };
  }

  if (intent.includes('INVOICE')) {
    return {
      success: true,
      answer: 'No matching receipt with that invoice number was found in your vault.',
      answeredBy: 'fallback',
    };
  }

  return {
    success: true,
    answer: 'I couldn\'t find any matching receipts for that request in your vault.',
    answeredBy: 'fallback',
  };
};

export const getDisabledAnswer = () => ({
  success: true,
  answer: 'AI assistance features are currently disabled. You can browse your receipts directly in the vault.',
  answeredBy: 'fallback',
});

export const getRateLimitedAnswer = () => ({
  success: true,
  answer: 'You have reached the temporary AI limit. Please wait a minute before asking another question.',
  answeredBy: 'fallback',
});
