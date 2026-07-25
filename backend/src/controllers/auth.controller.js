import { registerUser, loginUser } from '../services/auth.service.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../lib/jwt.js';
import { AUTH_MESSAGES } from '../constants/messages.js';

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    const token = signToken({ userId: user.id });
    
    setAuthCookie(res, token);

    return res.status(201).json({
      message: AUTH_MESSAGES.REGISTER_SUCCESS,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await loginUser(req.body);
    const token = signToken({ userId: user.id });

    setAuthCookie(res, token);

    return res.status(200).json({
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    return res.status(200).json({
      message: AUTH_MESSAGES.LOGOUT_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: AUTH_MESSAGES.USER_RETRIEVED,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
