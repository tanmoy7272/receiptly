import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ReceiptCard } from '../components/receipt/ReceiptCard';

describe('ReceiptCard Tags Rendering', () => {
  it('renders up to 2 tag badges when tags are present on receipt', () => {
    const dummyReceipt = {
      id: 'receipt-1',
      title: 'MacBook Air',
      merchant: 'Apple',
      amount: 99900,
      currency: 'INR',
      purchaseDate: '2026-05-20',
      category: 'Shopping',
      tags: ['electronics', 'laptop', 'office'],
    };

    render(
      <BrowserRouter>
        <ReceiptCard receipt={dummyReceipt} onDelete={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('#electronics')).toBeInTheDocument();
    expect(screen.getByText('#laptop')).toBeInTheDocument();
    expect(screen.queryByText('#office')).not.toBeInTheDocument(); // Only first 2 rendered on card
  });
});
