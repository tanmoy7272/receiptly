import {
  registerUser,
  loginUser,
  verifyEmailOtp,
  requestPasswordReset,
  resetPassword as resetPasswordService,
  resendOtp as resendOtpService,
  verifyResetOtp as verifyResetOtpService,
} from '../services/auth.service.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../lib/jwt.js';
import { AUTH_MESSAGES } from '../constants/messages.js';
import { verifySmtpConnection, sendTestEmail } from '../lib/email.js';

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);

    // New flow: user is created as unverified, OTP sent to email.
    // Do NOT issue a JWT here — user must verify email first.
    return res.status(201).json({
      message: AUTH_MESSAGES.VERIFICATION_EMAIL_SENT,
      requiresVerification: true,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const user = await verifyEmailOtp(req.body);
    const token = signToken({ userId: user.id });

    setAuthCookie(res, token);

    return res.status(200).json({
      message: AUTH_MESSAGES.EMAIL_VERIFIED,
      token,
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
      token,
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

export const forgotPassword = async (req, res, next) => {
  try {
    await requestPasswordReset(req.body);

    // Always return success to prevent email enumeration
    return res.status(200).json({
      message: AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyResetOtp = async (req, res, next) => {
  try {
    await verifyResetOtpService(req.body);

    return res.status(200).json({
      message: 'Verification code confirmed. Please set your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await resetPasswordService(req.body);

    return res.status(200).json({
      message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    await resendOtpService(req.body);

    // Always return success to prevent enumeration
    return res.status(200).json({
      message: AUTH_MESSAGES.OTP_RESENT,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Development-only endpoint to test SMTP connectivity.
 * Verifies the transporter can connect and optionally sends a test email.
 */
export const testSmtp = async (req, res, next) => {
  try {
    await verifySmtpConnection();

    const { to } = req.body || {};
    if (to) {
      await sendTestEmail(to);
      return res.status(200).json({
        message: `SMTP connection verified. Test email sent to ${to}.`,
      });
    }

    return res.status(200).json({
      message: 'SMTP connection verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};
