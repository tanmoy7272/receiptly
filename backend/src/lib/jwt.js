import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const COOKIE_NAME = 'receiptly_token';
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  secure: config.nodeEnv === 'production',
  maxAge: SEVEN_DAYS_MS,
  path: '/',
});

export const signToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
};

export const clearAuthCookie = (res) => {
  const options = getCookieOptions();
  delete options.maxAge;
  res.clearCookie(COOKIE_NAME, options);
};
