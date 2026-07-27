import { checkDuplicateInputSchema } from '../validators/duplicateReceipt.validator.js';
import { checkDuplicateReceipt } from '../services/duplicateReceipt.service.js';

export const checkDuplicate = async (req, res, next) => {
  try {
    const validatedData = checkDuplicateInputSchema.parse(req.body);
    const result = await checkDuplicateReceipt(req.user.id, validatedData);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
