import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { ERROR_MESSAGES } from '../constants/messages.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.util.js';
import { sendOtpEmail } from '../lib/email.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ---------------------------------------------------------------------------
// Existing Functions (preserved, with minimal modifications)
// ---------------------------------------------------------------------------

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    if (existingUser.isVerified !== false) {
      const error = new Error(ERROR_MESSAGES.EMAIL_IN_USE);
      error.statusCode = 400;
      throw error;
    }

    // Unverified user exists: update name, password & generate fresh OTP
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const otp = generateOtp();
    const otpHashed = await hashOtp(otp);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: normalizedName,
        password: hashedPassword,
        otpHash: otpHashed,
        otpExpiry,
        otpPurpose: 'EMAIL_VERIFICATION',
        otpAttempts: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    sendOtpEmail(normalizedEmail, otp, 'EMAIL_VERIFICATION').catch((err) => {
      logger.error('Failed to send verification email during re-registration', err.stack || err.message);
    });

    return user;
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Generate and hash OTP for email verification
  const otp = generateOtp();
  const otpHashed = await hashOtp(otp);
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Save user as unverified with OTP
  const user = await prisma.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      otpHash: otpHashed,
      otpExpiry,
      otpPurpose: 'EMAIL_VERIFICATION',
      otpAttempts: 0,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Send verification email asynchronously (non-blocking — user is created & response returns immediately)
  sendOtpEmail(normalizedEmail, otp, 'EMAIL_VERIFICATION').catch((err) => {
    logger.error('Failed to send verification email during registration', err.message);
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    const error = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    error.statusCode = 401;
    throw error;
  }

  // Block login for unverified accounts
  if (!user.isVerified) {
    const error = new Error(ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const error = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    error.statusCode = 401;
    throw error;
  }

  // Return sanitized user object without password
  const { password: _, otpHash, otpExpiry, otpPurpose, otpAttempts, ...sanitizedUser } = user;
  return sanitizedUser;
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return user;
};

// ---------------------------------------------------------------------------
// New Functions: Email Verification
// ---------------------------------------------------------------------------

/**
 * Verify the email OTP submitted by the user.
 * Checks: user exists, OTP purpose matches, not expired, attempts limit, hash match.
 * On success: marks user verified and clears OTP fields.
 */
export const verifyEmailOtp = async ({ email, otp }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.isVerified) {
    // Don't reveal whether the account exists or is already verified
    const error = new Error(ERROR_MESSAGES.INVALID_OTP);
    error.statusCode = 400;
    throw error;
  }

  if (user.otpPurpose !== 'EMAIL_VERIFICATION' || !user.otpHash || !user.otpExpiry) {
    const error = new Error(ERROR_MESSAGES.INVALID_OTP);
    error.statusCode = 400;
    throw error;
  }

  // Check expiry
  if (new Date() > user.otpExpiry) {
    const error = new Error(ERROR_MESSAGES.OTP_EXPIRED);
    error.statusCode = 400;
    throw error;
  }

  // Check brute-force attempts
  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    // Invalidate the OTP entirely
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpiry: null, otpPurpose: null, otpAttempts: 0 },
    });
    const error = new Error(ERROR_MESSAGES.OTP_MAX_ATTEMPTS);
    error.statusCode = 429;
    throw error;
  }

  const isValid = await verifyOtp(otp, user.otpHash);

  if (!isValid) {
    // Increment attempt counter
    await prisma.user.update({
      where: { id: user.id },
      data: { otpAttempts: { increment: 1 } },
    });
    const error = new Error(ERROR_MESSAGES.INVALID_OTP);
    error.statusCode = 400;
    throw error;
  }

  // Success: mark verified and clear OTP fields
  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otpHash: null,
      otpExpiry: null,
      otpPurpose: null,
      otpAttempts: 0,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return verifiedUser;
};

// ---------------------------------------------------------------------------
// New Functions: Forgot Password
// ---------------------------------------------------------------------------

/**
 * Initiate password reset by generating an OTP and emailing it.
 * Always returns success to prevent email enumeration attacks.
 */
export const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always return success regardless of whether user exists (prevents enumeration)
  if (!user || !user.isVerified) {
    return;
  }

  const otp = generateOtp();
  const otpHashed = await hashOtp(otp);
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpHash: otpHashed,
      otpExpiry,
      otpPurpose: 'PASSWORD_RESET',
      otpAttempts: 0,
    },
  });

  // Send password reset email asynchronously (non-blocking — API responds immediately)
  sendOtpEmail(normalizedEmail, otp, 'PASSWORD_RESET').catch((err) => {
    logger.error('Failed to send password reset email', err.message);
  });
};

/**
 * Reset password after verifying the OTP.
 * Validates OTP, hashes new password, clears OTP fields.
 */
export const resetPassword = async ({ email, otp, newPassword }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    const error = new Error(ERROR_MESSAGES.INVALID_OTP);
    error.statusCode = 400;
    throw error;
  }

  if (user.otpPurpose !== 'PASSWORD_RESET' || !user.otpHash || !user.otpExpiry) {
    const error = new Error(ERROR_MESSAGES.INVALID_OTP);
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > user.otpExpiry) {
    const error = new Error(ERROR_MESSAGES.OTP_EXPIRED);
    error.statusCode = 400;
    throw error;
  }

  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpiry: null, otpPurpose: null, otpAttempts: 0 },
    });
    const error = new Error(ERROR_MESSAGES.OTP_MAX_ATTEMPTS);
    error.statusCode = 429;
    throw error;
  }

  const isValid = await verifyOtp(otp, user.otpHash);

  if (!isValid) {
    await prisma.user.update({
      where: { id: user.id },
      data: { otpAttempts: { increment: 1 } },
    });
    const error = new Error(ERROR_MESSAGES.INVALID_OTP);
    error.statusCode = 400;
    throw error;
  }

  // OTP verified — hash new password and update
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      otpHash: null,
      otpExpiry: null,
      otpPurpose: null,
      otpAttempts: 0,
    },
  });
};

// ---------------------------------------------------------------------------
// New Functions: Resend OTP
// ---------------------------------------------------------------------------

/**
 * Resend OTP with a 60-second cooldown enforced via otpExpiry timestamp.
 * The cooldown is calculated as: if (otpExpiry - OTP_EXPIRY_MINUTES + COOLDOWN) > now,
 * then the user must wait before requesting a new code.
 */
export const resendOtp = async ({ email, purpose }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Silent success for non-existent users (prevent enumeration)
  if (!user) return;

  // For email verification: user must be unverified
  if (purpose === 'EMAIL_VERIFICATION' && user.isVerified) return;

  // For password reset: user must be verified
  if (purpose === 'PASSWORD_RESET' && !user.isVerified) return;

  // Enforce cooldown: if OTP was generated less than COOLDOWN seconds ago, reject
  if (user.otpExpiry) {
    const otpCreatedAt = new Date(user.otpExpiry.getTime() - OTP_EXPIRY_MINUTES * 60 * 1000);
    const cooldownEnd = new Date(otpCreatedAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
    if (new Date() < cooldownEnd) {
      const error = new Error(ERROR_MESSAGES.OTP_RESEND_COOLDOWN);
      error.statusCode = 429;
      throw error;
    }
  }

  const otp = generateOtp();
  const otpHashed = await hashOtp(otp);
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpHash: otpHashed,
      otpExpiry,
      otpPurpose: purpose,
      otpAttempts: 0,
    },
  });

  // Send resend OTP email asynchronously (non-blocking — API responds immediately)
  sendOtpEmail(normalizedEmail, otp, purpose).catch((err) => {
    logger.error('Failed to resend OTP email', err.message);
  });
};
