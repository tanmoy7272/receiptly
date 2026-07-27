import { getReceiptInsights } from '../services/receiptInsights.service.js';
import { HTTP_STATUS } from '../constants/index.js';

export const handleGetReceiptInsights = async (req, res) => {
  try {
    const result = await getReceiptInsights(req.params?.id, req.user?.id);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      enabled: Boolean(result?.enabled),
      insights: result?.insights || [],
    });
  } catch (error) {
    // Fail-safe wrapper: Always return 200 OK with enabled: false on error
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      enabled: false,
      insights: [],
    });
  }
};
