import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '../components/ui/EmptyState';

describe('EmptyState Component', () => {
  it('renders title, description, and action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No receipts found"
        description="Upload your first receipt to start tracking."
        primaryActionText="Upload Receipt"
        onPrimaryAction={handleAction}
      />
    );

    expect(screen.getByText('No receipts found')).toBeInTheDocument();
    expect(screen.getByText('Upload your first receipt to start tracking.')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Upload Receipt' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
