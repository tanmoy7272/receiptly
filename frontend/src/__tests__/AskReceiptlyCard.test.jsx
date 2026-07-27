import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AskReceiptlyCard } from '../components/ask/AskReceiptlyCard';
import { askReceiptlyService } from '../services/askReceiptlyService';

vi.mock('../services/askReceiptlyService', () => ({
  askReceiptlyService: {
    askQuestion: vi.fn(),
  },
}));

describe('AskReceiptlyCard Component (Prompt 4 UI)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Ask Receiptly card header, input, and suggestion chips', () => {
    render(<AskReceiptlyCard />);

    expect(screen.getByText('Ask Receiptly')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/How much did I spend on Swiggy/i)).toBeInTheDocument();
    expect(screen.getByText('How much did I spend this month?')).toBeInTheDocument();
  });

  it('submits question on Ask button click and renders AI answer', async () => {
    askReceiptlyService.askQuestion.mockResolvedValue({
      success: true,
      supported: true,
      answeredBy: 'ai',
      answer: 'You spent ₹4,380 at Swiggy this month across 14 receipts.',
    });

    render(<AskReceiptlyCard />);

    const input = screen.getByPlaceholderText(/How much did I spend on Swiggy/i);
    fireEvent.change(input, { target: { value: 'How much did I spend at Swiggy?' } });

    const submitBtn = screen.getByRole('button', { name: /Ask/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('You spent ₹4,380 at Swiggy this month across 14 receipts.')).toBeInTheDocument();
      expect(screen.getByText('✨ AI Formatted')).toBeInTheDocument();
    });
  });

  it('submits question when quick suggestion chip is clicked', async () => {
    askReceiptlyService.askQuestion.mockResolvedValue({
      success: true,
      supported: true,
      answeredBy: 'ai',
      answer: 'You have 3 active warranties in your vault.',
    });

    render(<AskReceiptlyCard />);

    const chip = screen.getByText('Show active warranties');
    fireEvent.click(chip);

    await waitFor(() => {
      expect(screen.getByText('You have 3 active warranties in your vault.')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    askReceiptlyService.askQuestion.mockRejectedValue(new Error('Network error'));

    render(<AskReceiptlyCard />);

    const input = screen.getByPlaceholderText(/How much did I spend on Swiggy/i);
    fireEvent.change(input, { target: { value: 'Total spend' } });

    const submitBtn = screen.getByRole('button', { name: /Ask/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Unable to reach Ask Receiptly assistant/i)).toBeInTheDocument();
    });
  });
});
