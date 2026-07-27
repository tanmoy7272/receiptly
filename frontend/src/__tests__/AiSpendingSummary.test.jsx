import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiSpendingSummary } from '../components/dashboard/AiSpendingSummary';
import { dashboardService } from '../services/dashboardService';

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getDashboardAiSummary: vi.fn(),
  },
}));

describe('AiSpendingSummary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary bullets when insights are enabled', async () => {
    dashboardService.getDashboardAiSummary.mockResolvedValueOnce({
      enabled: true,
      summary: [
        'Food remains your highest spending category.',
        'Spending increased by 10% this month.',
      ],
    });

    render(<AiSpendingSummary />);

    await waitFor(() => {
      expect(screen.getByText('Spending Insights')).toBeInTheDocument();
      expect(screen.getByText('Food remains your highest spending category.')).toBeInTheDocument();
      expect(screen.getByText('Spending increased by 10% this month.')).toBeInTheDocument();
    });
  });

  it('returns null and renders nothing when insights are disabled or error occurs', async () => {
    dashboardService.getDashboardAiSummary.mockResolvedValueOnce({
      enabled: false,
      summary: [],
    });

    const { container } = render(<AiSpendingSummary />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
