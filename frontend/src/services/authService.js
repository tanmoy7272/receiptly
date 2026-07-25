import { apiClient } from './apiClient';

export const authService = {
  register: (userData) =>
    apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiClient('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    apiClient('/auth/me', {
      method: 'GET',
    }),

  verifyEmail: ({ email, otp }) =>
    apiClient('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  forgotPassword: ({ email }) =>
    apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetOtp: ({ email, otp }) =>
    apiClient('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resetPassword: ({ email, otp, newPassword }) =>
    apiClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  resendOtp: ({ email, purpose }) =>
    apiClient('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    }),
};
