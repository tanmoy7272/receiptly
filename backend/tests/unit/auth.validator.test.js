import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../src/validators/auth.validator.js';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('passes valid registration data', () => {
      const input = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      };
      const result = registerSchema.parse(input);
      expect(result.email).toBe('jane@example.com');
    });

    it('rejects short passwords', () => {
      const input = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
      };
      expect(() => registerSchema.parse(input)).toThrow();
    });

    it('rejects invalid emails', () => {
      const input = {
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'Password123!',
      };
      expect(() => registerSchema.parse(input)).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('passes valid login credentials', () => {
      const input = {
        email: 'user@example.com',
        password: 'secretpassword',
      };
      const result = loginSchema.parse(input);
      expect(result.email).toBe('user@example.com');
    });

    it('rejects missing password', () => {
      expect(() => loginSchema.parse({ email: 'user@example.com' })).toThrow();
    });
  });
});
