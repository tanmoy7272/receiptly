/**
 * ============================================================================
 * AI Document Extraction Service (Groq LLM Pipeline)
 * ============================================================================
 * Purpose: Routes extracted document text or Cloudinary page images to Groq SDK
 *          models (Llama 70B), enforcing JSON output schemas with safe fallbacks.
 * Flow: Controller -> extractDocumentText (OCR) -> AI Service -> Groq SDK -> Zod Validator
 * ============================================================================
 */
import Groq from 'groq-sdk';
import prisma from '../lib/prisma.js';
import { RECEIPT_CATEGORIES } from '../constants/receipts.js';
import { aiExtractionSchema } from '../validators/ai.validator.js';
import { logger } from '../utils/logger.js';
import { extractDocumentText } from '../utils/ocr.util.js';

const groqApiKey = process.env.GROQ_API_KEY;
const isGroqConfigured = Boolean(groqApiKey && groqApiKey !== 'gsk_your_groq_api_key_here');
const groq = isGroqConfigured ? new Groq({ apiKey: groqApiKey }) : null;

// Configurable Groq Models via Environment Variables
const TEXT_MODEL = process.env.GROQ_MODEL || process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile';
const VISION_MODEL = process.env.GROQ_MODEL || process.env.GROQ_VISION_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `
You are an enterprise financial document extraction model for Receiptly designed to output valid JSON.
Analyze all pages of the user's receipt document and extract structured JSON data.

RULES FOR EXTRACTION:
1. title: Scan ALL pages of the document to identify the main physical product or primary service item description purchased (e.g. "Apple iPhone 14 Pro", "FIAMA Gel Bathing Bar Grand Celebration Pack").
   - If an order contains multiple items or separate service/delivery invoices (e.g., Platform Fee, GT Charges, Delivery Charges), ignore auxiliary fee lines and select the primary highest-value physical product purchased across the document pages, or combine main product names if equal.
   - NEVER name the receipt "Platform Fee", "GT Charges", "Delivery Charge", "Tax Invoice", or the store name.
2. merchant: Official marketplace platform or primary vendor store name printed on the document (e.g. "Flipkart", "Amazon", "Swiggy", "Blinkit", "Reliance Digital", "Croma").
   - If the document is from a marketplace (e.g. Flipkart), prefer the main platform name "Flipkart" over obscure third-party seller names.
3. amount: Extract the FINAL NET GRAND TOTAL AMOUNT PAID as a plain numeric float.
   - For multi-page order bundles under a single Order ID where costs are itemized across pages (e.g. product price + platform fee + GT charges), calculate or extract the full net total paid for the entire order across all pages.
   - Do NOT select small individual delivery fee subtotals or tax components.
4. currency: 3-letter currency code (default "INR").
5. purchaseDate: Search specifically inside document headers for "Invoice Date", "Order Date", "Billing Date", "Date of Issue", or "Transaction Date". Format strictly as YYYY-MM-DD.
6. category: Exactly one of: [${RECEIPT_CATEGORIES.map((c) => `"${c}"`).join(', ')}].
7. invoiceNumber: Primary Order ID (e.g. "OD438060927150219100"), Invoice Number, or Tax ID printed on the document.
8. warranty: Set warrantyMonths, warrantyExpiryDate, and warrantySource to NULL/NONE UNLESS warranty coverage is explicitly printed on the document.

RETURN ONLY VALID JSON MATCHING THIS SCHEMA:
{
  "version": 1,
  "success": true,
  "data": {
    "title": { "value": "<STRING: Primary Product Title>" },
    "merchant": { "value": "<STRING: Vendor Store Name>" },
    "amount": { "value": 0.0 },
    "currency": { "value": "INR" },
    "purchaseDate": { "value": "YYYY-MM-DD" },
    "category": { "value": "Shopping" },
    "notes": { "value": null },
    "invoiceNumber": { "value": "<STRING: Invoice or Order ID>" },
    "warrantyMonths": { "value": null },
    "warrantyExpiryDate": { "value": null },
    "warrantySource": { "value": "NONE" }
  }
}
`;

const getVisionUrls = (fileUrl, fileType, numpages = 1) => {
  if (!fileUrl) return [];
  const isPdf = fileType?.includes('pdf') || /\.pdf$/i.test(fileUrl);
  if (!isPdf) return [fileUrl];

  const cleanUrl = fileUrl.replace(/\.pdf$/i, '.jpg');
  if (!cleanUrl.includes('/upload/')) return [cleanUrl];

  // Construct URLs only for pages that actually exist in the PDF (max 3)
  const maxPagesToFetch = Math.min(Math.max(1, numpages), 3);
  const urls = [];
  for (let i = 1; i <= maxPagesToFetch; i++) {
    urls.push(cleanUrl.replace('/upload/', `/upload/f_jpg,pg_${i}/`));
  }
  return urls;
};

export const parseReceiptWithAI = async (receipt) => {
  const isPersisted = Boolean(receipt.id && !String(receipt.id).startsWith('temp_'));

  const makeFallback = () => ({
    version: 1,
    success: true,
    data: {
      title: { value: receipt.title || 'Receipt Document', confidence: 0.8 },
      merchant: { value: receipt.merchant || 'Store Vendor', confidence: 0.8 },
      amount: { value: Number(receipt.amount) || 0, confidence: 0.8 },
      currency: { value: receipt.currency || 'INR', confidence: 0.9 },
      purchaseDate: { value: null, confidence: 0 },
      category: { value: receipt.category || 'Other', confidence: 0.85 },
      notes: { value: null, confidence: 0 },
      invoiceNumber: { value: null, confidence: 0 },
      warrantyMonths: { value: null, confidence: 0 },
      warrantyExpiryDate: { value: null, confidence: 0 },
      warrantySource: { value: 'NONE', confidence: 0 },
    },
  });

  if (!groq) return makeFallback();

  if (isPersisted) {
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { aiExtractionStatus: 'PROCESSING' },
    });
  }

  let fileBuffer = receipt.fileBuffer;
  if ((!fileBuffer || !Buffer.isBuffer(fileBuffer)) && receipt.fileUrl) {
    try {
      const res = await fetch(receipt.fileUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuf);
      }
    } catch (err) {
      logger.warn(`Failed to fetch buffer from fileUrl (${receipt.fileUrl}):`, err.message);
    }
  }

  // 1. Document Text Extraction Across ALL Pages
  const extractedDoc = await extractDocumentText(fileBuffer, receipt.fileType);
  const docText = extractedDoc.content || '';
  const numpages = extractedDoc.numpages || 1;
  const isTextDoc = extractedDoc.type === 'text' && docText.length >= 10;

  let messages = [];
  let modelToUse = TEXT_MODEL;

  if (isTextDoc) {
    logger.info(`Routing ${receipt.title} (${docText.length} chars across ${numpages} page(s)) to 70B Text Model.`);
    messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Analyze all pages of this document text and extract receipt details:\n\n${docText.slice(0, 8000)}` },
    ];
  } else {
    modelToUse = VISION_MODEL;
    const visionUrls = getVisionUrls(receipt.fileUrl, receipt.fileType, numpages);

    if (visionUrls.length > 0) {
      logger.info(`Routing ${receipt.title} (${visionUrls.length} page image(s) for ${numpages} PDF page(s)) to Active Vision Model (${VISION_MODEL}).`);
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Scan all ${visionUrls.length} page image(s) of this invoice document and return valid JSON containing the main product item purchased, net grand total amount, merchant name, purchase date, and invoice number.` },
            ...visionUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
          ],
        },
      ];
    } else if (receipt.fileBuffer && Buffer.isBuffer(receipt.fileBuffer) && !receipt.fileType?.includes('pdf')) {
      const mime = receipt.fileType || 'image/jpeg';
      const base64Url = `data:${mime};base64,${receipt.fileBuffer.toString('base64')}`;
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract receipt details from this document image.' },
            { type: 'image_url', image_url: { url: base64Url } },
          ],
        },
      ];
    } else {
      logger.warn(`No text or vision URLs available for "${receipt.title}". Returning fallback.`);
      return makeFallback();
    }
  }

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model: modelToUse,
      temperature: 0.0,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content?.trim() || '';
    const cleanJsonText = responseContent.replace(/```json|```/g, '').replace(/```/g, '').trim();

    const parsedResult = aiExtractionSchema.parse(JSON.parse(cleanJsonText));

    logger.info(`Groq Extraction Completed (${modelToUse}) for ${receipt.title}: Merchant="${parsedResult.data.merchant?.value}", Title="${parsedResult.data.title?.value}", Amount=${parsedResult.data.amount?.value}, Date=${parsedResult.data.purchaseDate?.value}`);

    if (isPersisted) {
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { aiExtractionStatus: 'COMPLETED' },
      });
    }

    return parsedResult;
  } catch (error) {
    logger.warn(`Groq Extraction (${modelToUse}) fallback:`, error.message);

    if (isPersisted) {
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { aiExtractionStatus: 'FAILED' },
      });
    }

    return makeFallback();
  }
};
