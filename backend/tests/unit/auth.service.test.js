import { describe, it, expect, vi } from 'vitest';
import * as authService from '../../src/services/auth.service.js';
import prisma from '../../src/lib/prisma.js';

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Auth Service - User Scoping & Authentication Logic', () => {
  it('registers a new user and returns user object without password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'usr_123',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
    });

    const user = await authService.registerUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(user.id).toBe('usr_123');
    expect(user.email).toBe('john@example.com');
    expect(user.password).toBeUndefined();
  });

  it('throws an error if user email is already registered', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing_id', email: 'john@example.com' });

    await expect(
      authService.registerUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('An account with this email already exists.');
  });
});
