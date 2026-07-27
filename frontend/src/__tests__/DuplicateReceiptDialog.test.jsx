import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DuplicateReceiptDialog } from '../components/receipt/DuplicateReceiptDialog';

describe('DuplicateReceiptDialog Modal', () => {
  const mockCandidate = {
    id: 'receipt-123',
    title: 'MacBook Air M2',
    merchant: 'Apple Store',
    amount: 114900,
    currency: 'INR',
    purchaseDate: '2026-05-20',
    invoiceNumber: 'INV-888',
  };

  it('renders modal with candidate receipt info and action buttons', () => {
    render(
      <DuplicateReceiptDialog
        isOpen={true}
        candidate={mockCandidate}
        onContinue={vi.fn()}
        onViewExisting={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Similar Receipt Found')).toBeInTheDocument();
    expect(screen.getByText('MacBook Air M2')).toBeInTheDocument();
    expect(screen.getByText('Apple Store')).toBeInTheDocument();
    expect(screen.getByText('Continue Upload')).toBeInTheDocument();
    expect(screen.getByText('View Existing')).toBeInTheDocument();
  });

  it('triggers onContinue callback when Continue Upload is clicked', () => {
    const handleContinue = vi.fn();
    render(
      <DuplicateReceiptDialog
        isOpen={true}
        candidate={mockCandidate}
        onContinue={handleContinue}
        onViewExisting={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Continue Upload'));
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });
});
