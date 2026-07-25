/**
 * ============================================================================
 * Centralized API Fetch Client Wrapper
 * ============================================================================
 * Purpose: Standard HTTP request wrapper around native `fetch`, automatically
 *          handling credentials (`include`), Content-Type headers, HTTP 401
 *          session expiry callbacks, and human-friendly error mapping.
 * Architecture Flow: Service Layer -> apiClient -> native fetch -> Backend API
 * ============================================================================
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let onUnauthorizedCallback = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorizedCallback = handler;
};

const getErrorMessage = (data) => {
  const message = data?.message || data?.error?.message;

  if (!message || message.includes('500') || message.includes('Internal Server Error')) {
    return 'Something went wrong on our side. Please try again in a moment.';
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return "We couldn't connect right now. Please check your internet connection and try again.";
  }
  return message;
};

export const apiClient = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('receiptly_token') : null;
  if (storedToken) {
    defaultHeaders['Authorization'] = `Bearer ${storedToken}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        const isAuthRoute = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
        if (!isAuthRoute && onUnauthorizedCallback) {
          onUnauthorizedCallback('Your session has expired. Please sign in again.');
        }
      }

      throw new Error(getErrorMessage(data));
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("We couldn't connect right now. Please check your internet connection and try again.");
    }
    throw error;
  }
};
