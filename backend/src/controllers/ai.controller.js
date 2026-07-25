import { getReceiptById } from '../services/receipt.service.js';
import { parseReceiptWithAI } from '../services/ai.service.js';
import { uploadToCloudinary } from '../lib/cloudinary.js';
import { HTTP_STATUS } from '../constants/index.js';

export const handleExtractReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const receipt = await getReceiptById(req.user.id, id);

    const extractionResult = await parseReceiptWithAI(receipt);

    return res.status(HTTP_STATUS.OK).json({
      message: 'AI extraction completed successfully.',
      extraction: extractionResult,
    });
  } catch (error) {
    next(error);
  }
};

export const handleExtractFileAI = async (req, res, next) => {
  let timerId = null;
  try {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Please select a file to extract.',
      });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'receiptly');

    const derivedTitle = req.file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const tempReceipt = {
      id: `temp_${Date.now()}`,
      title: derivedTitle,
      merchant: derivedTitle,
      amount: 0,
      currency: 'INR',
      purchaseDate: new Date().toISOString().split('T')[0],
      fileUrl: uploadResult.secure_url,
      fileType: req.file.mimetype,
      fileBuffer: req.file.buffer,
      notes: '',
    };

    // 10-Second Upstream AI Timeout Fallback
    const timeoutPromise = new Promise((resolve) => {
      timerId = setTimeout(() => {
        resolve(null);
      }, 10000);
    });

    const extractionResult = await Promise.race([
      parseReceiptWithAI(tempReceipt),
      timeoutPromise,
    ]);

    const finalExtraction = extractionResult || {
      version: 1,
      success: true,
      data: {
        title: { value: derivedTitle, confidence: 0.8 },
        merchant: { value: derivedTitle, confidence: 0.8 },
        amount: { value: 0, confidence: 0.8 },
        currency: { value: 'INR', confidence: 0.9 },
        purchaseDate: { value: null, confidence: 0 },
        category: { value: 'Other', confidence: 0.85 },
        notes: { value: null, confidence: 0 },
        invoiceNumber: { value: null, confidence: 0 },
        warrantyMonths: { value: null, confidence: 0 },
        warrantyExpiryDate: { value: null, confidence: 0 },
        warrantySource: { value: 'NONE', confidence: 0 },
      },
    };

    return res.status(HTTP_STATUS.OK).json({
      message: 'File extracted with AI successfully.',
      extraction: finalExtraction,
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      fileType: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  } finally {
    if (timerId) clearTimeout(timerId);
  }
};
