import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceiptInsights } from '../components/receipt/ReceiptInsights';
import { receiptService } from '../services/receiptService';

vi.mock('../services/receiptService', () => ({
  receiptService: {
    getReceiptInsights: vi.fn(),
  },
}));

describe('ReceiptInsights Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders insights bullets when insights are enabled', async () => {
    receiptService.getReceiptInsights.mockResolvedValueOnce({
      enabled: true,
      insights: [
        'Electronics purchase with active manufacturer warranty.',
        'Invoice number stored for future claims.',
      ],
    });

    render(<ReceiptInsights receiptId="receipt-123" />);

    await waitFor(() => {
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText('Electronics purchase with active manufacturer warranty.')).toBeInTheDocument();
      expect(screen.getByText('Invoice number stored for future claims.')).toBeInTheDocument();
    });
  });

  it('returns null and renders nothing when insights are disabled or error occurs', async () => {
    receiptService.getReceiptInsights.mockResolvedValueOnce({
      enabled: false,
      insights: [],
    });

    const { container } = render(<ReceiptInsights receiptId="receipt-123" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('aborts request gracefully on unmount', () => {
    receiptService.getReceiptInsights.mockReturnValue(new Promise(() => {}));

    const { unmount } = render(<ReceiptInsights receiptId="receipt-123" />);
    expect(() => unmount()).not.toThrow();
  });
});
