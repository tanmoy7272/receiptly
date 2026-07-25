export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'Registration successful.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logout successful.',
  USER_RETRIEVED: 'Current user retrieved successfully.',
  VERIFICATION_EMAIL_SENT: 'A verification code has been sent to your email address.',
  EMAIL_VERIFIED: 'Email verified successfully. You can now sign in.',
  OTP_RESENT: 'A new verification code has been sent to your email.',
  PASSWORD_RESET_EMAIL_SENT: 'If an account with that email exists, a reset code has been sent.',
  PASSWORD_RESET_SUCCESS: 'Password reset successful. You can now sign in with your new password.',
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_IN_USE: 'An account with this email already exists.',
  UNAUTHORIZED: 'Authentication required. Please sign in to your account.',
  INVALID_TOKEN: 'Your session has expired. Please sign in again.',
  USER_NOT_FOUND: 'User account not found.',
  VALIDATION_ERROR: 'Please check your inputs and try again.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before signing in. Check your inbox for the verification code.',
  INVALID_OTP: 'Invalid verification code. Please try again.',
  OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
  OTP_MAX_ATTEMPTS: 'Too many failed attempts. Please request a new verification code.',
  OTP_RESEND_COOLDOWN: 'Please wait before requesting a new code.',
  SMTP_NOT_CONFIGURED: 'Email service is not configured. Please contact support.',
};
