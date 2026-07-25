import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('renders title, message, and action buttons when open', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Receipt?"
        message="Are you sure you want to delete this receipt?"
        confirmText="Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Delete Receipt?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this receipt?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('triggers onCancel when Escape key is pressed', () => {
    const handleCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Test message"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
