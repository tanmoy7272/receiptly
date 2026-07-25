import { apiClient } from './apiClient';

const buildFormData = (payload) => {
  if (payload instanceof FormData) return payload;
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  return formData;
};

export const receiptService = {
  getReceipts: async (queryParams = {}, signal) => {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const endpoint = `/receipts${queryString ? `?${queryString}` : ''}`;

    return apiClient(endpoint, { method: 'GET', signal });
  },

  getReceiptById: (id) => apiClient(`/receipts/${id}`, { method: 'GET' }),

  createReceipt: (payload) =>
    apiClient('/receipts', {
      method: 'POST',
      body: buildFormData(payload),
    }),

  updateReceipt: (id, payload) =>
    apiClient(`/receipts/${id}`, {
      method: 'PUT',
      body: buildFormData(payload),
    }),

  deleteReceipt: (id) =>
    apiClient(`/receipts/${id}`, {
      method: 'DELETE',
    }),

  extractReceipt: (id) =>
    apiClient(`/ai/${id}/extract`, {
      method: 'POST',
    }),

  extractFileWithAI: async (fileFormData, customSignal) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await apiClient('/ai/extract-file', {
        method: 'POST',
        body: fileFormData,
        signal: customSignal || controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("We couldn't automatically read this receipt. You can continue by filling in the details manually.");
      }
      throw err;
    }
  },
};

export const extractReceiptFileAI = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await receiptService.extractFileWithAI(formData);
  return response.extraction?.data || {};
};
