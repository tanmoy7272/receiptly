import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import mammoth from 'mammoth';
import sharp from 'sharp';
import { logger } from './logger.js';

export const inspectPdfBuffer = async (buffer) => {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) return { text: '', numpages: 1 };
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse(uint8Array);
    const textResult = await parser.getText();
    const text = textResult?.text || '';
    const numpages = typeof textResult?.total === 'number' ? textResult.total : 1;
    await parser.destroy();
    return { text: text.trim(), numpages };
  } catch (err) {
    logger.warn('PDF Parse extraction warning:', err.message);
    return { text: '', numpages: 1 };
  }
};

export const performLocalOCR = async (imageBuffer) => {
  let worker = null;
  try {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length < 100) {
      return null;
    }

    let bufferToProcess = imageBuffer;
    try {
      bufferToProcess = await sharp(imageBuffer)
        .rotate() // Auto-orient smartphone EXIF camera photos right-side up
        .resize({ width: 1200, withoutEnlargement: true })
        .grayscale() // Remove background color noise & shadows
        .normalize() // Stretch contrast: dark text on bright white background for dim/unclear receipts
        .sharpen() // Sharpen blurry character edges for maximum OCR clarity
        .toFormat('jpeg') // Normalize HEIC/PNG/WebP/BMP to JPEG for 100% OCR engine compatibility
        .toBuffer();
    } catch (sharpErr) {
      logger.warn('Sharp image preprocessing warning, using raw buffer:', sharpErr.message);
    }

    worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: '11',
    });
    const { data: { text } } = await worker.recognize(bufferToProcess);
    return text?.trim() || null;
  } catch (err) {
    logger.warn('Tesseract OCR image read warning:', err.message);
    return null;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (err) {
        logger.warn('Tesseract worker termination warning:', err.message);
      }
    }
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
    // Image/Scanned PDF Fallback: Run Tesseract OCR on image buffer
    const ocrText = await performLocalOCR(fileBuffer);
    if (ocrText && ocrText.length >= 2) {
      logger.info(`Tesseract OCR extracted ${ocrText.length} characters from scanned PDF/image buffer.`);
      return { type: 'text', content: ocrText, numpages };
    }
    logger.warn(`PDF file (${numpages} page(s)) contains no readable text or OCR content.`);
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
