import { apiClient } from './apiClient';

export const dashboardService = {
  getDashboardData: () =>
    apiClient('/dashboard', {
      method: 'GET',
    }),
};
