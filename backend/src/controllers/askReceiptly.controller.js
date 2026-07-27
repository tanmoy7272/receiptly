/**
 * ============================================================================
 * Ask Receiptly Express Controller
 * ============================================================================
 * Purpose: Thin controller validating incoming questions and orchestrating the
 *          pipeline via askReceiptlyService.
 * ============================================================================
 */
import { askReceiptlyRequestSchema } from '../validators/askReceiptlyRequest.validator.js';
import { processUserQuestion } from '../services/askReceiptly.service.js';

/**
 * Handles POST /api/v1/ask endpoint requests
 */
export const handleAskReceiptly = async (req, res, next) => {
  try {
    const { question } = askReceiptlyRequestSchema.parse(req.body);
    const userId = req.user.id;

    const result = await processUserQuestion({ userId, question });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
