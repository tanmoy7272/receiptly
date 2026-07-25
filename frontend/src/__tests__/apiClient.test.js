import { describe, it, expect, vi } from 'vitest';
import { apiClient, setUnauthorizedHandler } from '../services/apiClient';

describe('Frontend API Client & Interceptors', () => {
  it('triggers 401 unauthorized handler on 401 response status', async () => {
    const mockUnauthorizedHandler = vi.fn();
    setUnauthorizedHandler(mockUnauthorizedHandler);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized session' }),
    });

    await expect(apiClient('/dashboard')).rejects.toThrow('Unauthorized session');
    expect(mockUnauthorizedHandler).toHaveBeenCalledWith('Your session has expired. Please sign in again.');
  });

  it('formats network connection errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiClient('/receipts')).rejects.toThrow(
      "We couldn't connect right now. Please check your internet connection and try again."
    );
  });
});
