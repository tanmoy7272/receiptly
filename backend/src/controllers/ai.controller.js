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

    // 10-Second Upstream AI Timeout (HTTP 504 Gateway Timeout)
    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => {
        const timeoutErr = new Error("We couldn't automatically read this receipt within 10 seconds.");
        timeoutErr.statusCode = 504; // 504 Gateway Timeout for upstream AI
        reject(timeoutErr);
      }, 10000);
    });

    const extractionResult = await Promise.race([
      parseReceiptWithAI(tempReceipt),
      timeoutPromise,
    ]);

    return res.status(HTTP_STATUS.OK).json({
      message: 'File extracted with AI successfully.',
      extraction: extractionResult,
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
