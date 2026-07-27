import * as pdfjsLib from 'pdfjs-dist/build/pdf.js';
import { createWorker } from 'tesseract.js';
import mammoth from 'mammoth';
import sharp from 'sharp';
import { logger } from './logger.js';

export const inspectPdfBuffer = async (buffer) => {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) return { text: '', numpages: 1 };
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useSystemFonts: true, isEvalSupported: false });
    const pdfDocument = await loadingTask.promise;
    const numpages = pdfDocument.numPages;

    let fullText = '';
    for (let i = 1; i <= numpages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return { text: fullText.trim(), numpages };
  } catch (err) {
    logger.warn('PDF Parse extraction warning:', err.message);
    return { text: '', numpages: 1 };
  }
};

let workerPromise = null;

const getOcrWorker = async () => {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_pageseg_mode: '3',
        tessedit_enable_dict_correction: '0',
      });
      return worker;
    })().catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
};

export const performLocalOCR = async (imageBuffer) => {
  try {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length < 100) {
      return null;
    }

    // Guard: Never pass PDF binary buffers to sharp/tesseract to prevent native C++ segfaults
    const magicHeader = imageBuffer.slice(0, 4).toString('utf-8');
    if (magicHeader.startsWith('%PDF')) {
      return null;
    }

    let bufferToProcess = imageBuffer;
    try {
      bufferToProcess = await sharp(imageBuffer)
        .rotate() // Auto-orient smartphone EXIF camera photos right-side up
        .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
        .grayscale() // Remove background color noise & shadows
        .normalize() // Stretch contrast: dark text on bright white background for dim/unclear receipts
        .sharpen() // Sharpen blurry character edges for maximum OCR clarity
        .toFormat('jpeg') // Normalize HEIC/PNG/WebP/BMP to JPEG for 100% OCR engine compatibility
        .toBuffer();
    } catch (sharpErr) {
      logger.warn('Sharp image preprocessing warning, using raw buffer:', sharpErr.message);
    }

    const worker = await getOcrWorker();
    const { data: { text } } = await worker.recognize(bufferToProcess);
    return text?.trim() || null;
  } catch (err) {
    logger.warn('Tesseract OCR image read warning:', err.message);
    workerPromise = null; // Reset worker promise on failure so next attempt re-initializes cleanly
    return null;
  }
};

export const extractDocumentText = async (fileBuffer, mimetype) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    return { type: 'image', content: null, numpages: 1 };
  }

  const cleanMime = (mimetype || '').toLowerCase();
  const isPdf = cleanMime.includes('pdf') || cleanMime.includes('octet-stream');

  // 1. Digital PDF Documents (Reads ALL pages & inspects page count)
  if (isPdf) {
    const { text, numpages } = await inspectPdfBuffer(fileBuffer);
    if (text && text.length >= 2) {
      logger.info(`Extracted ${text.length} characters across ${numpages} PDF page(s).`);
      return { type: 'text', content: text, numpages };
    }
    logger.warn(`PDF file (${numpages} page(s)) contains no readable plain text.`);
    return { type: 'pdf_scanned', content: null, numpages };
  }

  // 2. Word Documents (.docx)
  if (cleanMime.includes('word') || cleanMime.includes('officedocument') || cleanMime.includes('msword')) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      if (result?.value?.trim()) {
        return { type: 'text', content: result.value.trim(), numpages: 1 };
      }
    } catch (err) {
      logger.warn('Word document extraction warning:', err.message);
    }
  }

  // 3. Receipt Images / Photos (JPEG, PNG, WebP) -> Tesseract WASM OCR
  if (!isPdf) {
    const ocrText = await performLocalOCR(fileBuffer);
    if (ocrText && ocrText.length >= 2) {
      logger.info(`Tesseract OCR extracted ${ocrText.length} characters from image.`);
      return { type: 'text', content: ocrText, numpages: 1 };
    }
  }

  return { type: 'image', content: null, numpages: 1 };
};
