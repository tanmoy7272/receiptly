import {
  createReceipt,
  getUserReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  getReceiptFileStream,
} from '../services/receipt.service.js';
import { createReceiptSchema, updateReceiptSchema } from '../validators/receipt.validator.js';
import { receiptSearchQuerySchema } from '../validators/receiptSearch.validator.js';
import { HTTP_STATUS } from '../constants/index.js';

export const handleCreateReceipt = async (req, res, next) => {
  try {
    const validatedData = createReceiptSchema.parse(req.body);
    const receipt = await createReceipt(req.user.id, validatedData, req.file);

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Receipt uploaded successfully.',
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetReceipts = async (req, res, next) => {
  try {
    const validatedQuery = receiptSearchQuerySchema.parse(req.query);
    const result = await getUserReceipts(req.user.id, validatedQuery);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Receipts retrieved successfully.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetReceiptById = async (req, res, next) => {
  try {
    const receipt = await getReceiptById(req.user.id, req.params.id);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Receipt retrieved successfully.',
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateReceipt = async (req, res, next) => {
  try {
    const validatedData = updateReceiptSchema.parse(req.body);
    const receipt = await updateReceipt(req.user.id, req.params.id, validatedData, req.file);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Receipt updated successfully.',
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteReceipt = async (req, res, next) => {
  try {
    await deleteReceipt(req.user.id, req.params.id);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Receipt deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetReceiptFile = async (req, res, next) => {
  try {
    const { action = 'view' } = req.query;
    const fileResult = await getReceiptFileStream(req.user.id, req.params.id, action);

    res.setHeader('Content-Type', fileResult.contentType);
    res.setHeader('Content-Disposition', fileResult.contentDisposition);
    return res.send(fileResult.buffer);
  } catch (error) {
    next(error);
  }
};
