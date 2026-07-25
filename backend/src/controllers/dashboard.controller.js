import { getDashboardData } from '../services/dashboard.service.js';
import { HTTP_STATUS } from '../constants/index.js';

export const handleGetDashboard = async (req, res, next) => {
  try {
    const data = await getDashboardData(req.user.id);
    return res.status(HTTP_STATUS.OK).json({
      message: 'Dashboard data retrieved successfully.',
      ...data,
    });
  } catch (error) {
    next(error);
  }
};
