/**
 * ============================================================================
 * Receipt Business Logic Service
 * ============================================================================
 * Purpose: Handles receipt CRUD persistence, Cloudinary file uploads & deletions,
 *          dynamic multi-field search filtering, and user data isolation.
 * Architecture Flow: Controller -> Receipt Service -> Prisma ORM -> Database
 * ============================================================================
 */
import prisma from '../lib/prisma.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary.js';

/**
 * Creates a new receipt, uploads attached file to Cloudinary, and saves to database.
 *
 * @param {string} userId - Authenticated user ID (enforces data isolation).
 * @param {Object} data - Validated receipt payload fields.
 * @param {Object} file - Multer uploaded file object.
 * @returns {Promise<Object>} Created Prisma receipt record.
 */
export const createReceipt = async (userId, data, file) => {
  if (!file) {
    const error = new Error('Receipt file (image or PDF) is required');
    error.statusCode = 400;
    throw error;
  }

  const uploadResult = await uploadToCloudinary(file.buffer, file.mimetype);
  const merchantNormalized = data.merchant.trim().toLowerCase();

  const receipt = await prisma.receipt.create({
    data: {
      title: data.title.trim(),
      merchant: data.merchant.trim(),
      merchantNormalized,
      amount: Number(data.amount),
      currency: data.currency || 'INR',
      purchaseDate: new Date(data.purchaseDate),
      category: data.category,
      notes: data.notes ? data.notes.trim() : null,
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      fileType: file.mimetype,
      userId,
      // Phase A Additions
      invoiceNumber: data.invoiceNumber ? data.invoiceNumber.trim() : null,
      merchantProvenance: data.merchantProvenance || 'MANUAL',
      amountProvenance: data.amountProvenance || 'MANUAL',
      hasWarranty: Boolean(data.hasWarranty === 'true' || data.hasWarranty === true),
      warrantyExpiryDate: data.warrantyExpiryDate ? new Date(data.warrantyExpiryDate) : null,
      warrantyMonths: data.warrantyMonths ? Number(data.warrantyMonths) : null,
      warrantySource: data.warrantySource || 'NONE',
    },
  });

  return receipt;
};

export const getUserReceipts = async (userId, queryParams = {}) => {
  const {
    search,
    category,
    currency,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    sortBy = 'newest',
    page = 1,
    limit = 10,
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Build dynamic Prisma filter conditions
  const where = { userId };

  // Case-insensitive search across title, merchant, merchantNormalized, notes, AND invoiceNumber
  if (search && String(search).trim()) {
    const searchNormalized = String(search).trim().toLowerCase();
    const searchRaw = String(search).trim();

    where.OR = [
      { title: { contains: searchRaw, mode: 'insensitive' } },
      { merchant: { contains: searchRaw, mode: 'insensitive' } },
      { merchantNormalized: { contains: searchNormalized, mode: 'insensitive' } },
      { notes: { contains: searchRaw, mode: 'insensitive' } },
      { invoiceNumber: { contains: searchRaw, mode: 'insensitive' } },
    ];
  }

  // Exact category filter
  if (category && String(category).trim()) {
    where.category = String(category).trim();
  }

  // Exact currency filter
  if (currency && String(currency).trim()) {
    where.currency = String(currency).trim();
  }

  // Date range filter
  const hasFromDate = Boolean(fromDate && String(fromDate).trim());
  const hasToDate = Boolean(toDate && String(toDate).trim());

  if (hasFromDate || hasToDate) {
    where.purchaseDate = {};
    if (hasFromDate) {
      where.purchaseDate.gte = new Date(fromDate);
    }
    if (hasToDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      where.purchaseDate.lte = endDate;
    }
  }

  // Amount range filter
  const hasMinAmount = minAmount !== undefined && minAmount !== null && String(minAmount).trim() !== '';
  const hasMaxAmount = maxAmount !== undefined && maxAmount !== null && String(maxAmount).trim() !== '';

  if (hasMinAmount || hasMaxAmount) {
    where.amount = {};
    if (hasMinAmount) {
      where.amount.gte = Number(minAmount);
    }
    if (hasMaxAmount) {
      where.amount.lte = Number(maxAmount);
    }
  }

  // Map sort options
  let orderBy = [{ purchaseDate: 'desc' }, { createdAt: 'desc' }];
  switch (sortBy) {
    case 'oldest':
      orderBy = [{ purchaseDate: 'asc' }, { createdAt: 'asc' }];
      break;
    case 'amount_desc':
      orderBy = [{ amount: 'desc' }];
      break;
    case 'amount_asc':
      orderBy = [{ amount: 'asc' }];
      break;
    case 'merchant_asc':
      orderBy = [{ merchant: 'asc' }];
      break;
    case 'merchant_desc':
      orderBy = [{ merchant: 'desc' }];
      break;
    default:
      break;
  }

  const [receipts, totalItems] = await Promise.all([
    prisma.receipt.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      select: {
        id: true,
        title: true,
        merchant: true,
        amount: true,
        currency: true,
        purchaseDate: true,
        category: true,
        fileUrl: true,
        fileType: true,
        aiExtractionStatus: true,
        createdAt: true,
        // Phase A Select Fields
        invoiceNumber: true,
        merchantProvenance: true,
        amountProvenance: true,
        hasWarranty: true,
        warrantyExpiryDate: true,
        warrantyMonths: true,
        warrantySource: true,
      },
    }),
    prisma.receipt.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limitNum) || 1;

  return {
    receipts,
    pagination: {
      totalItems,
      currentPage: pageNum,
      totalPages,
      pageSize: limitNum,
    },
  };
};

export const getReceiptById = async (userId, receiptId) => {
  const receipt = await prisma.receipt.findFirst({
    where: {
      id: receiptId,
      userId,
    },
  });

  if (!receipt) {
    const error = new Error('Receipt not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  return receipt;
};

export const updateReceipt = async (userId, receiptId, data, file) => {
  const existingReceipt = await getReceiptById(userId, receiptId);

  let fileUrl = existingReceipt.fileUrl;
  let filePublicId = existingReceipt.filePublicId;
  let fileType = existingReceipt.fileType;

  if (file) {
    if (existingReceipt.filePublicId) {
      await deleteFromCloudinary(existingReceipt.filePublicId, existingReceipt.fileType);
    }
    const uploadResult = await uploadToCloudinary(file.buffer, file.mimetype);
    fileUrl = uploadResult.secure_url;
    filePublicId = uploadResult.public_id;
    fileType = file.mimetype;
  }

  const updateData = {};
  if (data.title) updateData.title = data.title.trim();
  if (data.merchant) {
    updateData.merchant = data.merchant.trim();
    updateData.merchantNormalized = data.merchant.trim().toLowerCase();
  }
  if (data.amount !== undefined) updateData.amount = Number(data.amount);
  if (data.currency) updateData.currency = data.currency;
  if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
  if (data.category) updateData.category = data.category;
  if (data.notes !== undefined) updateData.notes = data.notes ? data.notes.trim() : null;

  // Phase A Field Updates
  if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber ? data.invoiceNumber.trim() : null;
  if (data.merchantProvenance) updateData.merchantProvenance = data.merchantProvenance;
  if (data.amountProvenance) updateData.amountProvenance = data.amountProvenance;
  if (data.hasWarranty !== undefined) updateData.hasWarranty = Boolean(data.hasWarranty === 'true' || data.hasWarranty === true);
  if (data.warrantyExpiryDate !== undefined) updateData.warrantyExpiryDate = data.warrantyExpiryDate ? new Date(data.warrantyExpiryDate) : null;
  if (data.warrantyMonths !== undefined) updateData.warrantyMonths = data.warrantyMonths ? Number(data.warrantyMonths) : null;
  if (data.warrantySource) updateData.warrantySource = data.warrantySource;

  updateData.fileUrl = fileUrl;
  updateData.filePublicId = filePublicId;
  updateData.fileType = fileType;

  const updatedReceipt = await prisma.receipt.update({
    where: { id: receiptId },
    data: updateData,
  });

  return updatedReceipt;
};

export const deleteReceipt = async (userId, receiptId) => {
  const existingReceipt = await getReceiptById(userId, receiptId);

  // 1. Delete database record first to maintain data consistency
  await prisma.receipt.delete({ where: { id: receiptId } });

  // 2. Clean up remote Cloudinary file asynchronously after DB deletion succeeds
  if (existingReceipt.filePublicId) {
    deleteFromCloudinary(existingReceipt.filePublicId, existingReceipt.fileType).catch((err) => {
      // Log warning if Cloudinary fails, but database is already safely updated
    });
  }

  return true;
};

export const getReceiptFileStream = async (userId, receiptId, action = 'view') => {
  const receipt = await getReceiptById(userId, receiptId);

  if (!receipt.fileUrl) {
    const error = new Error('No document file attached to this receipt');
    error.statusCode = 404;
    throw error;
  }

  const response = await fetch(receipt.fileUrl);
  if (!response.ok) {
    const error = new Error('Failed to retrieve file from storage');
    error.statusCode = 502;
    throw error;
  }

  const arrayBuf = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  const cleanTitle = (receipt.title || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
  const isPdf = receipt.fileType?.includes('pdf') || receipt.fileUrl?.endsWith('.pdf');
  const isDoc = receipt.fileType?.includes('word') || receipt.fileType?.includes('officedocument') || Boolean(receipt.fileUrl?.match(/\.(doc|docx)$/i));

  let ext = 'jpg';
  let mime = receipt.fileType || 'image/jpeg';

  if (isPdf) {
    ext = 'pdf';
    mime = 'application/pdf';
  } else if (isDoc) {
    ext = receipt.fileUrl?.endsWith('.doc') ? 'doc' : 'docx';
    mime = receipt.fileType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  const filename = `${cleanTitle}_${receipt.id.slice(0, 6)}.${ext}`;
  const disposition = action === 'download' ? 'attachment' : 'inline';

  return {
    buffer,
    contentType: mime,
    contentDisposition: `${disposition}; filename="${filename}"`,
  };
};
