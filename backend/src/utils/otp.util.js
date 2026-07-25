import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt() — never Math.random().
 */
export const generateOtp = () => {
  return randomInt(100000, 999999).toString();
};

/**
 * Hash an OTP using bcrypt before storing in the database.
 * Uses the same salt rounds as password hashing for consistency.
 */
export const hashOtp = async (otp) => {
  return bcrypt.hash(otp, 10);
};

/**
 * Verify a plaintext OTP against a bcrypt hash.
 */
export const verifyOtp = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};
