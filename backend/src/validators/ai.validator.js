import { z } from 'zod';
import { RECEIPT_CATEGORIES } from '../constants/receipts.js';

const normalizeToISODate = (val) => {
  if (!val || typeof val !== 'string') return null;
  const str = val.trim();

  // 1. Matches YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. Matches DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 3. Standard JS Date parse fallback
  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) {
    return null;
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fieldConfidenceSchema = (valueSchema) =>
  z.object({
    value: valueSchema.nullable().optional(),
    confidence: z.number().min(0).max(1).nullable().optional().default(0.85),
  });

export const aiExtractionSchema = z.object({
  version: z.number().default(1),
  success: z.boolean().default(true),
  data: z.object({
    title: fieldConfidenceSchema(z.string().trim()),
    merchant: fieldConfidenceSchema(z.string().trim()),
    amount: fieldConfidenceSchema(
      z.preprocess((val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) : val), z.number().nonnegative())
    ),
    currency: fieldConfidenceSchema(z.string().trim().default('INR')),
    purchaseDate: fieldConfidenceSchema(
      z.preprocess((val) => normalizeToISODate(val), z.string().nullable().optional())
    ),
    category: fieldConfidenceSchema(
      z.preprocess(
        (val) => (typeof val === 'string' && RECEIPT_CATEGORIES.includes(val.trim()) ? val.trim() : 'Other'),
        z.string().default('Other')
      )
    ),
    notes: fieldConfidenceSchema(z.string().trim().nullable().optional()).optional(),
    // Phase A Optional Fields
    invoiceNumber: fieldConfidenceSchema(z.string().trim()).optional(),
    warrantyMonths: fieldConfidenceSchema(
      z.preprocess((val) => (val !== undefined && val !== null && val !== '' ? parseInt(String(val), 10) : null), z.number().int().nonnegative().nullable().optional())
    ).optional(),
    warrantyExpiryDate: fieldConfidenceSchema(
      z.preprocess((val) => normalizeToISODate(val), z.string().nullable().optional())
    ).optional(),
    warrantySource: fieldConfidenceSchema(z.string().trim()).optional(),
  }),
});
