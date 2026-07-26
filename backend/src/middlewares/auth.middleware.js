import { COOKIE_NAME, verifyToken } from '../lib/jwt.js';
import { getUserById } from '../services/auth.service.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const queryToken = req.query?.token;
    const token = req.cookies?.[COOKIE_NAME] || bearerToken || queryToken;

    if (!token) {
      return res.status(401).json({
        error: {
          message: ERROR_MESSAGES.UNAUTHORIZED,
          statusCode: 401,
        },
      });
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.userId);
    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode === 404 || error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          message: ERROR_MESSAGES.INVALID_TOKEN,
          statusCode: 401,
        },
      });
    }
    next(error);
  }
};
