import { getHealthStatus } from '../services/health.service.js';
import { HTTP_STATUS } from '../constants/index.js';

export const checkHealth = (req, res, next) => {
  try {
    const healthData = getHealthStatus();
    return res.status(HTTP_STATUS.OK).json(healthData);
  } catch (error) {
    next(error);
  }
};
