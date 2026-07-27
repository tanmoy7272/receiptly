import { apiClient } from './apiClient';

export const dashboardService = {
  getDashboardData: (options = {}) =>
    apiClient('/dashboard', {
      method: 'GET',
      ...options,
    }),

  getDashboardAiSummary: (options = {}) =>
    apiClient('/dashboard/insights', {
      method: 'GET',
      ...options,
    }),
};
