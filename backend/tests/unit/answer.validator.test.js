import { describe, it, expect } from 'vitest';
import { askReceiptlyAnswerSchema } from '../../src/ai/answer/answer.validator.js';

describe('Ask Receiptly Answer Validator (Prompt 3)', () => {
  it('should validate valid conversational answers', () => {
    const res = askReceiptlyAnswerSchema.parse({
      answer: 'You spent ₹4,380 at Swiggy this month across 14 receipts.',
    });
    expect(res.answer).toBe('You spent ₹4,380 at Swiggy this month across 14 receipts.');
  });

  it('should reject answers exceeding 400 characters', () => {
    const longString = 'A'.repeat(401);
    expect(() => askReceiptlyAnswerSchema.parse({ answer: longString })).toThrow(
      'Answer must be 400 characters or fewer'
    );
  });

  it('should reject markdown code blocks and raw JSON syntax', () => {
    expect(() =>
      askReceiptlyAnswerSchema.parse({ answer: '```json\n{"answer": "test"}\n```' })
    ).toThrow('Answer must not contain markdown code blocks');
  });

  it('should reject robotic data intros like "Based on the provided data"', () => {
    expect(() =>
      askReceiptlyAnswerSchema.parse({ answer: 'Based on the provided data, you spent 500' })
    ).toThrow('Answer must not contain robotic data source intros');
  });

  it('should reject markdown bullet lists or headers', () => {
    expect(() =>
      askReceiptlyAnswerSchema.parse({ answer: '- Swiggy: ₹500\n- Zomato: ₹300' })
    ).toThrow('Answer must not contain markdown bullet points or headers');
  });
});
