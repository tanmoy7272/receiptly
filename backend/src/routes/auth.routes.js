import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendOtp,
  testSmtp,
} from '../controllers/auth.controller.js';
import {
  validateRequest,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendOtpSchema,
} from '../validators/auth.validator.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { config } from '../config/env.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

// Email verification & password recovery
router.post('/verify-email', validateRequest(verifyOtpSchema), verifyEmail);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/verify-reset-otp', validateRequest(verifyOtpSchema), verifyResetOtp);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.post('/resend-otp', validateRequest(resendOtpSchema), resendOtp);

// Development-only SMTP test endpoint
if (config.nodeEnv !== 'production') {
  router.post('/test-smtp', testSmtp);
}

export default router;
