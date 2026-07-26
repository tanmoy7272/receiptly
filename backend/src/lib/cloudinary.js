import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Standard Simple Cloudinary Uploader
 */
export const uploadToCloudinary = (fileBuffer, mimetype, folder = 'receiptly') => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      const mockUrl = `https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80`;
      return resolve({
        secure_url: mockUrl,
        public_id: `mock_${Date.now()}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary Upload Failed:', error.message);
          return reject(error);
        }
        return resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes asset from Cloudinary
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured || !publicId || publicId.startsWith('mock_')) {
    return true;
  }
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    logger.error(`Cloudinary deletion failed for ${publicId}:`, error.message);
    return false;
  }
};
