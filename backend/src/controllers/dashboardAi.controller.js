import { getDashboardAiSummary } from '../services/dashboardAi.service.js';
import { HTTP_STATUS } from '../constants/index.js';

export const handleGetDashboardAiSummary = async (req, res) => {
  try {
    const result = await getDashboardAiSummary(req.user?.id);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      enabled: Boolean(result?.enabled),
      summary: result?.summary || [],
    });
  } catch (error) {
    // Fail-safe wrapper: Always return 200 OK with enabled: false on error
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      enabled: false,
      summary: [],
    });
  }
};
